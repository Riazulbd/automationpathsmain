import express from "express";
import multer from "multer";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { requireDashAuth } from "../middleware/dashAuth.js";
import {
  sbSelect,
  sbSelectOne,
  sbInsert,
  sbUpdate,
  sbUpsert,
  sbDelete,
  sbUploadImage,
  SupabaseError,
} from "../config/supabase.js";
import {
  slugify,
  sanitizePostHtml,
  htmlToText,
  countWords,
  readingTime,
  truncate,
} from "../utils/blog.js";
import { callOpenRouter } from "../services/openrouter.js";

// Admin blog CMS API. Mounted at /api/dashboard/blog behind requireDashAuth, so
// every route here requires the dashboard password → JWT. All Supabase access
// uses the service_role key (bypasses RLS).

const router = express.Router();
router.use(requireDashAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

const POST_LIST_FIELDS =
  "id,title,slug,status,excerpt,featured_image,category_id,published_at,scheduled_at," +
  "updated_at,created_at,view_count,word_count,reading_time,author_name," +
  "category:blog_categories(name,slug)";

function fail(res, error) {
  if (error instanceof SupabaseError) {
    return res.status(error.status).json({ error: error.message, detail: error.detail });
  }
  return res.status(500).json({ error: error.message || "Server error" });
}

function nowIso() {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Slug uniqueness
// ---------------------------------------------------------------------------
async function ensureUniqueSlug(base, excludeId) {
  let candidate = slugify(base) || `post-${Date.now()}`;
  let suffix = 1;
  // Loop until we find a free slug.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const q = `slug=eq.${encodeURIComponent(candidate)}&select=id&limit=1`;
    const existing = await sbSelectOne("blog_posts", q);
    if (!existing || existing.id === excludeId) return candidate;
    suffix += 1;
    candidate = `${slugify(base)}-${suffix}`;
  }
}

// ---------------------------------------------------------------------------
// Tags: resolve an array of names/slugs to tag ids (creating missing ones).
// ---------------------------------------------------------------------------
async function resolveTagIds(tagInputs) {
  const names = (Array.isArray(tagInputs) ? tagInputs : [])
    .map((t) => (typeof t === "string" ? t : t?.name || ""))
    .map((s) => s.trim())
    .filter(Boolean);

  const ids = [];
  for (const name of names) {
    const slug = slugify(name);
    if (!slug) continue;
    const row = await sbUpsert("blog_tags", { name, slug }, "slug");
    if (row?.id) ids.push(row.id);
  }
  return [...new Set(ids)];
}

async function syncPostTags(postId, tagInputs) {
  if (tagInputs === undefined) return; // not provided → leave as-is
  const ids = await resolveTagIds(tagInputs);
  await sbDelete("blog_post_tags", `post_id=eq.${postId}`);
  if (ids.length) {
    await sbInsert(
      "blog_post_tags",
      ids.map((tag_id) => ({ post_id: postId, tag_id })),
      { returning: "minimal" }
    );
  }
}

async function attachTags(post) {
  if (!post) return post;
  const { rows } = await sbSelect(
    "blog_post_tags",
    `post_id=eq.${post.id}&select=tag:blog_tags(id,name,slug)`
  );
  post.tags = rows.map((r) => r.tag).filter(Boolean);
  return post;
}

// ---------------------------------------------------------------------------
// Build a post payload from the request body (shared by create + update).
// ---------------------------------------------------------------------------
function buildPayload(body) {
  const payload = {};
  const set = (key, val) => {
    if (val !== undefined) payload[key] = val;
  };

  set("title", body.title != null ? String(body.title).trim() : undefined);
  set("excerpt", body.excerpt != null ? String(body.excerpt).trim() : undefined);
  set("featured_image", body.featured_image ?? undefined);
  set("featured_image_alt", body.featured_image_alt ?? undefined);
  set("category_id", body.category_id || null);
  set("author_name", body.author_name ?? undefined);
  set("author_title", body.author_title ?? undefined);
  set("author_bio", body.author_bio ?? undefined);
  set("author_credentials", body.author_credentials ?? undefined);
  set("author_avatar", body.author_avatar ?? undefined);
  set("author_url", body.author_url ?? undefined);
  set("author_linkedin", body.author_linkedin ?? undefined);
  set("author_twitter", body.author_twitter ?? undefined);

  // SEO
  set("meta_title", body.meta_title ?? undefined);
  set("meta_description", body.meta_description ?? undefined);
  set("focus_keyword", body.focus_keyword ?? undefined);
  set("keywords", body.keywords ?? undefined);
  set("canonical_url", body.canonical_url ?? undefined);
  set("og_title", body.og_title ?? undefined);
  set("og_description", body.og_description ?? undefined);
  set("og_image", body.og_image ?? undefined);
  if (body.schema_type) set("schema_type", body.schema_type);
  if (body.noindex !== undefined) set("noindex", Boolean(body.noindex));

  // Content → sanitize + derive text metrics
  if (body.content !== undefined) {
    const clean = sanitizePostHtml(body.content);
    const text = htmlToText(clean);
    const words = countWords(text);
    payload.content = clean;
    payload.content_text = text;
    payload.word_count = words;
    payload.reading_time = readingTime(words);
  }

  // Auto-generate an excerpt when it's blank and we have body text to draw from.
  if ((payload.excerpt === undefined || payload.excerpt === "") && payload.content_text) {
    payload.excerpt = truncate(payload.content_text, 180);
  }

  return payload;
}

// Apply status/publish-date transitions.
function applyStatus(payload, body, current) {
  const status = body.status || current?.status || "draft";
  payload.status = status;

  if (status === "published") {
    payload.published_at = body.published_at || current?.published_at || nowIso();
    payload.scheduled_at = null;
  } else if (status === "scheduled") {
    const when = body.scheduled_at || body.published_at;
    payload.scheduled_at = when || nowIso();
    payload.published_at = when || nowIso();
  } else {
    // draft
    if (body.published_at !== undefined) payload.published_at = body.published_at || null;
    else if (current == null) payload.published_at = null;
  }
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

// GET /posts?status=&search=&limit=&offset=
router.get("/posts", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    let query = `select=${POST_LIST_FIELDS}&order=updated_at.desc&limit=${limit}&offset=${offset}`;
    if (req.query.status && req.query.status !== "all") {
      query += `&status=eq.${encodeURIComponent(req.query.status)}`;
    }
    if (req.query.search) {
      query += `&title=ilike.*${encodeURIComponent(req.query.search)}*`;
    }
    const { rows, total } = await sbSelect("blog_posts", query, { count: true });
    return res.json({ posts: rows, total });
  } catch (error) {
    return fail(res, error);
  }
});

// GET /posts/:id
router.get("/posts/:id", async (req, res) => {
  try {
    const post = await sbSelectOne(
      "blog_posts",
      `id=eq.${req.params.id}&select=*,category:blog_categories(id,name,slug)`
    );
    if (!post) return res.status(404).json({ error: "Post not found" });
    await attachTags(post);
    return res.json({ post });
  } catch (error) {
    return fail(res, error);
  }
});

// POST /posts
router.post("/posts", async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.title || !String(body.title).trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    const payload = buildPayload(body);
    if (payload.content === undefined) payload.content = "";
    payload.slug = await ensureUniqueSlug(body.slug || body.title);
    applyStatus(payload, body, null);

    const created = await sbInsert("blog_posts", payload);
    await syncPostTags(created.id, body.tags);
    await attachTags(created);
    return res.status(201).json({ post: created });
  } catch (error) {
    return fail(res, error);
  }
});

// PATCH /posts/:id
router.patch("/posts/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const current = await sbSelectOne("blog_posts", `id=eq.${id}&select=*`);
    if (!current) return res.status(404).json({ error: "Post not found" });

    const body = req.body || {};
    const payload = buildPayload(body);

    if (body.slug !== undefined || body.title !== undefined) {
      const base = body.slug || body.title || current.title;
      if (body.slug !== undefined || (body.slug === undefined && body.regenerateSlug)) {
        payload.slug = await ensureUniqueSlug(base, id);
      }
    }
    if (body.status !== undefined || body.published_at !== undefined || body.scheduled_at !== undefined) {
      applyStatus(payload, body, current);
    }

    const updated = await sbUpdate("blog_posts", `id=eq.${id}`, payload);
    await syncPostTags(id, body.tags);
    await attachTags(updated);
    return res.json({ post: updated });
  } catch (error) {
    return fail(res, error);
  }
});

// DELETE /posts/:id
router.delete("/posts/:id", async (req, res) => {
  try {
    await sbDelete("blog_posts", `id=eq.${req.params.id}`);
    return res.json({ deleted: true });
  } catch (error) {
    return fail(res, error);
  }
});

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
router.get("/categories", async (_req, res) => {
  try {
    const { rows } = await sbSelect(
      "blog_categories",
      "select=id,name,slug,description&order=name.asc"
    );
    return res.json({ categories: rows });
  } catch (error) {
    return fail(res, error);
  }
});

router.post("/categories", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ error: "Name is required" });
    const row = await sbUpsert(
      "blog_categories",
      { name, slug: slugify(name), description: req.body?.description || null },
      "slug"
    );
    return res.status(201).json({ category: row });
  } catch (error) {
    return fail(res, error);
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    await sbDelete("blog_categories", `id=eq.${req.params.id}`);
    return res.json({ deleted: true });
  } catch (error) {
    return fail(res, error);
  }
});

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------
router.get("/tags", async (_req, res) => {
  try {
    const { rows } = await sbSelect("blog_tags", "select=id,name,slug&order=name.asc");
    return res.json({ tags: rows });
  } catch (error) {
    return fail(res, error);
  }
});

router.delete("/tags/:id", async (req, res) => {
  try {
    await sbDelete("blog_tags", `id=eq.${req.params.id}`);
    return res.json({ deleted: true });
  } catch (error) {
    return fail(res, error);
  }
});

// ---------------------------------------------------------------------------
// Image upload → sharp optimize → Supabase Storage
// ---------------------------------------------------------------------------
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });
    if (!/^image\//.test(req.file.mimetype)) {
      return res.status(400).json({ error: "File must be an image" });
    }

    const pipeline = sharp(req.file.buffer, { failOn: "none" }).rotate();
    const meta = await pipeline.metadata();
    const optimized = await pipeline
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const outMeta = await sharp(optimized).metadata();

    const now = new Date();
    const objectPath = `posts/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${uuidv4()}.webp`;
    const url = await sbUploadImage("blog-images", objectPath, optimized, "image/webp");

    return res.status(201).json({
      url,
      width: outMeta.width || meta.width || null,
      height: outMeta.height || meta.height || null,
    });
  } catch (error) {
    return fail(res, error);
  }
});

// ---------------------------------------------------------------------------
// Analytics — per-post views, unique visitors, referrers, geo
// ---------------------------------------------------------------------------
router.get("/analytics", async (req, res) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [{ rows: posts }, { rows: views }] = await Promise.all([
      sbSelect(
        "blog_posts",
        "select=id,title,slug,status,view_count,published_at&order=view_count.desc"
      ),
      sbSelect(
        "blog_post_views",
        `select=post_id,slug,visitor_id,referrer,country,city,created_at` +
          `&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=20000`
      ),
    ]);

    const postById = new Map(posts.map((p) => [p.id, p]));
    const byPost = new Map();
    const byDay = new Map();
    const byCountry = new Map();
    const byReferrer = new Map();
    const uniqueVisitors = new Set();

    const refClean = (r) => {
      if (!r) return "Direct / none";
      try {
        return new URL(r).hostname.replace(/^www\./, "");
      } catch {
        return r.slice(0, 60);
      }
    };

    for (const v of views) {
      const day = (v.created_at || "").slice(0, 10);
      byDay.set(day, (byDay.get(day) || 0) + 1);
      if (v.visitor_id) uniqueVisitors.add(v.visitor_id);
      if (v.country) byCountry.set(v.country, (byCountry.get(v.country) || 0) + 1);
      const ref = refClean(v.referrer);
      byReferrer.set(ref, (byReferrer.get(ref) || 0) + 1);

      const key = v.post_id || v.slug;
      if (!byPost.has(key)) byPost.set(key, { views: 0, visitors: new Set() });
      const b = byPost.get(key);
      b.views += 1;
      if (v.visitor_id) b.visitors.add(v.visitor_id);
    }

    const perPost = posts.map((p) => {
      const b = byPost.get(p.id);
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status,
        total_views: p.view_count || 0,
        period_views: b ? b.views : 0,
        period_visitors: b ? b.visitors.size : 0,
      };
    });

    const topRef = [...byReferrer.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const countries = [...byCountry.entries()]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
    const trend = [...byDay.entries()]
      .map(([day, views]) => ({ day, views }))
      .sort((a, b) => a.day.localeCompare(b.day));

    return res.json({
      range_days: days,
      total_posts: posts.length,
      published_posts: posts.filter((p) => p.status === "published").length,
      period_views: views.length,
      unique_visitors: uniqueVisitors.size,
      all_time_views: posts.reduce((s, p) => s + (p.view_count || 0), 0),
      per_post: perPost.sort((a, b) => b.period_views - a.period_views),
      trend,
      top_referrers: topRef,
      countries,
      sampled: views.length >= 20000,
    });
  } catch (error) {
    return fail(res, error);
  }
});

// ---------------------------------------------------------------------------
// AI assist (OpenRouter)
// ---------------------------------------------------------------------------
function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

router.post("/ai", async (req, res) => {
  const action = String(req.body?.action || "");
  try {
    if (action === "draft") {
      const topic = String(req.body?.topic || req.body?.title || "").trim();
      if (!topic) return res.status(400).json({ error: "Provide a topic or title" });
      const keywords = String(req.body?.keywords || "").trim();
      const system =
        "You are an expert SEO content writer. Write original, genuinely useful, well-structured " +
        "long-form blog articles optimized to rank on Google. Use semantic HTML (h2, h3, p, ul, ol, " +
        "li, strong, blockquote) — NO <html>, <head>, <body> or <h1> tags (the title is separate). " +
        "Write in a clear, authoritative, human voice. Respond ONLY with strict JSON.";
      const user =
        `Write a comprehensive blog post about: "${topic}".` +
        (keywords ? ` Target keywords: ${keywords}.` : "") +
        ` Return JSON: {"title": string, "excerpt": string (max 160 chars), ` +
        `"meta_description": string (max 160 chars), "keywords": string (comma separated), ` +
        `"content": string (the article body as clean HTML, ~900-1400 words with h2/h3 sections)}.`;
      const out = await callOpenRouter(system, user, { temperature: 0.6, maxTokens: 4000 });
      const json = extractJson(out);
      if (!json) return res.status(502).json({ error: "AI returned an unparseable response" });
      json.content = sanitizePostHtml(json.content || "");
      return res.json({ result: json });
    }

    if (action === "improve") {
      const content = String(req.body?.content || "").trim();
      if (!content) return res.status(400).json({ error: "No content to improve" });
      const instruction = String(req.body?.instruction || "Improve clarity, flow, and SEO. Keep the meaning.");
      const system =
        "You are an expert editor. Improve the given HTML article body while preserving its meaning " +
        "and HTML structure (h2/h3/p/ul/li/strong/blockquote only, no h1/html/head/body). " +
        'Respond ONLY with strict JSON: {"content": string}.';
      const user = `Instruction: ${instruction}\n\nHTML to improve:\n${content}`;
      const out = await callOpenRouter(system, user, { temperature: 0.4, maxTokens: 4000 });
      const json = extractJson(out);
      if (!json?.content) return res.status(502).json({ error: "AI returned an unparseable response" });
      return res.json({ result: { content: sanitizePostHtml(json.content) } });
    }

    if (action === "seo") {
      const title = String(req.body?.title || "").trim();
      const content = htmlToText(String(req.body?.content || "")).slice(0, 6000);
      if (!title && !content) return res.status(400).json({ error: "Provide a title or content" });
      const system =
        "You are an SEO specialist. Given an article, produce optimized metadata. " +
        'Respond ONLY with strict JSON: {"meta_title": string (50-60 chars), ' +
        '"meta_description": string (140-160 chars), "focus_keyword": string, ' +
        '"keywords": string (comma separated, 5-8), "excerpt": string (max 180 chars)}.';
      const user = `Title: ${title}\n\nArticle:\n${content}`;
      const out = await callOpenRouter(system, user, { temperature: 0.3, maxTokens: 800 });
      const json = extractJson(out);
      if (!json) return res.status(502).json({ error: "AI returned an unparseable response" });
      return res.json({ result: json });
    }

    return res.status(400).json({ error: `Unknown AI action: ${action}` });
  } catch (error) {
    const msg = error.message || "AI request failed";
    const status = /api key/i.test(msg) ? 400 : 502;
    return res.status(status).json({ error: msg });
  }
});

export default router;

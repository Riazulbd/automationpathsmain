import express from "express";
import { sbSelect, sbSelectOne, sbInsert, sbRpc, SupabaseError } from "../config/supabase.js";

// Public blog API — reads PUBLISHED posts and records views. No auth.
// Everything runs server-side with the service_role key so we can attach geo to
// views and enforce the "published only" rule centrally.

const router = express.Router();

const LIST_FIELDS =
  "id,title,slug,excerpt,featured_image,featured_image_alt,category_id,status," +
  "published_at,updated_at,reading_time,word_count,view_count,author_name,author_avatar," +
  "category:blog_categories(name,slug)";

const FULL_FIELDS =
  "id,title,slug,excerpt,content,content_text,featured_image,featured_image_alt," +
  "category_id,status,published_at,updated_at,created_at,reading_time,word_count," +
  "view_count,author_name,author_avatar,meta_title,meta_description,focus_keyword," +
  "keywords,canonical_url,og_title,og_description,og_image,schema_type,noindex," +
  "category:blog_categories(name,slug,description)";

function nowIso() {
  return new Date().toISOString();
}

// Visibility filter: published, and not future-dated.
function publishedFilter() {
  return `status=eq.published&published_at=lte.${encodeURIComponent(nowIso())}`;
}

async function attachTags(post) {
  if (!post) return post;
  const { rows } = await sbSelect(
    "blog_post_tags",
    `post_id=eq.${post.id}&select=tag:blog_tags(name,slug)`
  );
  post.tags = rows.map((r) => r.tag).filter(Boolean);
  return post;
}

function handleError(res, error) {
  if (error instanceof SupabaseError) {
    return res.status(error.status).json({ error: error.message, detail: error.detail });
  }
  return res.status(500).json({ error: error.message || "Server error" });
}

// GET /api/blog/posts?limit=&offset=&category=&tag=
router.get("/posts", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 24, 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    let query = `select=${LIST_FIELDS}&${publishedFilter()}&order=published_at.desc` +
      `&limit=${limit}&offset=${offset}`;

    if (req.query.category) {
      const cat = await sbSelectOne(
        "blog_categories",
        `slug=eq.${encodeURIComponent(req.query.category)}&select=id`
      );
      if (!cat) return res.json({ posts: [], total: 0 });
      query += `&category_id=eq.${cat.id}`;
    }

    // Tag filter: resolve post ids via the join table first.
    if (req.query.tag) {
      const tag = await sbSelectOne(
        "blog_tags",
        `slug=eq.${encodeURIComponent(req.query.tag)}&select=id`
      );
      if (!tag) return res.json({ posts: [], total: 0 });
      const { rows: links } = await sbSelect(
        "blog_post_tags",
        `tag_id=eq.${tag.id}&select=post_id`
      );
      const ids = links.map((l) => l.post_id);
      if (!ids.length) return res.json({ posts: [], total: 0 });
      query += `&id=in.(${ids.join(",")})`;
    }

    const { rows, total } = await sbSelect("blog_posts", query, { count: true });
    return res.json({ posts: rows, total });
  } catch (error) {
    return handleError(res, error);
  }
});

// GET /api/blog/posts/:slug  — single published post (with tags)
router.get("/posts/:slug", async (req, res) => {
  try {
    const post = await sbSelectOne(
      "blog_posts",
      `slug=eq.${encodeURIComponent(req.params.slug)}&${publishedFilter()}&select=${FULL_FIELDS}`
    );
    if (!post) return res.status(404).json({ error: "Post not found" });
    await attachTags(post);
    return res.json({ post });
  } catch (error) {
    return handleError(res, error);
  }
});

// GET /api/blog/categories
router.get("/categories", async (_req, res) => {
  try {
    const { rows } = await sbSelect("blog_categories", "select=id,name,slug,description&order=name.asc");
    return res.json({ categories: rows });
  } catch (error) {
    return handleError(res, error);
  }
});

// GET /api/blog/tags
router.get("/tags", async (_req, res) => {
  try {
    const { rows } = await sbSelect("blog_tags", "select=id,name,slug&order=name.asc");
    return res.json({ tags: rows });
  } catch (error) {
    return handleError(res, error);
  }
});

const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|vkshare|whatsapp|preview|scrape|lighthouse|headless/i;

function geoFromHeaders(req) {
  const h = req.headers;
  const dec = (v) => {
    if (!v) return null;
    try {
      return decodeURIComponent(String(v)).trim() || null;
    } catch {
      return String(v).trim() || null;
    }
  };
  const country =
    dec(h["cf-ipcountry"]) ||
    dec(h["x-vercel-ip-country"]) ||
    dec(h["x-country-code"]) ||
    dec(h["x-geo-country"]) ||
    null;
  const city =
    dec(h["x-vercel-ip-city"]) ||
    dec(h["cf-ipcity"]) ||
    dec(h["x-geo-city"]) ||
    null;
  return {
    country: country && country !== "XX" ? country : null,
    city,
  };
}

// POST /api/blog/track  { slug, visitor_id }  — record a view (best-effort).
router.post("/track", async (req, res) => {
  try {
    const slug = String(req.body?.slug || "").trim();
    if (!slug) return res.status(400).json({ error: "slug required" });

    const ua = req.headers["user-agent"] || "";
    if (BOT_RE.test(ua)) return res.json({ tracked: false, reason: "bot" });

    const post = await sbSelectOne(
      "blog_posts",
      `slug=eq.${encodeURIComponent(slug)}&${publishedFilter()}&select=id`
    );
    if (!post) return res.json({ tracked: false, reason: "not-found" });

    const { country, city } = geoFromHeaders(req);
    await sbInsert(
      "blog_post_views",
      {
        post_id: post.id,
        slug,
        visitor_id: req.body?.visitor_id || null,
        referrer: (req.body?.referrer || req.headers.referer || null) ?? null,
        country,
        city,
      },
      { returning: "minimal" }
    );
    // Best-effort denormalized counter bump.
    sbRpc("increment_blog_view", { p_post_id: post.id }).catch(() => {});

    return res.json({ tracked: true });
  } catch (error) {
    // Never let analytics break the page.
    return res.json({ tracked: false, error: error.message });
  }
});

export default router;

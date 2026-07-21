import express from "express";
import { Feed } from "feed";
import { sbSelect } from "../config/supabase.js";
import { getSiteUrl } from "../services/ssr.js";
import { truncate, escapeHtml } from "../utils/blog.js";

// SEO endpoints: sitemap.xml, feed.xml, robots.txt.
// These are what get new posts discovered and indexed by Google automatically.

const router = express.Router();

// Static, always-indexable pages.
const STATIC_PAGES = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/blog", priority: "0.9", changefreq: "daily" },
];

async function fetchPublished() {
  const { rows } = await sbSelect(
    "blog_posts",
    "select=slug,updated_at,published_at&status=eq.published&order=published_at.desc&limit=1000"
  );
  return rows;
}

router.get("/sitemap.xml", async (_req, res) => {
  const site = getSiteUrl();
  let posts = [];
  let categories = [];
  let tags = [];
  try {
    posts = await fetchPublished();
    categories = (await sbSelect("blog_categories", "select=slug")).rows;
    tags = (await sbSelect("blog_tags", "select=slug")).rows;
  } catch {
    /* fall through — still emit static pages */
  }

  const urls = [
    ...STATIC_PAGES.map((p) => ({ loc: `${site}${p.loc}`, priority: p.priority, changefreq: p.changefreq })),
    ...posts.map((p) => ({
      loc: `${site}/blog/${p.slug}`,
      lastmod: (p.updated_at || p.published_at || "").slice(0, 10),
      priority: "0.8",
      changefreq: "monthly",
    })),
    ...categories.map((c) => ({ loc: `${site}/blog/category/${c.slug}`, priority: "0.5", changefreq: "weekly" })),
    ...tags.map((t) => ({ loc: `${site}/blog/tag/${t.slug}`, priority: "0.4", changefreq: "weekly" })),
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${escapeHtml(u.loc)}</loc>\n` +
          (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : "") +
          `    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
      )
      .join("\n") +
    `\n</urlset>\n`;

  res.type("application/xml").send(body);
});

router.get("/feed.xml", async (_req, res) => {
  const site = getSiteUrl();
  const feed = new Feed({
    title: "Automation Paths Blog",
    description: "Revenue systems, CRM architecture, Voice AI, and automation playbooks.",
    id: `${site}/blog`,
    link: `${site}/blog`,
    language: "en",
    favicon: `${site}/favicon.svg`,
    copyright: `All rights reserved ${new Date().getUTCFullYear()}, Automation Paths`,
    feedLinks: { rss: `${site}/feed.xml` },
    author: { name: "Riazul Islam", link: site },
  });

  try {
    const { rows } = await sbSelect(
      "blog_posts",
      "select=title,slug,excerpt,content_text,published_at,updated_at,featured_image,author_name" +
        "&status=eq.published&order=published_at.desc&limit=30"
    );
    for (const p of rows) {
      const link = `${site}/blog/${p.slug}`;
      feed.addItem({
        title: p.title,
        id: link,
        link,
        description: p.excerpt || truncate(p.content_text || "", 200),
        author: [{ name: p.author_name || "Riazul Islam", link: site }],
        date: new Date(p.published_at || p.updated_at || Date.now()),
        image: p.featured_image || undefined,
      });
    }
  } catch {
    /* emit an empty but valid feed */
  }

  res.type("application/rss+xml").send(feed.rss2());
});

router.get("/robots.txt", (_req, res) => {
  const site = getSiteUrl();
  const body =
    `User-agent: *\n` +
    `Allow: /\n` +
    `Disallow: /dashboard\n` +
    `Disallow: /funnel-quiz/admin\n\n` +
    `Sitemap: ${site}/sitemap.xml\n`;
  res.type("text/plain").send(body);
});

export default router;

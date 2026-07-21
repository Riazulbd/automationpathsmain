import { sbSelectOne, sbSelect } from "../config/supabase.js";
import { escapeHtml, truncate, htmlToText } from "../utils/blog.js";

// Server-side SEO injection for /blog routes.
//
// The site is a client-rendered SPA. For blog pages we rewrite the cached
// index.html BEFORE sending it, injecting per-post <title>, meta, canonical,
// OpenGraph/Twitter tags, JSON-LD structured data, and the article text into the
// existing #seo-content block. This makes posts reliably indexable and gives
// correct social-share previews (crawlers that don't run JS still get real
// content). React then hydrates the full styled page for humans.

export function getSiteUrl() {
  return (process.env.SITE_URL || "https://automationpaths.com").replace(/\/+$/, "");
}

// ---- HTML head manipulation ------------------------------------------------

function setTitle(html, title) {
  const t = escapeHtml(title);
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${t}</title>`);
  }
  return html.replace(/<\/head>/i, `    <title>${t}</title>\n  </head>`);
}

function upsertMeta(html, attr, key, content) {
  const val = escapeHtml(content);
  const withContent = new RegExp(
    `(<meta\\s+${attr}=["']${key.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}["'][^>]*\\bcontent=["'])[^"']*(["'])`,
    "i"
  );
  if (withContent.test(html)) return html.replace(withContent, `$1${val}$2`);

  const noContent = new RegExp(
    `<meta\\s+${attr}=["']${key.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}["'][^>]*>`,
    "i"
  );
  const tag = `<meta ${attr}="${key}" content="${val}" />`;
  if (noContent.test(html)) return html.replace(noContent, tag);

  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function upsertCanonical(html, href) {
  const val = escapeHtml(href);
  const re = /(<link\s+rel=["']canonical["'][^>]*\bhref=["'])[^"']*(["'])/i;
  if (re.test(html)) return html.replace(re, `$1${val}$2`);
  return html.replace(/<\/head>/i, `    <link rel="canonical" href="${val}" />\n  </head>`);
}

function upsertRobots(html, content) {
  return upsertMeta(html, "name", "robots", content);
}

function injectJsonLd(html, objects) {
  // Tagged with data-seo-schema so the client-side SEOHead reconciles (reuses)
  // these nodes on SPA navigation instead of appending duplicates.
  const scripts = objects
    .map(
      (obj) =>
        `    <script type="application/ld+json" data-seo-schema="automation-paths">${JSON.stringify(
          obj
        ).replace(/</g, "\\u003c")}</script>`
    )
    .join("\n");
  return html.replace(/<\/head>/i, `${scripts}\n  </head>`);
}

function setSeoContent(html, inner) {
  const re = /(<div id="seo-content"[^>]*>)[\s\S]*?(<\/div>)/i;
  if (re.test(html)) return html.replace(re, `$1${inner}$2`);
  // Fallback: inject just before #root
  return html.replace(
    /<div id="root">/i,
    `<div id="seo-content" aria-hidden="true" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);">${inner}</div>\n    <div id="root">`
  );
}

function setSocialImage(html, imageUrl) {
  let out = html;
  if (imageUrl) {
    out = upsertMeta(out, "property", "og:image", imageUrl);
    out = upsertMeta(out, "name", "twitter:image", imageUrl);
  }
  return out;
}

// ---- Schema builders -------------------------------------------------------

function authorSchema(post, siteUrl) {
  const sameAs = [post.author_linkedin, post.author_twitter, post.author_url].filter(Boolean);
  const author = {
    "@type": "Person",
    name: post.author_name || "Riazul Islam",
    url: post.author_url || siteUrl,
  };
  if (post.author_title) author.jobTitle = post.author_title;
  if (post.author_bio) author.description = post.author_bio;
  if (post.author_credentials) author.knowsAbout = post.author_credentials;
  if (post.author_avatar) author.image = post.author_avatar;
  if (sameAs.length) author.sameAs = sameAs;
  return author;
}

function postSchema(post, siteUrl, url) {
  const image = post.og_image || post.featured_image || `${siteUrl}/og-default.svg`;
  return {
    "@context": "https://schema.org",
    "@type": post.schema_type || "BlogPosting",
    headline: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || "",
    image: [image],
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: authorSchema(post, siteUrl),
    publisher: {
      "@type": "Organization",
      name: "Automation Paths",
      logo: { "@type": "ImageObject", url: `${siteUrl}/favicon.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: post.keywords || post.focus_keyword || undefined,
    wordCount: post.word_count || undefined,
    url,
  };
}

function breadcrumbSchema(post, siteUrl, url) {
  const items = [
    { name: "Home", item: siteUrl },
    { name: "Blog", item: `${siteUrl}/blog` },
  ];
  if (post.category?.name) {
    items.push({ name: post.category.name, item: `${siteUrl}/blog/category/${post.category.slug}` });
  }
  items.push({ name: post.title, item: url });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.item,
    })),
  };
}

// ---- Public entry point ----------------------------------------------------

// Returns the rewritten HTML, or null if this path isn't a blog page we handle
// (caller should then send the untouched SPA shell).
export async function renderBlogHtml(baseHtml, pathname) {
  const siteUrl = getSiteUrl();

  // /blog/:slug  (but not /blog/category/... or /blog/tag/...)
  const postMatch = pathname.match(/^\/blog\/(?!category\/|tag\/)([^/]+)\/?$/);
  if (postMatch) {
    const slug = decodeURIComponent(postMatch[1]);
    let post = null;
    try {
      post = await sbSelectOne(
        "blog_posts",
        `slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=*,category:blog_categories(name,slug)`
      );
    } catch {
      return null; // Supabase down → serve SPA shell
    }
    if (!post) {
      // Unknown/unpublished → keep the SPA (which shows its own 404) but noindex.
      return upsertRobots(baseHtml, "noindex, follow");
    }

    const url = post.canonical_url || `${siteUrl}/blog/${post.slug}`;
    const title = post.meta_title || `${post.title} | Automation Paths`;
    const desc = post.meta_description || post.excerpt || truncate(htmlToText(post.content), 160);
    const image = post.og_image || post.featured_image || `${siteUrl}/og-default.svg`;

    let out = baseHtml;
    out = setTitle(out, title);
    out = upsertMeta(out, "name", "description", desc);
    out = upsertMeta(out, "property", "og:title", post.og_title || post.title);
    out = upsertMeta(out, "property", "og:description", post.og_description || desc);
    out = upsertMeta(out, "property", "og:url", url);
    out = upsertMeta(out, "property", "og:type", "article");
    out = upsertMeta(out, "property", "article:published_time", post.published_at || post.created_at || "");
    out = upsertMeta(out, "property", "article:modified_time", post.updated_at || "");
    out = upsertMeta(out, "name", "twitter:title", post.og_title || post.title);
    out = upsertMeta(out, "name", "twitter:description", post.og_description || desc);
    out = setSocialImage(out, image);
    out = upsertCanonical(out, url);
    out = upsertRobots(out, post.noindex ? "noindex, follow" : "index, follow");
    out = injectJsonLd(out, [postSchema(post, siteUrl, url), breadcrumbSchema(post, siteUrl, url)]);

    const featured = post.featured_image
      ? `<img src="${escapeHtml(post.featured_image)}" alt="${escapeHtml(post.featured_image_alt || post.title)}" />`
      : "";
    const byline = post.author_name
      ? `<p>By ${escapeHtml(post.author_name)}${post.author_title ? `, ${escapeHtml(post.author_title)}` : ""}</p>`
      : "";
    const authorBox = post.author_bio
      ? `<footer><h2>About the author</h2><p><strong>${escapeHtml(post.author_name)}</strong>${post.author_title ? ` — ${escapeHtml(post.author_title)}` : ""}</p><p>${escapeHtml(post.author_bio)}</p>${post.author_credentials ? `<p>${escapeHtml(post.author_credentials)}</p>` : ""}</footer>`
      : "";
    const inner =
      `<article><h1>${escapeHtml(post.title)}</h1>` +
      byline +
      (post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : "") +
      featured +
      post.content +
      authorBox +
      `</article>`;
    out = setSeoContent(out, inner);
    return out;
  }

  // /blog  (index)
  if (/^\/blog\/?$/.test(pathname)) {
    let posts = [];
    try {
      const { rows } = await sbSelect(
        "blog_posts",
        "select=title,slug,excerpt,published_at&status=eq.published&order=published_at.desc&limit=20"
      );
      posts = rows;
    } catch {
      posts = [];
    }
    const url = `${siteUrl}/blog`;
    const title = "Blog | Automation Paths — Revenue Systems & AI Automation";
    const desc =
      "Guides and playbooks on CRM architecture, Voice AI, SMS automation, and revenue systems for agencies, coaches, and consultants.";
    let out = baseHtml;
    out = setTitle(out, title);
    out = upsertMeta(out, "name", "description", desc);
    out = upsertMeta(out, "property", "og:title", title);
    out = upsertMeta(out, "property", "og:description", desc);
    out = upsertMeta(out, "property", "og:url", url);
    out = upsertMeta(out, "property", "og:type", "website");
    out = upsertMeta(out, "name", "twitter:title", title);
    out = upsertMeta(out, "name", "twitter:description", desc);
    out = upsertCanonical(out, url);
    out = upsertRobots(out, "index, follow");
    out = injectJsonLd(out, [
      {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "Automation Paths Blog",
        url,
        blogPost: posts.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: `${siteUrl}/blog/${p.slug}`,
          datePublished: p.published_at,
          description: p.excerpt || "",
        })),
      },
    ]);
    const inner =
      `<h1>Automation Paths Blog</h1><p>${escapeHtml(desc)}</p><ul>` +
      posts
        .map(
          (p) =>
            `<li><a href="${siteUrl}/blog/${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a> — ${escapeHtml(
              p.excerpt || ""
            )}</li>`
        )
        .join("") +
      `</ul>`;
    out = setSeoContent(out, inner);
    return out;
  }

  // /blog/category/:slug  and  /blog/tag/:slug
  const taxMatch = pathname.match(/^\/blog\/(category|tag)\/([^/]+)\/?$/);
  if (taxMatch) {
    const kind = taxMatch[1];
    const slug = decodeURIComponent(taxMatch[2]);
    const table = kind === "category" ? "blog_categories" : "blog_tags";
    let name = slug;
    try {
      const row = await sbSelectOne(table, `slug=eq.${encodeURIComponent(slug)}&select=name`);
      if (row?.name) name = row.name;
    } catch {
      /* ignore */
    }
    const label = kind === "category" ? name : `#${name}`;
    const url = `${siteUrl}/blog/${kind}/${slug}`;
    const title = `${label} — Automation Paths Blog`;
    const desc = `Articles about ${name} from Automation Paths.`;
    let out = baseHtml;
    out = setTitle(out, title);
    out = upsertMeta(out, "name", "description", desc);
    out = upsertMeta(out, "property", "og:title", title);
    out = upsertMeta(out, "property", "og:description", desc);
    out = upsertMeta(out, "property", "og:url", url);
    out = upsertCanonical(out, url);
    out = upsertRobots(out, "index, follow");
    out = setSeoContent(out, `<h1>${escapeHtml(label)}</h1><p>${escapeHtml(desc)}</p>`);
    return out;
  }

  return null;
}

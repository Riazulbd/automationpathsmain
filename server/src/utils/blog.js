import sanitizeHtml from "sanitize-html";

// URL-safe slug from arbitrary text.
export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Allow the rich set of tags the block editor can produce, but strip anything
// that could execute (scripts, event handlers, iframes except trusted embeds).
const SANITIZE_OPTIONS = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "a", "ul", "ol", "li", "blockquote", "pre", "code",
    "strong", "b", "em", "i", "u", "s", "del", "mark", "sub", "sup",
    "br", "hr", "span", "div",
    "img", "figure", "figcaption",
    "table", "thead", "tbody", "tr", "th", "td",
    "iframe",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    span: ["style", "class"],
    div: ["style", "class", "data-youtube-video"],
    p: ["style", "class"],
    code: ["class"],
    pre: ["class"],
    th: ["colspan", "rowspan", "style"],
    td: ["colspan", "rowspan", "style"],
    iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "title"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  // Only allow iframes from trusted video embeds.
  allowedIframeHostnames: ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"],
  allowedStyles: {
    "*": {
      "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
    },
  },
  transformTags: {
    // Force safe rel on links that open in a new tab.
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, false),
  },
};

export function sanitizePostHtml(html) {
  return sanitizeHtml(String(html || ""), SANITIZE_OPTIONS);
}

// Strip HTML → plaintext (for word count, reading time, meta fallbacks).
export function htmlToText(html) {
  return sanitizeHtml(String(html || ""), { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(text) {
  const t = String(text || "").trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

// ~200 wpm, min 1 minute.
export function readingTime(wordCount) {
  return Math.max(1, Math.round(wordCount / 200));
}

// Truncate to a clean length for meta descriptions / excerpts.
export function truncate(text, max = 160) {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, "").trim() + "…";
}

// Escape for safe interpolation into HTML/XML.
export function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

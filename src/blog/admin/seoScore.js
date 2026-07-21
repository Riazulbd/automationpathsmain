// Deterministic content grader — three categories, RankMath/Frase style:
//   EEAT — Google's quality-rater signals (author, trust, expertise, authority)
//   GEO  — Generative Engine Optimization (how well AI can extract/cite you)
//   SEO  — traditional on-page search signals
//
// 100% logic, no network, no AI — so scores are accurate and reproducible, and
// update live as you type. Everything measured here is an objective property of
// the post (fields present, links, dates, structure, keyword usage, readability).

const SITE_HOST = "automationpaths.com";

// ---- syllable + readability helpers (Flesch Reading Ease) ------------------
function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  return groups ? groups.length : 1;
}

function fleschReadingEase(rawText) {
  const sentences = rawText.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const words = rawText.split(/\s+/).filter(Boolean);
  if (!sentences.length || !words.length) return null;
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const score = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ---- parse the post content HTML into structured signals -------------------
function parse(html) {
  const empty = {
    text: "", raw: "", words: 0, headings: [], questionHeadings: 0, images: [],
    internal: 0, external: 0, lists: 0, tables: 0, stats: 0, definitions: 0,
    hasTakeaways: false, firstParaWords: 0, firstChunk: "", flesch: null,
  };
  if (typeof window === "undefined" || !window.DOMParser) return empty;

  const doc = new DOMParser().parseFromString(html || "", "text/html");
  const raw = (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  const lower = raw.toLowerCase();
  const words = raw ? raw.split(/\s+/).length : 0;

  const headingEls = [...doc.querySelectorAll("h2, h3, h4")];
  const headings = headingEls.map((h) => (h.textContent || "").trim());
  const questionHeadings = headings.filter((h) => h.includes("?") || /^(how|what|why|when|where|who|which|can|should|is|are|do|does)\b/i.test(h)).length;

  const images = [...doc.querySelectorAll("img")].map((img) => ({ alt: (img.getAttribute("alt") || "").trim() }));
  const links = [...doc.querySelectorAll("a[href]")].map((a) => a.getAttribute("href") || "");
  const internal = links.filter((h) => h.startsWith("/") || h.startsWith("#") || h.includes(SITE_HOST)).length;
  const external = links.filter((h) => /^https?:\/\//i.test(h) && !h.includes(SITE_HOST)).length;

  const lists = doc.querySelectorAll("ul, ol").length;
  const tables = doc.querySelectorAll("table").length;

  // Citable data: distinct numeric/stat tokens (percentages, money, counts).
  const stats = (raw.match(/(\$\s?\d[\d,.]*|\d[\d,.]*\s?%|\b\d[\d,.]{1,}\b)/g) || []).length;

  // Definition-style phrasing helps AI answer "what is X".
  const definitions = (lower.match(/\b(is|are)\s+(a|an|the)\b|\brefers to\b|\bis defined as\b|\bmeans that\b/g) || []).length;

  const hasTakeaways = /\b(key takeaway|takeaways|in summary|to summar|tl;dr|key point|bottom line|in conclusion)\b/i.test(raw)
    || headings.some((h) => /(takeaway|summary|key point|tl;dr|conclusion|recap)/i.test(h));

  const firstP = doc.querySelector("p");
  const firstParaText = (firstP?.textContent || raw.slice(0, 300)).trim();
  const firstParaWords = firstParaText ? firstParaText.split(/\s+/).length : 0;
  const firstChunk = raw.split(/\s+/).slice(0, 120).join(" ").toLowerCase();

  return {
    text: lower, raw, words, headings, questionHeadings, images, internal, external,
    lists, tables, stats, definitions, hasTakeaways, firstParaWords, firstChunk,
    flesch: fleschReadingEase(raw),
  };
}

function occurrences(haystack, needle) {
  if (!needle) return 0;
  const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = haystack.match(new RegExp(esc, "gi"));
  return m ? m.length : 0;
}

function scoreOf(status) {
  return status === "good" ? 1 : status === "ok" ? 0.5 : 0;
}
function roll(checks) {
  if (!checks.length) return 0;
  return Math.round((checks.reduce((s, c) => s + scoreOf(c.status), 0) / checks.length) * 100);
}
function tally(checks) {
  return {
    passed: checks.filter((c) => c.status === "good").length,
    warnings: checks.filter((c) => c.status === "ok").length,
    failed: checks.filter((c) => c.status === "bad").length,
  };
}

const monthsSince = (iso) => {
  if (!iso) return 0; // treat "no date yet" (new draft) as fresh
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return (Date.now() - then) / (1000 * 60 * 60 * 24 * 30.44);
};

// ---------------------------------------------------------------------------
export function analyzeContent(form) {
  const c = parse(form.content || "");
  const kw = (form.focus_keyword || "").trim().toLowerCase();

  const profileLinks = [form.author_linkedin, form.author_twitter, form.author_url].filter((v) => (v || "").trim());
  const ageMonths = monthsSince(form.published_at || form.updated_at);

  // ===== EEAT =====
  const eeat = [];
  const eAdd = (id, status, label, tip) => eeat.push({ id, status, label, tip });
  eAdd("author", form.author_name ? "good" : "bad", "Named author (not anonymous)", "Attribute the post to a real, named person.");
  eAdd("title", (form.author_title || "").trim() ? "good" : "bad", "Author job title / role", "State the author's role to signal expertise.");
  eAdd("bio", (form.author_bio || "").trim().length >= 40 ? "good" : (form.author_bio || "").trim() ? "ok" : "bad", "Author bio present", "Add a bio (40+ chars) describing who wrote this and why they're qualified.");
  eAdd("credentials", (form.author_credentials || "").trim() ? "good" : "bad", "Expertise / credentials stated", "List credentials, results, or experience (e.g. '7+ years, $59M revenue').");
  eAdd("linkedin", (form.author_linkedin || "").trim() ? "good" : "ok", "LinkedIn profile linked", "Link the author's LinkedIn — a strong authority signal.");
  eAdd("social", profileLinks.length >= 2 ? "good" : profileLinks.length === 1 ? "ok" : "bad", `Author profile links (${profileLinks.length})`, "Link 2+ author profiles (LinkedIn, X, personal site) as sameAs signals.");
  eAdd("sources", c.external >= 2 ? "good" : c.external === 1 ? "ok" : "bad", `Cites external sources (${c.external})`, "Cite authoritative external sources to build trust.");
  eAdd("fresh", ageMonths <= 12 ? "good" : ageMonths <= 24 ? "ok" : "bad", "Content is fresh (updated recently)", "Keep content updated — freshness is a quality signal.");
  eAdd("depth", c.words >= 900 ? "good" : c.words >= 500 ? "ok" : "bad", `In-depth coverage (${c.words} words)`, "Thorough content (900+ words) demonstrates expertise.");
  eAdd("firsthand", c.stats >= 3 ? "good" : c.stats >= 1 ? "ok" : "bad", `First-hand data / specifics (${c.stats})`, "Include concrete data, numbers, or examples to show first-hand experience.");

  // ===== GEO (Generative Engine Optimization) =====
  const geo = [];
  const gAdd = (id, status, label, tip) => geo.push({ id, status, label, tip });
  gAdd("structure", c.headings.length >= 3 ? "good" : c.headings.length >= 1 ? "ok" : "bad", `Clear section structure (${c.headings.length} headings)`, "Use descriptive H2/H3 headings so AI can map your content.");
  gAdd("lists", c.lists >= 1 ? "good" : "bad", `Scannable lists (${c.lists})`, "Use bullet/numbered lists — AI extracts these easily.");
  gAdd("definitions", c.definitions >= 2 ? "good" : c.definitions === 1 ? "ok" : "bad", "Clear definitions ('X is a…')", "Define key terms plainly so AI can quote them as answers.");
  gAdd("takeaways", c.hasTakeaways ? "good" : "bad", "Key takeaways / summary", "Add a summary or 'key takeaways' section AI can lift directly.");
  gAdd("data", c.stats >= 3 ? "good" : c.stats >= 1 ? "ok" : "bad", `Citable data points (${c.stats})`, "Include stats/figures — AI systems love to cite concrete data.");
  gAdd("qa", c.questionHeadings >= 1 ? "good" : "ok", `Question-style headings (${c.questionHeadings})`, "Phrase some headings as questions (FAQ-style) — ideal for AI answers.");
  gAdd("answer", c.firstParaWords > 0 && c.firstParaWords <= 60 ? "good" : c.firstParaWords ? "ok" : "bad", "Direct answer up top", "Open with a concise, direct answer (≤60 words) before the details.");
  gAdd("tables", c.tables >= 1 ? "good" : "ok", `Structured tables (${c.tables})`, "Tables give AI clean, structured data to reference.");

  // ===== SEO (traditional) =====
  const seo = [];
  const sAdd = (id, status, label, tip) => seo.push({ id, status, label, tip });
  const metaTitle = (form.meta_title || form.title || "").toLowerCase();
  const metaDesc = (form.meta_description || form.excerpt || "").toLowerCase();
  const slug = (form.slug || "").toLowerCase();

  if (kw) {
    sAdd("kw_title", metaTitle.includes(kw) ? "good" : "bad", "Focus keyword in SEO title", "Put the focus keyword in the title.");
    sAdd("kw_meta", metaDesc.includes(kw) ? "good" : "bad", "Focus keyword in meta description", "Use the focus keyword in the meta description.");
    sAdd("kw_url", slug.includes(kw.replace(/\s+/g, "-")) || slug.includes(kw.replace(/\s+/g, "")) ? "good" : "bad", "Focus keyword in URL", "Include the focus keyword in the slug.");
    sAdd("kw_intro", c.firstChunk.includes(kw) ? "good" : c.text.includes(kw) ? "ok" : "bad", "Focus keyword near the start", "Mention the keyword in the first paragraph.");
    sAdd("kw_head", c.headings.some((h) => h.toLowerCase().includes(kw)) ? "good" : "ok", "Focus keyword in a subheading", "Use the keyword in at least one heading.");
    const occ = occurrences(c.text, kw);
    const density = c.words ? (occ * kw.split(/\s+/).length) / c.words * 100 : 0;
    let dStatus = "bad";
    if (density >= 0.5 && density <= 2.5) dStatus = "good";
    else if ((density >= 0.25 && density < 0.5) || (density > 2.5 && density <= 3.5)) dStatus = "ok";
    sAdd("kw_density", occ === 0 ? "bad" : dStatus, `Keyword density ${density.toFixed(1)}% (${occ}×)`, "Aim for 0.5%–2.5% keyword density.");
  } else {
    sAdd("kw_set", "bad", "Set a focus keyword", "Enter the main keyword you want to rank for.");
  }

  sAdd("length", c.words >= 600 ? "good" : c.words >= 300 ? "ok" : "bad", `Word count: ${c.words}`, "Aim for 600+ words of useful content.");
  sAdd("headers", c.headings.length >= 2 ? "good" : c.headings.length === 1 ? "ok" : "bad", `Subheadings: ${c.headings.length}`, "Structure content with H2/H3 headings.");
  const imgCount = c.images.length + (form.featured_image ? 1 : 0);
  sAdd("images", imgCount >= 1 ? "good" : "bad", `Images: ${imgCount}`, "Add at least one image.");
  const missingAlt = c.images.filter((i) => !i.alt).length + (form.featured_image && !form.featured_image_alt ? 1 : 0);
  if (imgCount >= 1) sAdd("alt", missingAlt === 0 ? "good" : "ok", missingAlt === 0 ? "All images have alt text" : `${missingAlt} image(s) missing alt text`, "Describe every image with alt text.");
  sAdd("internal", c.internal >= 1 ? "good" : "ok", `Internal links: ${c.internal}`, "Link to other pages on your site.");
  sAdd("external", c.external >= 1 ? "good" : "ok", `Outbound links: ${c.external}`, "Link to a relevant authoritative source.");
  const mt = (form.meta_title || form.title || "").length;
  sAdd("meta_title_len", mt >= 50 && mt <= 60 ? "good" : mt >= 40 && mt <= 65 ? "ok" : "bad", `SEO title length: ${mt}`, "Keep the SEO title 50–60 characters.");
  const md = (form.meta_description || form.excerpt || "").length;
  sAdd("meta_desc_len", md >= 120 && md <= 160 ? "good" : md >= 80 && md <= 170 ? "ok" : "bad", `Meta description length: ${md}`, "Write a 120–160 character meta description.");
  if (c.flesch !== null) {
    sAdd("readability", c.flesch >= 60 ? "good" : c.flesch >= 45 ? "ok" : "bad", `Readability (Flesch ${c.flesch})`, "Aim for a Flesch reading ease of 60+ (easy to read).");
  }

  return {
    categories: [
      {
        id: "eeat", label: "EEAT", score: roll(eeat), ...tally(eeat), checks: eeat,
        description: "Google's quality-rater guidelines for content that deserves to rank",
        info: "Experience, Expertise, Authoritativeness, Trust. Driven by author identity (name, title, bio, credentials), profile links, outbound citations, freshness, depth, and first-hand data.",
      },
      {
        id: "geo", label: "GEO", score: roll(geo), ...tally(geo), checks: geo,
        description: "How well AI systems can extract, cite, and reference your content",
        info: "Generative Engine Optimization. AI answer engines favour clear structure, definitions, lists, summaries/takeaways, citable data, question-style headings, direct answers, and tables.",
      },
      {
        id: "seo", label: "SEO", score: roll(seo), ...tally(seo), checks: seo,
        description: "Traditional SEO signals for search engine ranking",
        info: "On-page signals: focus keyword usage (title, meta, URL, intro, headings, density), word count, headings, images + alt text, internal/external links, meta lengths, and readability.",
      },
    ],
    words: c.words,
  };
}

export function scoreBand(score) {
  if (score >= 80) return { label: "Good", color: "#10B981" };
  if (score >= 50) return { label: "Needs work", color: "#F59E0B" };
  return { label: "Poor", color: "#EF4444" };
}

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Upload, ExternalLink, Trash2, ArrowLeft, Loader2, ChevronDown } from "lucide-react";
import { TYPOGRAPHY } from "../../quiz/theme.js";
import TiptapEditor from "./TiptapEditor.jsx";
import { apiGet, apiPost, apiPatch, apiDelete, apiUpload } from "./adminApi.js";

const EMPTY = {
  title: "", slug: "", excerpt: "", content: "",
  featured_image: "", featured_image_alt: "",
  category_id: "", tags: [], status: "draft", scheduled_at: "",
  author_name: "Riazul Islam",
  meta_title: "", meta_description: "", focus_keyword: "", keywords: "",
  canonical_url: "", og_title: "", og_description: "", og_image: "",
  schema_type: "BlogPosting", noindex: false,
};

function slugifyClient(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function PostEditor({ token, theme, isMobile, postId, categories, onBack, onSaved, onExpired, onCategoriesChanged }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(Boolean(postId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [seoOpen, setSeoOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState("");
  const [slugTouched, setSlugTouched] = useState(Boolean(postId));
  const [tagInput, setTagInput] = useState("");
  const featuredInputRef = useRef(null);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);

  const set = useCallback((patch) => setForm((f) => ({ ...f, ...patch })), []);

  const handleErr = useCallback(
    (e) => {
      if (e?.expired) onExpired?.();
      else setError(e.message || "Something went wrong");
    },
    [onExpired]
  );

  // Load existing post
  useEffect(() => {
    if (!postId) return;
    let alive = true;
    setLoading(true);
    apiGet(token, `/posts/${postId}`)
      .then(({ post }) => {
        if (!alive) return;
        setForm({
          ...EMPTY,
          ...post,
          category_id: post.category_id || "",
          tags: (post.tags || []).map((t) => t.name),
          scheduled_at: post.scheduled_at ? toLocalInput(post.scheduled_at) : "",
        });
      })
      .catch(handleErr)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [postId, token, handleErr]);

  // Auto-slug from title until the slug is manually edited
  useEffect(() => {
    if (!slugTouched && form.title) set({ slug: slugifyClient(form.title) });
  }, [form.title, slugTouched, set]);

  const buildPayload = () => ({
    title: form.title,
    slug: form.slug,
    excerpt: form.excerpt,
    content: form.content,
    featured_image: form.featured_image || null,
    featured_image_alt: form.featured_image_alt || null,
    category_id: form.category_id || null,
    tags: form.tags,
    author_name: form.author_name,
    meta_title: form.meta_title || null,
    meta_description: form.meta_description || null,
    focus_keyword: form.focus_keyword || null,
    keywords: form.keywords || null,
    canonical_url: form.canonical_url || null,
    og_title: form.og_title || null,
    og_description: form.og_description || null,
    og_image: form.og_image || null,
    schema_type: form.schema_type,
    noindex: form.noindex,
  });

  const save = async (statusOverride) => {
    setError("");
    setNotice("");
    if (!form.title.trim()) {
      setError("A title is required.");
      return;
    }
    const payload = buildPayload();
    const status = statusOverride || form.status;
    payload.status = status;
    if (status === "scheduled") {
      if (!form.scheduled_at) {
        setError("Pick a date/time to schedule this post.");
        return;
      }
      payload.scheduled_at = new Date(form.scheduled_at).toISOString();
    }
    setSaving(true);
    try {
      const res = postId
        ? await apiPatch(token, `/posts/${postId}`, payload)
        : await apiPost(token, `/posts`, payload);
      setForm((f) => ({ ...f, status, slug: res.post.slug }));
      setNotice(
        status === "published" ? "Published ✓" : status === "scheduled" ? "Scheduled ✓" : "Saved ✓"
      );
      onSaved?.(res.post, !postId);
    } catch (e) {
      handleErr(e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!postId) return;
    if (!window.confirm("Delete this post permanently? This cannot be undone.")) return;
    try {
      await apiDelete(token, `/posts/${postId}`);
      onSaved?.(null, false);
      onBack?.();
    } catch (e) {
      handleErr(e);
    }
  };

  const onPickFeatured = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingFeatured(true);
    setError("");
    try {
      const { url } = await apiUpload(token, file);
      set({ featured_image: url, featured_image_alt: form.featured_image_alt || form.title });
    } catch (err) {
      handleErr(err);
    } finally {
      setUploadingFeatured(false);
    }
  };

  // --- AI actions ---
  const aiDraft = async () => {
    const topic = window.prompt("What should this post be about? (topic or working title)", form.title);
    if (!topic) return;
    const keywords = window.prompt("Target keywords (optional, comma separated)", form.keywords) || "";
    setAiBusy("draft");
    setError("");
    try {
      const { result } = await apiPost(token, "/ai", { action: "draft", topic, keywords });
      set({
        title: form.title || result.title || topic,
        content: result.content || form.content,
        excerpt: result.excerpt || form.excerpt,
        meta_description: result.meta_description || form.meta_description,
        keywords: result.keywords || form.keywords,
      });
      setNotice("AI draft inserted — review and edit before publishing.");
    } catch (e) {
      handleErr(e);
    } finally {
      setAiBusy("");
    }
  };

  const aiImprove = async () => {
    if (!form.content) {
      setError("Write or generate some content first.");
      return;
    }
    const instruction = window.prompt(
      "How should the AI improve the content?",
      "Improve clarity, flow, and SEO. Keep the meaning."
    );
    if (instruction === null) return;
    setAiBusy("improve");
    setError("");
    try {
      const { result } = await apiPost(token, "/ai", { action: "improve", content: form.content, instruction });
      if (result.content) set({ content: result.content });
      setNotice("Content improved by AI.");
    } catch (e) {
      handleErr(e);
    } finally {
      setAiBusy("");
    }
  };

  const aiSeo = async () => {
    setAiBusy("seo");
    setError("");
    try {
      const { result } = await apiPost(token, "/ai", { action: "seo", title: form.title, content: form.content });
      set({
        meta_title: result.meta_title || form.meta_title,
        meta_description: result.meta_description || form.meta_description,
        focus_keyword: result.focus_keyword || form.focus_keyword,
        keywords: result.keywords || form.keywords,
        excerpt: form.excerpt || result.excerpt || "",
      });
      setSeoOpen(true);
      setNotice("SEO metadata generated.");
    } catch (e) {
      handleErr(e);
    } finally {
      setAiBusy("");
    }
  };

  const addCategory = async () => {
    const name = window.prompt("New category name");
    if (!name) return;
    try {
      const { category } = await apiPost(token, "/categories", { name });
      onCategoriesChanged?.();
      set({ category_id: category.id });
    } catch (e) {
      handleErr(e);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) set({ tags: [...form.tags, t] });
    setTagInput("");
  };

  if (loading) {
    return <div style={{ padding: 60, textAlign: "center", color: theme.text3 }}>Loading editor…</div>;
  }

  const inp = {
    width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${theme.cardBorder}`,
    background: theme.bg, color: theme.text, fontSize: "0.92rem", fontFamily: TYPOGRAPHY.body, outline: "none",
  };
  const label = { fontSize: "0.76rem", fontWeight: 700, color: theme.text3, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, display: "block" };
  const card = { background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 16, padding: 18, marginBottom: 16 };
  const sideBtn = (bg, color, extra = {}) => ({
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 14px",
    borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.86rem",
    fontFamily: TYPOGRAPHY.body, background: bg, color, ...extra,
  });

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ ...sideBtn(theme.chipBg, theme.text2), background: "transparent", paddingLeft: 0 }}>
          <ArrowLeft size={16} /> Back to posts
        </button>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={aiDraft} disabled={Boolean(aiBusy)} style={sideBtn(theme.chipBg, theme.chipC)}>
            {aiBusy === "draft" ? <Loader2 size={15} className="ap-spin" /> : <Sparkles size={15} />} Draft with AI
          </button>
          {postId && (
            <button onClick={remove} style={sideBtn("rgba(239,68,68,0.1)", "#DC2626")}>
              <Trash2 size={15} /> Delete
            </button>
          )}
          <button onClick={() => save("draft")} disabled={saving} style={sideBtn(theme.card, theme.text2, { border: `1px solid ${theme.cardBorder}` })}>
            Save draft
          </button>
          <button onClick={() => save(form.status === "scheduled" ? "scheduled" : "published")} disabled={saving} style={sideBtn(theme.grad, "#fff", { boxShadow: theme.btnGlow })}>
            {saving ? <Loader2 size={15} className="ap-spin" /> : null}
            {form.status === "scheduled" ? "Schedule" : "Publish"}
          </button>
        </div>
      </div>

      {error && <Banner color="#DC2626" bg="rgba(239,68,68,0.08)" border="rgba(239,68,68,0.3)">{error}</Banner>}
      {notice && <Banner color="#059669" bg="rgba(16,185,129,0.08)" border="rgba(16,185,129,0.3)">{notice}</Banner>}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 18, alignItems: "start" }}>
        {/* Main column */}
        <div>
          <input
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Post title"
            style={{ ...inp, fontSize: "1.5rem", fontWeight: 800, fontFamily: TYPOGRAPHY.head, padding: "12px 14px", marginBottom: 10 }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, fontSize: "0.8rem", color: theme.text3, flexWrap: "wrap" }}>
            <span>/blog/</span>
            <input
              value={form.slug}
              onChange={(e) => { setSlugTouched(true); set({ slug: slugifyClient(e.target.value) }); }}
              placeholder="post-slug"
              style={{ ...inp, padding: "5px 8px", width: "auto", flex: 1, minWidth: 160, fontSize: "0.82rem" }}
            />
            {form.status === "published" && form.slug && (
              <a href={`/blog/${form.slug}`} target="_blank" rel="noreferrer" style={{ color: theme.chipC, display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none", fontWeight: 700 }}>
                View <ExternalLink size={13} />
              </a>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <button onClick={aiImprove} disabled={Boolean(aiBusy)} style={sideBtn(theme.chipBg, theme.chipC, { fontSize: "0.8rem", padding: "8px 12px" })}>
              {aiBusy === "improve" ? <Loader2 size={14} className="ap-spin" /> : <Sparkles size={14} />} Improve content
            </button>
          </div>

          <TiptapEditor
            value={form.content}
            onChange={(html) => set({ content: html })}
            token={token}
            theme={theme}
            onUploadError={handleErr}
          />

          <div style={{ marginTop: 16 }}>
            <label style={label}>Excerpt / summary</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => set({ excerpt: e.target.value })}
              placeholder="A short summary shown on the blog index and in search results (auto-generated if left blank)."
              rows={3}
              style={{ ...inp, resize: "vertical" }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Publish box */}
          <div style={card}>
            <div style={{ ...label, marginBottom: 10 }}>Status</div>
            <div style={{ display: "flex", gap: 6, marginBottom: form.status === "scheduled" ? 12 : 0 }}>
              {["draft", "published", "scheduled"].map((s) => (
                <button
                  key={s}
                  onClick={() => set({ status: s })}
                  style={{
                    flex: 1, padding: "8px 4px", borderRadius: 9, border: `1px solid ${theme.cardBorder}`, cursor: "pointer",
                    fontSize: "0.76rem", fontWeight: 700, textTransform: "capitalize", fontFamily: TYPOGRAPHY.body,
                    background: form.status === s ? theme.grad : "transparent",
                    color: form.status === s ? "#fff" : theme.text2,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            {form.status === "scheduled" && (
              <div>
                <label style={label}>Publish at</label>
                <input type="datetime-local" value={form.scheduled_at} onChange={(e) => set({ scheduled_at: e.target.value })} style={inp} />
              </div>
            )}
          </div>

          {/* Featured image */}
          <div style={card}>
            <div style={{ ...label, marginBottom: 10 }}>Featured image</div>
            {form.featured_image ? (
              <div style={{ marginBottom: 10 }}>
                <img src={form.featured_image} alt={form.featured_image_alt} style={{ width: "100%", borderRadius: 10, display: "block" }} />
                <button onClick={() => set({ featured_image: "" })} style={{ ...sideBtn("transparent", "#DC2626", { fontSize: "0.78rem", padding: "6px 0" }) }}>
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            ) : (
              <button onClick={() => featuredInputRef.current?.click()} disabled={uploadingFeatured}
                style={{ ...sideBtn(theme.chipBg, theme.chipC), width: "100%", padding: "20px 0", flexDirection: "column", gap: 6 }}>
                {uploadingFeatured ? <Loader2 size={18} className="ap-spin" /> : <Upload size={18} />}
                <span style={{ fontSize: "0.82rem" }}>{uploadingFeatured ? "Uploading…" : "Upload image"}</span>
              </button>
            )}
            {form.featured_image && (
              <input value={form.featured_image_alt} onChange={(e) => set({ featured_image_alt: e.target.value })} placeholder="Alt text (SEO)" style={{ ...inp, fontSize: "0.82rem" }} />
            )}
            <input ref={featuredInputRef} type="file" accept="image/*" onChange={onPickFeatured} style={{ display: "none" }} />
          </div>

          {/* Category */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={label}>Category</span>
              <button onClick={addCategory} style={{ background: "none", border: "none", color: theme.chipC, cursor: "pointer", fontWeight: 700, fontSize: "0.78rem" }}>+ New</button>
            </div>
            <select value={form.category_id} onChange={(e) => set({ category_id: e.target.value })} style={inp}>
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div style={card}>
            <div style={{ ...label, marginBottom: 8 }}>Tags</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: form.tags.length ? 10 : 0 }}>
              {form.tags.map((t) => (
                <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: theme.chipBg, color: theme.chipC, fontSize: "0.78rem", fontWeight: 700 }}>
                  {t}
                  <button onClick={() => set({ tags: form.tags.filter((x) => x !== t) })} style={{ background: "none", border: "none", color: theme.chipC, cursor: "pointer", padding: 0, fontSize: "0.9rem", lineHeight: 1 }}>×</button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
              onBlur={addTag}
              placeholder="Type a tag, press Enter"
              style={{ ...inp, fontSize: "0.85rem" }}
            />
          </div>

          {/* SEO */}
          <div style={card}>
            <button onClick={() => setSeoOpen((o) => !o)} style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <span style={{ ...label, marginBottom: 0 }}>SEO & structured data</span>
              <ChevronDown size={16} color={theme.text3} style={{ transform: seoOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>
            {seoOpen && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                <button onClick={aiSeo} disabled={Boolean(aiBusy)} style={{ ...sideBtn(theme.chipBg, theme.chipC, { fontSize: "0.8rem", padding: "8px 12px" }) }}>
                  {aiBusy === "seo" ? <Loader2 size={14} className="ap-spin" /> : <Sparkles size={14} />} Generate SEO with AI
                </button>
                <Field label={`Meta title (${(form.meta_title || "").length}/60)`} theme={theme} inp={inp} labelStyle={label}
                  value={form.meta_title} onChange={(v) => set({ meta_title: v })} placeholder={form.title} />
                <div>
                  <label style={label}>Meta description ({(form.meta_description || "").length}/160)</label>
                  <textarea value={form.meta_description} onChange={(e) => set({ meta_description: e.target.value })} rows={3} placeholder="Shown in Google results" style={{ ...inp, resize: "vertical", fontSize: "0.85rem" }} />
                </div>
                <Field label="Focus keyword" theme={theme} inp={inp} labelStyle={label} value={form.focus_keyword} onChange={(v) => set({ focus_keyword: v })} />
                <Field label="Keywords (comma separated)" theme={theme} inp={inp} labelStyle={label} value={form.keywords} onChange={(v) => set({ keywords: v })} />
                <div>
                  <label style={label}>Schema type</label>
                  <select value={form.schema_type} onChange={(e) => set({ schema_type: e.target.value })} style={inp}>
                    {["BlogPosting", "Article", "NewsArticle", "TechArticle"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <Field label="Canonical URL (optional)" theme={theme} inp={inp} labelStyle={label} value={form.canonical_url} onChange={(v) => set({ canonical_url: v })} placeholder="Leave blank for default" />
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: theme.text2, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.noindex} onChange={(e) => set({ noindex: e.target.checked })} />
                  Hide from Google (noindex)
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`.ap-spin { animation: apspin 0.8s linear infinite; } @keyframes apspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, inp, labelStyle }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ ...inp, fontSize: "0.85rem" }} />
    </div>
  );
}

function Banner({ children, color, bg, border }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, color, borderRadius: 12, padding: "11px 15px", marginBottom: 14, fontSize: "0.86rem", fontWeight: 600 }}>
      {children}
    </div>
  );
}

// Convert an ISO string to a value usable by <input type="datetime-local">.
function toLocalInput(iso) {
  try {
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

import React, { useCallback, useEffect, useState } from "react";
import { Plus, ExternalLink, Trash2, Pencil, FileText, BarChart3 } from "lucide-react";
import { TYPOGRAPHY } from "../../quiz/theme.js";
import { apiGet, apiDelete } from "./adminApi.js";
import PostEditor from "./PostEditor.jsx";
import BlogAnalytics from "./BlogAnalytics.jsx";

const STATUS_COLOR = {
  published: "#10B981",
  draft: "#9CA3AF",
  scheduled: "#F59E0B",
};

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

export default function BlogAdmin({ token, theme, isMobile, onExpired }) {
  const [view, setView] = useState("list"); // list | editor | analytics
  const [editingId, setEditingId] = useState(null);
  const [posts, setPosts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleErr = useCallback(
    (e) => {
      if (e?.expired) onExpired?.();
      else setError(e.message || "Something went wrong");
    },
    [onExpired]
  );

  const loadPosts = useCallback(() => {
    setLoading(true);
    setError("");
    apiGet(token, `/posts?status=all&limit=200`)
      .then((res) => setPosts(res.posts || []))
      .catch(handleErr)
      .finally(() => setLoading(false));
  }, [token, handleErr]);

  const loadCategories = useCallback(() => {
    apiGet(token, `/categories`).then((res) => setCategories(res.categories || [])).catch(() => {});
  }, [token]);

  useEffect(() => {
    loadPosts();
    loadCategories();
  }, [loadPosts, loadCategories]);

  const openNew = () => {
    setEditingId(null);
    setView("editor");
  };
  const openEdit = (id) => {
    setEditingId(id);
    setView("editor");
  };
  const backToList = () => {
    setView("list");
    setEditingId(null);
    loadPosts();
  };

  const del = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this post permanently?")) return;
    try {
      await apiDelete(token, `/posts/${id}`);
      setPosts((p) => (p || []).filter((x) => x.id !== id));
    } catch (err) {
      handleErr(err);
    }
  };

  if (view === "editor") {
    return (
      <PostEditor
        token={token}
        theme={theme}
        isMobile={isMobile}
        postId={editingId}
        categories={categories}
        onBack={backToList}
        onSaved={() => loadPosts()}
        onExpired={onExpired}
        onCategoriesChanged={loadCategories}
      />
    );
  }

  const filtered = (posts || []).filter((p) => statusFilter === "all" || p.status === statusFilter);

  return (
    <div>
      {/* Sub-nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div style={{ display: "inline-flex", gap: 4, padding: 4, background: theme.chipBg, borderRadius: 999 }}>
          <SubTab theme={theme} active={view === "list"} onClick={() => setView("list")} icon={<FileText size={15} />}>Posts</SubTab>
          <SubTab theme={theme} active={view === "analytics"} onClick={() => setView("analytics")} icon={<BarChart3 size={15} />}>Analytics</SubTab>
        </div>
        {view === "list" && (
          <button onClick={openNew} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: theme.grad, color: "#fff", border: "none", borderRadius: 999, padding: "10px 18px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", fontFamily: TYPOGRAPHY.body, boxShadow: theme.btnGlow }}>
            <Plus size={16} /> New post
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#DC2626", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: "0.86rem", fontWeight: 600 }}>
          {error}
        </div>
      )}

      {view === "analytics" ? (
        <BlogAnalytics token={token} theme={theme} isMobile={isMobile} onExpired={onExpired} />
      ) : (
        <>
          {/* Status filter */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {["all", "published", "draft", "scheduled"].map((s) => {
              const count = s === "all" ? (posts?.length || 0) : (posts || []).filter((p) => p.status === s).length;
              return (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  padding: "6px 14px", borderRadius: 999, border: `1px solid ${theme.cardBorder}`, cursor: "pointer",
                  fontWeight: 700, fontSize: "0.8rem", textTransform: "capitalize", fontFamily: TYPOGRAPHY.body,
                  background: statusFilter === s ? theme.grad : theme.card,
                  color: statusFilter === s ? "#fff" : theme.text2,
                }}>{s} {count ? `(${count})` : ""}</button>
              );
            })}
          </div>

          <div style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 18, overflow: "hidden" }}>
            {loading && !posts ? (
              <div style={{ padding: 40, textAlign: "center", color: theme.text3 }}>Loading posts…</div>
            ) : !filtered.length ? (
              <div style={{ padding: 48, textAlign: "center", color: theme.text3 }}>
                {posts?.length ? "No posts with this status." : "No posts yet. Click “New post” to write your first article."}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", minWidth: 640 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: theme.text3, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      <th style={th}>Title</th>
                      <th style={th}>Status</th>
                      <th style={th}>Category</th>
                      <th style={{ ...th, textAlign: "right" }}>Views</th>
                      <th style={th}>Updated</th>
                      <th style={{ ...th, textAlign: "right" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} onClick={() => openEdit(p.id)} className="ap-blog-row" style={{ cursor: "pointer", borderTop: `1px solid ${theme.cardBorder}` }}>
                        <td style={{ ...td, fontWeight: 600, maxWidth: 320 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title || "(untitled)"}</div>
                          <div style={{ color: theme.text3, fontSize: "0.74rem", fontWeight: 400 }}>/blog/{p.slug}</div>
                        </td>
                        <td style={td}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 700, color: STATUS_COLOR[p.status] || theme.text2, textTransform: "capitalize" }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[p.status] || theme.text3 }} />
                            {p.status}
                          </span>
                        </td>
                        <td style={{ ...td, color: theme.text2 }}>{p.category?.name || "—"}</td>
                        <td style={{ ...td, textAlign: "right", fontWeight: 700, color: theme.text2 }}>{(p.view_count || 0).toLocaleString()}</td>
                        <td style={{ ...td, color: theme.text3, whiteSpace: "nowrap" }}>{fmtDate(p.updated_at)}</td>
                        <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", gap: 4 }}>
                            {p.status === "published" && (
                              <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} title="View" style={iconBtn(theme)}>
                                <ExternalLink size={15} />
                              </a>
                            )}
                            <button onClick={() => openEdit(p.id)} title="Edit" style={iconBtn(theme)}><Pencil size={15} /></button>
                            <button onClick={(e) => del(e, p.id)} title="Delete" style={{ ...iconBtn(theme), color: "#DC2626" }}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
      <style>{`.ap-blog-row:hover { background: ${theme.chipBg}; }`}</style>
    </div>
  );
}

function SubTab({ theme, active, onClick, icon, children }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer",
      fontWeight: 700, fontSize: "0.84rem", fontFamily: TYPOGRAPHY.body,
      background: active ? theme.grad : "transparent", color: active ? "#fff" : theme.text2,
    }}>
      {icon} {children}
    </button>
  );
}

function iconBtn(theme) {
  return {
    display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8,
    border: "none", background: "transparent", color: theme.text2, cursor: "pointer",
  };
}

const th = { padding: "12px 14px", fontWeight: 700 };
const td = { padding: "12px 14px" };

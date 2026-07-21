import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SEOHead from "../SEOHead.jsx";
import { TYPOGRAPHY, useSessionTheme } from "../quiz/theme.js";
import { BlogNav, BlogFooter } from "./BlogChrome.jsx";
import { listPosts, listCategories } from "./blogApi.js";

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function PostCard({ post, theme }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      style={{
        display: "flex",
        flexDirection: "column",
        background: theme.card,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 18,
        overflow: "hidden",
        textDecoration: "none",
        color: theme.text,
        boxShadow: theme.cardGlow,
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}
      className="ap-post-card"
    >
      <div style={{ aspectRatio: "16 / 9", background: theme.chipBg, overflow: "hidden" }}>
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt={post.featured_image_alt || post.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: theme.grad, opacity: 0.14 }} />
        )}
      </div>
      <div style={{ padding: "18px 20px 22px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {post.category?.name && (
          <span style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: theme.chipC }}>
            {post.category.name}
          </span>
        )}
        <h2 style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: "1.2rem", lineHeight: 1.3, margin: 0 }}>
          {post.title}
        </h2>
        {post.excerpt && (
          <p style={{ color: theme.text2, fontSize: "0.92rem", lineHeight: 1.55, margin: 0 }}>
            {post.excerpt.length > 130 ? `${post.excerpt.slice(0, 130)}…` : post.excerpt}
          </p>
        )}
        <div style={{ marginTop: "auto", paddingTop: 10, display: "flex", gap: 10, color: theme.text3, fontSize: "0.78rem" }}>
          <span>{fmtDate(post.published_at)}</span>
          {post.reading_time ? <span>· {post.reading_time} min read</span> : null}
        </div>
      </div>
    </Link>
  );
}

export default function BlogIndex({ taxonomy }) {
  const theme = useSessionTheme();
  const { slug } = useParams();
  const [posts, setPosts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const filter = useMemo(() => {
    if (taxonomy === "category") return { category: slug };
    if (taxonomy === "tag") return { tag: slug };
    return {};
  }, [taxonomy, slug]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    listPosts({ limit: 48, ...filter })
      .then((res) => alive && setPosts(res.posts || []))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [filter]);

  useEffect(() => {
    listCategories().then((res) => setCategories(res.categories || [])).catch(() => {});
  }, []);

  const path =
    taxonomy === "category"
      ? `/blog/category/${slug}`
      : taxonomy === "tag"
        ? `/blog/tag/${slug}`
        : "/blog";
  const heading =
    taxonomy === "category"
      ? (categories.find((c) => c.slug === slug)?.name || slug)
      : taxonomy === "tag"
        ? `#${slug}`
        : "The Automation Paths Blog";
  const subhead =
    taxonomy
      ? `Articles tagged ${heading}.`
      : "Playbooks on CRM architecture, Voice AI, SMS automation, and building revenue systems that compound.";
  const title = taxonomy ? `${heading} — Automation Paths Blog` : "Blog | Automation Paths";

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text }}>
      <SEOHead title={title} description={subhead} path={path} publicPaths={[path]} />
      <style>{`
        .ap-post-card:hover { transform: translateY(-3px); box-shadow: 0 18px 40px rgba(0,0,0,0.10); }
        a { color: inherit; }
      `}</style>
      <BlogNav theme={theme} />

      <header style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 20px 30px", textAlign: "center" }}>
        <h1 style={{ fontFamily: TYPOGRAPHY.display, fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: 1.1, margin: "0 0 14px" }}>
          {heading}
        </h1>
        <p style={{ color: theme.text2, fontSize: "1.05rem", maxWidth: 620, margin: "0 auto", lineHeight: 1.6 }}>
          {subhead}
        </p>
      </header>

      {categories.length > 0 && !taxonomy && (
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 20px 26px", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          <Link to="/blog" style={chip(theme, true)}>All</Link>
          {categories.map((c) => (
            <Link key={c.id} to={`/blog/category/${c.slug}`} style={chip(theme, false)}>
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "0 20px 40px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: theme.text3 }}>Loading…</div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: 40, color: theme.text2 }}>
            Couldn’t load posts. {error}
          </div>
        ) : !posts?.length ? (
          <div style={{ textAlign: "center", padding: 60, color: theme.text3 }}>
            No posts published yet. Check back soon.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            {posts.map((p) => (
              <PostCard key={p.id} post={p} theme={theme} />
            ))}
          </div>
        )}
      </main>

      <BlogFooter theme={theme} />
    </div>
  );
}

function chip(theme, active) {
  return {
    padding: "7px 15px",
    borderRadius: 999,
    fontSize: "0.82rem",
    fontWeight: 700,
    textDecoration: "none",
    border: `1px solid ${theme.cardBorder}`,
    background: active ? theme.grad : theme.card,
    color: active ? "#fff" : theme.text2,
  };
}

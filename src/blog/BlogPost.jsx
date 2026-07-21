import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SEOHead from "../SEOHead.jsx";
import { TYPOGRAPHY, useSessionTheme } from "../quiz/theme.js";
import { BlogNav, BlogFooter } from "./BlogChrome.jsx";
import { getPost, trackView } from "./blogApi.js";
import { buildPostSchema } from "./blogSchema.js";
import "./prose.css";

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export default function BlogPost() {
  const theme = useSessionTheme();
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | notfound | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    window.scrollTo(0, 0);
    getPost(slug)
      .then((res) => {
        if (!alive) return;
        setPost(res.post);
        setStatus("ready");
        trackView(slug);
      })
      .catch((e) => {
        if (!alive) return;
        if (/not found/i.test(e.message) || /404/.test(e.message)) setStatus("notfound");
        else {
          setStatus("error");
          setErrorMsg(e.message);
        }
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  const path = `/blog/${slug}`;

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text }}>
        <BlogNav theme={theme} />
        <div style={{ textAlign: "center", padding: 80, color: theme.text3 }}>Loading…</div>
      </div>
    );
  }

  if (status === "notfound" || status === "error") {
    return (
      <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text }}>
        <SEOHead title="Post not found | Automation Paths" description="This article could not be found." path={path} noindex />
        <BlogNav theme={theme} />
        <div style={{ textAlign: "center", padding: 80, maxWidth: 520, margin: "0 auto" }}>
          <h1 style={{ fontFamily: TYPOGRAPHY.head, fontSize: "1.6rem", marginBottom: 10 }}>
            {status === "notfound" ? "Article not found" : "Something went wrong"}
          </h1>
          <p style={{ color: theme.text2, marginBottom: 20 }}>
            {status === "notfound" ? "This post may have been moved or unpublished." : errorMsg}
          </p>
          <Link to="/blog" style={{ color: theme.chipC, fontWeight: 700, textDecoration: "none" }}>← Back to the blog</Link>
        </div>
        <BlogFooter theme={theme} />
      </div>
    );
  }

  const desc = post.meta_description || post.excerpt || "";

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text }}>
      <SEOHead
        title={post.meta_title || `${post.title} | Automation Paths`}
        description={desc}
        path={path}
        publicPaths={[path]}
        noindex={Boolean(post.noindex)}
        schema={buildPostSchema(post)}
      />
      <BlogNav theme={theme} />

      <article style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px 20px" }}>
        <nav style={{ fontSize: "0.8rem", color: theme.text3, marginBottom: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link to="/blog" style={{ color: theme.text3, textDecoration: "none" }}>Blog</Link>
          {post.category?.name && (
            <>
              <span>›</span>
              <Link to={`/blog/category/${post.category.slug}`} style={{ color: theme.text3, textDecoration: "none" }}>
                {post.category.name}
              </Link>
            </>
          )}
        </nav>

        <header style={{ marginBottom: 26 }}>
          <h1 style={{ fontFamily: TYPOGRAPHY.display, fontWeight: 800, fontSize: "clamp(1.9rem, 4.5vw, 2.75rem)", lineHeight: 1.15, margin: "0 0 16px" }}>
            {post.title}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: theme.text3, fontSize: "0.86rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, color: theme.text2 }}>{post.author_name || "Riazul Islam"}</span>
            <span>·</span>
            <span>{fmtDate(post.published_at)}</span>
            {post.reading_time ? (
              <>
                <span>·</span>
                <span>{post.reading_time} min read</span>
              </>
            ) : null}
          </div>
        </header>

        {post.featured_image && (
          <img
            src={post.featured_image}
            alt={post.featured_image_alt || post.title}
            style={{ width: "100%", borderRadius: 18, marginBottom: 30, display: "block" }}
          />
        )}

        <div
          className="ap-prose"
          style={{
            "--prose-text": theme.text,
            "--prose-head": theme.text,
            "--prose-muted": theme.text2,
            "--prose-link": theme.a2,
            "--prose-accent": theme.a1,
            "--prose-border": theme.cardBorder,
            "--prose-inline-code": theme.chipC,
            "--prose-inline-code-bg": theme.chipBg,
            "--prose-th-bg": theme.chipBg,
          }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.tags?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 34 }}>
            {post.tags.map((t) => (
              <Link
                key={t.slug}
                to={`/blog/tag/${t.slug}`}
                style={{ padding: "6px 13px", borderRadius: 999, background: theme.chipBg, color: theme.chipC, fontSize: "0.8rem", fontWeight: 700, textDecoration: "none" }}
              >
                #{t.name}
              </Link>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 44,
            padding: "26px 28px",
            borderRadius: 18,
            background: theme.card,
            border: `1px solid ${theme.cardBorder}`,
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: "1.2rem", marginBottom: 8 }}>
            Want systems like this built for you?
          </div>
          <p style={{ color: theme.text2, fontSize: "0.94rem", marginBottom: 16 }}>
            Get a free diagnostic of where your funnel is leaking revenue.
          </p>
          <a
            href="/funnel-quiz"
            style={{ display: "inline-block", background: theme.grad, color: "#fff", fontWeight: 700, padding: "12px 26px", borderRadius: 999, textDecoration: "none", boxShadow: theme.btnGlow }}
          >
            Take the free funnel audit →
          </a>
        </div>
      </article>

      <BlogFooter theme={theme} />
    </div>
  );
}

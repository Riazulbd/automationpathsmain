import React from "react";
import { Link } from "react-router-dom";
import brandLogo from "../../Automation Paths Logo (3).png";
import { TYPOGRAPHY } from "../quiz/theme.js";

// Lightweight nav + footer for public blog pages. Visually consistent with the
// main site but self-contained (doesn't pull in the heavy homepage component).

export function BlogNav({ theme }) {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: theme.navBg,
        backdropFilter: "saturate(180%) blur(14px)",
        WebkitBackdropFilter: "saturate(180%) blur(14px)",
        borderBottom: `1px solid ${theme.cardBorder}`,
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src={brandLogo} alt="Automation Paths" style={{ height: 26, width: "auto", objectFit: "contain" }} />
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontFamily: TYPOGRAPHY.body }}>
          <Link to="/blog" style={{ color: theme.text2, textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
            Blog
          </Link>
          <a href="/#services" style={{ color: theme.text2, textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
            Services
          </a>
          <a
            href="/funnel-quiz"
            style={{
              background: theme.grad,
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "0.86rem",
              padding: "9px 18px",
              borderRadius: 999,
              boxShadow: theme.btnGlow,
            }}
          >
            Free Funnel Audit
          </a>
        </div>
      </div>
    </nav>
  );
}

export function BlogFooter({ theme }) {
  return (
    <footer
      style={{
        borderTop: `1px solid ${theme.cardBorder}`,
        marginTop: 60,
        padding: "36px 20px",
        fontFamily: TYPOGRAPHY.body,
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={brandLogo} alt="Automation Paths" style={{ height: 24, width: "auto", objectFit: "contain" }} />
          <span style={{ color: theme.text3, fontSize: "0.82rem" }}>
            © {new Date().getFullYear()} Automation Paths
          </span>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: "0.85rem" }}>
          <a href="/" style={{ color: theme.text2, textDecoration: "none" }}>Home</a>
          <Link to="/blog" style={{ color: theme.text2, textDecoration: "none" }}>Blog</Link>
          <a href="/feed.xml" style={{ color: theme.text2, textDecoration: "none" }}>RSS</a>
        </div>
      </div>
    </footer>
  );
}

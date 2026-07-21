import React, { Suspense, lazy, useEffect, useState } from "react";
import automationPathsBrandLogo from "./Automation Paths Logo (3).png";
import SEOHead from "./src/SEOHead.jsx";
import vapiLogo from "./src/assets/logos/VAPI.svg";
import zapierLogo from "./src/assets/logos/zapier-2.svg";

const BelowFoldSections = lazy(() => import("./src/BelowFoldSections.jsx"));

const TYPOGRAPHY = {
  display: "'Fraunces', Georgia, serif",
  head: "'Outfit', 'Fraunces', Georgia, serif",
  body: "'Manrope', sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

const UPWORK_URL = "https://www.upwork.com/freelancers/automationpaths";
const HOME_CANONICAL_URL = "https://automationpaths.com";
const HOME_TITLE = "Automation Paths - Revenue Systems Architecture & AI Automation";
const HOME_DESCRIPTION =
  "Riazul Islam builds revenue systems for agencies, coaches, and consultants - CRM architecture, Voice AI agents, SMS AI, and automation pipelines on GoHighLevel, VAPI, and n8n. Top Rated on Upwork with 5,000+ hours and $59.76M in attributed client revenue.";
const HOME_SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${HOME_CANONICAL_URL}#website`,
    url: HOME_CANONICAL_URL,
    name: "Automation Paths",
    description: HOME_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      "@id": `${HOME_CANONICAL_URL}#organization`,
      name: "Automation Paths",
      url: HOME_CANONICAL_URL,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${HOME_CANONICAL_URL}#service`,
    name: "Automation Paths",
    url: HOME_CANONICAL_URL,
    description: HOME_DESCRIPTION,
    founder: {
      "@type": "Person",
      "@id": `${HOME_CANONICAL_URL}#founder`,
      name: "Riazul Islam",
      jobTitle: "Revenue Systems Architect",
    },
    areaServed: ["United States", "United Kingdom"],
    sameAs: [UPWORK_URL],
    knowsAbout: [
      "CRM architecture",
      "Voice AI agents",
      "SMS AI",
      "Automation pipelines",
      "GoHighLevel",
      "VAPI",
      "n8n",
    ],
  },
];

const THEMES = [
  { id: "flame", name: "Sunset Flame", dark: false, bg: "#FFFAF5", bgDark: "#FFECE0", card: "#FFFFFF", cardBorder: "rgba(0,0,0,0.05)", text: "#1F1510", text2: "#6B5040", text3: "#A08878", a1: "#FF6B35", a2: "#FF4F81", grad: "linear-gradient(135deg,#FF6B35,#FF4F81,#FF2D87)", glow1: "rgba(255,107,53,0.18)", glow2: "rgba(255,79,129,0.12)", glow3: "rgba(255,140,66,0.10)", cardGlow: "0 0 40px rgba(255,107,53,0.05)", btnGlow: "0 6px 30px rgba(255,107,53,0.35), 0 0 50px rgba(255,79,129,0.12)", chipBg: "rgba(255,107,53,0.08)", chipC: "#E85A28", tagBg: "rgba(255,107,53,0.08)", tagC: "#E85A28", starG: "linear-gradient(135deg,#FFCB47,#FF8C42)", navBg: "rgba(255,250,245,0.75)", navBorder: "rgba(255,255,255,0.8)", hoverBorder: "rgba(255,107,53,0.3)", iL: 0.7, iD: 0.04 },
  { id: "ocean", name: "Sky Glass", dark: false, bg: "#F5FBFF", bgDark: "#E6F4FF", card: "#FFFFFF", cardBorder: "rgba(19,79,125,0.08)", text: "#14314B", text2: "#52748F", text3: "#8BA9BF", a1: "#06B6D4", a2: "#3B82F6", grad: "linear-gradient(135deg,#06B6D4,#3B82F6,#6366F1)", glow1: "rgba(6,182,212,0.18)", glow2: "rgba(59,130,246,0.12)", glow3: "rgba(99,102,241,0.10)", cardGlow: "0 0 45px rgba(6,182,212,0.05)", btnGlow: "0 6px 30px rgba(6,182,212,0.28)", chipBg: "rgba(6,182,212,0.10)", chipC: "#1599BF", tagBg: "rgba(6,182,212,0.10)", tagC: "#1599BF", starG: "linear-gradient(135deg,#FBBF24,#F59E0B)", navBg: "rgba(255,255,255,0.78)", navBorder: "rgba(255,255,255,0.84)", hoverBorder: "rgba(6,182,212,0.28)", iL: 0.7, iD: 0.04 },
];

const platformLogos = [
  { name: "HubSpot", kind: "fallback", icon: "HubSpot", color: "#33475B" },
  { name: "Twilio", kind: "fallback", icon: "Twilio", color: "#F22F46" },
  { name: "Docker", kind: "fallback", icon: "Docker", color: "#2496ED" },
  { name: "Cloudflare", kind: "fallback", icon: "Cloudflare", color: "#F48120" },
  { name: "Supabase", kind: "fallback", icon: "Supabase", color: "#0F172A" },
  { name: "GoHighLevel", kind: "fallback", icon: "GoHighLevel", color: "#1F2937" },
  { name: "Pipedrive", kind: "text", color: "#17313B" },
  { name: "n8n", kind: "fallback", icon: "n8n", color: "#111827" },
  { name: "Make", kind: "fallback", icon: "Make", color: "#111827" },
  { name: "VAPI", kind: "image", src: vapiLogo, imageHeight: 22, imageWidth: 1374, imageIntrinsicHeight: 390 },
  { name: "Zapier", kind: "image", src: zapierLogo, imageHeight: 18, imageWidth: 2500, imageIntrinsicHeight: 676 },
];

const heroPrinciples = [
  {
    emoji: "\u{1F50E}",
    title: "Audit before adding tools",
    copy: "Find where leads die, where response time breaks, and where routing fails - before touching a single new platform.",
  },
  {
    emoji: "\u{1F9E9}",
    title: "Rebuild around the revenue path",
    copy: "CRM, AI, outbound, and dashboards get redesigned around how leads actually move from first touch to closed revenue.",
  },
  {
    emoji: "\u{1F680}",
    title: "Ship with QA, docs, and handoff",
    copy: "Every system is tested, documented, and handed over clearly so it survives after launch - without depending on you to maintain it.",
  },
];

const LogoSVG = ({ name, size = 20 }) => {
  const icons = {
    GoHighLevel: (
      <>
        <rect width={size} height={size} rx={4} fill="#FF6B35" />
        <path d="M4,14 L8,6 L12,10 L16,4" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
    HubSpot: (
      <>
        <circle cx={size / 2} cy={size / 2} r={size / 2} fill="#FF7A59" />
        <circle cx={size / 2} cy={size / 2} r={size * 0.28} fill="#fff" />
        <circle cx={size * 0.25} cy={size * 0.35} r={2} fill="#fff" />
        <circle cx={size * 0.75} cy={size * 0.35} r={2} fill="#fff" />
        <circle cx={size * 0.25} cy={size * 0.65} r={2} fill="#fff" />
        <circle cx={size * 0.75} cy={size * 0.65} r={2} fill="#fff" />
      </>
    ),
    Twilio: (
      <>
        <circle cx={size / 2} cy={size / 2} r={size / 2} fill="#F22F46" />
        <circle cx={size * 0.35} cy={size * 0.42} r={2.2} fill="#fff" />
        <circle cx={size * 0.65} cy={size * 0.42} r={2.2} fill="#fff" />
        <circle cx={size * 0.5} cy={size * 0.68} r={2.2} fill="#fff" />
      </>
    ),
    n8n: (
      <>
        <rect width={size} height={size} rx={4} fill="#EA4C89" />
        <circle cx={size * 0.32} cy={size / 2} r={2.5} fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx={size * 0.68} cy={size / 2} r={2.5} fill="none" stroke="#fff" strokeWidth="1.5" />
        <line x1={size * 0.44} y1={size / 2} x2={size * 0.56} y2={size / 2} stroke="#fff" strokeWidth="1.5" />
      </>
    ),
    Supabase: (
      <>
        <rect width={size} height={size} rx={4} fill="#3ECF8E" />
        <path d="M10,4 L10,11 L16,16 L10,11 L4,16 L10,11Z" fill="#fff" opacity="0.9" />
      </>
    ),
    Cloudflare: (
      <>
        <rect width={size} height={size} rx={4} fill="#F48120" />
        <path d="M4,12 Q6,8 10,9 Q12,7 15,9 Q17,9 17,12 Z" fill="#fff" opacity="0.9" />
        <path d="M6,12 Q7,10 10,10.5 Q11,9 13,10 Q14.5,10 14.5,12 Z" fill="#fffce8" opacity="0.7" />
      </>
    ),
    Docker: (
      <>
        <rect width={size} height={size} rx={4} fill="#2496ED" />
        <rect x="3" y="9" width="14" height="6" rx="1" fill="#fff" opacity="0.9" />
        <rect x="5" y="5" width="3" height="3" rx="0.5" fill="#fff" opacity="0.7" />
        <rect x="9" y="5" width="3" height="3" rx="0.5" fill="#fff" opacity="0.7" />
      </>
    ),
    Make: (
      <>
        <rect width={size} height={size} rx={4} fill="#6B21A8" />
        <circle cx={size * 0.35} cy={size / 2} r={2.8} fill="#fff" opacity="0.9" />
        <circle cx={size * 0.65} cy={size / 2} r={2.8} fill="#fff" opacity="0.9" />
      </>
    ),
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {icons[name] || <rect width={size} height={size} rx={4} fill="#888" />}
    </svg>
  );
};

const PlatformLogo = ({ item, compact, theme }) => {
  if (item.kind === "image") {
    return (
      <img
        src={item.src}
        alt={item.name}
        width={item.imageWidth}
        height={item.imageIntrinsicHeight}
        decoding="async"
        style={{
          display: "block",
          height: item.imageHeight ?? (compact ? 18 : 22),
          width: "auto",
          maxWidth: "100%",
          objectFit: "contain",
        }}
      />
    );
  }

  if (item.kind === "text") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: theme.a1 }} />
        <span style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 700, fontSize: compact ? "0.86rem" : "0.92rem", color: item.color || theme.text, letterSpacing: "-0.03em" }}>
          {item.name}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ width: compact ? 28 : 30, height: compact ? 28 : 30, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.03)" }}>
        <LogoSVG name={item.icon || item.name} size={compact ? 18 : 20} />
      </div>
      <span style={{ fontWeight: 700, fontSize: compact ? "0.76rem" : "0.84rem", color: item.color || theme.text }}>
        {item.name}
      </span>
    </div>
  );
};

export default function App() {
  const [themeIndex] = useState(() =>
    typeof window === "undefined"
      ? 0
      : window.__AP_THEME_INDEX__ ?? Math.floor(Math.random() * THEMES.length)
  );
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1280 : window.innerWidth
  );
  const [showBelowFold, setShowBelowFold] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let cancelled = false;
    const reveal = () => {
      if (!cancelled) {
        setShowBelowFold(true);
      }
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(reveal, { timeout: 1200 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(reveal, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  const theme = THEMES[themeIndex];
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth < 1024;
  const navigationItems = isMobile
    ? []
    : [
        { label: "About", href: "/#about" },
        { label: "Services", href: "/#services" },
        { label: "Process", href: "/#process" },
        { label: "Results", href: "/#results" },
        { label: "FAQ", href: "/#faq" },
        { label: "Blog", href: "/blog" },
        { label: "Funnel Quiz", href: "/funnel-quiz" },
      ];

  const clay = (extra = "") =>
    `0 2px 4px rgba(0,0,0,${theme.iD}), 0 8px 18px rgba(0,0,0,${theme.iD * 1.3}), 0 24px 48px rgba(0,0,0,${theme.iD * 1.1}), inset 0 2px 4px rgba(255,255,255,${theme.iL}), inset 0 -1px 2px rgba(0,0,0,${theme.iD})${extra ? `, ${extra}` : ""}`;

  return (
    <div
      style={{
        background: theme.bg,
        color: theme.text,
        fontFamily: TYPOGRAPHY.body,
        minHeight: "100vh",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <SEOHead
        title={HOME_TITLE}
        description={HOME_DESCRIPTION}
        noindex={false}
        publicPaths={["/"]}
        schema={HOME_SCHEMA}
      />

      <style>{`
        @keyframes logoScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes blobDrift { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-25px) scale(1.04); } 66% { transform: translate(-20px,15px) scale(0.97); } }
        @keyframes pulseGlow { 0%,100% { opacity: 0.12; transform: scale(1); } 50% { opacity: 0.2; transform: scale(1.01); } }
        @keyframes heroLineIn {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroAccentPulse {
          0%,100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(-3px); opacity: 0.88; }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardFloat {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        @keyframes footerCtaBob {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes sectionReveal {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerGrad {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        nav a:hover { color: ${theme.a1} !important; transition: color 0.22s; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; scroll-padding-top: ${isMobile ? 24 : 32}px; }
        body { -webkit-font-smoothing: antialiased; }
        ::selection { background: ${theme.a1}; color: white; }
        .hero-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .hero-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {[
          { width: isMobile ? 320 : 550, height: isMobile ? 320 : 550, top: isMobile ? -90 : -160, left: isMobile ? -80 : -120, glow: theme.glow1 },
          { width: isMobile ? 360 : 650, height: isMobile ? 360 : 650, bottom: isMobile ? -120 : -220, right: isMobile ? -90 : -160, glow: theme.glow2 },
          { width: isMobile ? 250 : 420, height: isMobile ? 250 : 420, top: isMobile ? "54%" : "42%", left: isMobile ? "18%" : "32%", glow: theme.glow3 },
        ].map((blob, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              width: blob.width,
              height: blob.height,
              top: blob.top,
              left: blob.left,
              bottom: blob.bottom,
              right: blob.right,
              borderRadius: "50%",
              filter: "blur(100px)",
              background: `radial-gradient(circle,${blob.glow},transparent 70%)`,
              animation: `blobDrift ${22 + index * 4}s ease-in-out infinite${index === 1 ? " reverse" : ""}`,
              willChange: "transform",
            }}
          />
        ))}
      </div>

      <nav style={{ position: "relative", zIndex: 20, padding: isMobile ? "12px 14px 0" : "12px 20px 0" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: isTablet ? "wrap" : "nowrap",
            gap: 12,
            background: theme.navBg,
            backdropFilter: "blur(22px) saturate(1.5)",
            borderRadius: isTablet ? 28 : 999,
            padding: isMobile ? "12px 14px" : "8px 10px 8px 22px",
            boxShadow: clay(theme.cardGlow),
            border: `1px solid ${theme.navBorder}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: isMobile ? "center" : "flex-start", width: isMobile ? "100%" : "auto", color: theme.text }}>
            <img
              src={automationPathsBrandLogo}
              alt="Automation Paths"
              width="200"
              height="50"
              decoding="async"
              fetchpriority="high"
              style={{
                display: "block",
                height: isMobile ? 30 : 36,
                width: "auto",
                objectFit: "contain",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", width: isMobile ? "100%" : isTablet ? "100%" : "auto", justifyContent: isMobile ? "flex-start" : isTablet ? "space-between" : "flex-end" }}>
            {navigationItems.map((item) => (
                <a key={item.label} href={item.href} style={{ color: theme.text2, textDecoration: "none", fontSize: "0.84rem", fontWeight: 600, padding: "6px 14px", borderRadius: 999 }}>
                  {item.label}
                </a>
              ))}
            <a href={UPWORK_URL} target="_blank" rel="noreferrer" style={{ width: isMobile ? "100%" : "auto", padding: isMobile ? "12px 18px" : "8px 20px", background: theme.grad, color: "#fff", borderRadius: 999, fontWeight: 700, fontSize: "0.84rem", textDecoration: "none", boxShadow: `${theme.btnGlow}, inset 0 2px 4px rgba(255,255,255,0.3)`, textAlign: "center" }}>
              Hire on Upwork -&gt;
            </a>
          </div>
        </div>
      </nav>

      <section style={{ minHeight: isMobile ? "auto" : "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: isMobile ? "28px 14px 20px" : isTablet ? "48px 20px 72px" : "54px 20px 74px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: isMobile ? "5px 12px 5px 6px" : "6px 16px 6px 7px", background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 999, fontSize: isMobile ? "0.7rem" : "0.82rem", fontWeight: 600, color: theme.text2, marginBottom: isMobile ? 14 : 28, boxShadow: clay(theme.cardGlow), position: "relative", zIndex: 2, maxWidth: isMobile ? "100%" : "none", animation: "heroFadeUp 0.7s ease-out both, cardFloat 8s ease-in-out 1.1s infinite", willChange: "transform" }}>
          <span style={{ width: 24, height: 24, background: "linear-gradient(135deg,#34D399,#2DD4BF)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: "#fff" }}>
            +
          </span>
          GoHighLevel + AI automation for agencies fixing revenue systems
        </div>

        <h1 style={{ fontFamily: TYPOGRAPHY.head, fontSize: isMobile ? "clamp(2.15rem,11vw,3.1rem)" : "clamp(4.1rem,7.6vw,6.3rem)", lineHeight: isMobile ? 0.88 : 0.9, letterSpacing: isMobile ? "-0.07em" : "-0.055em", maxWidth: isTablet ? 880 : 1040, marginBottom: isMobile ? 10 : 22, color: theme.text, position: "relative", zIndex: 2 }}>
          <span style={{ display: "block", fontStyle: "normal", fontWeight: 800, animation: "heroLineIn 0.82s cubic-bezier(0.16,1,0.3,1) both", transformOrigin: "center bottom" }}>Your revenue system is</span>
          <span style={{ display: "block", fontStyle: "italic", fontWeight: 350, animation: "heroLineIn 0.82s cubic-bezier(0.16,1,0.3,1) 0.12s both", transformOrigin: "center bottom" }}>either compounding or leaking.</span>
          <span style={{ display: "block", fontStyle: "normal", fontWeight: 800, animation: "heroLineIn 0.82s cubic-bezier(0.16,1,0.3,1) 0.24s both", transformOrigin: "center bottom" }}>
            Most are <span style={{ color: theme.a1, fontWeight: 700, display: "inline-block", animation: "heroAccentPulse 2.8s ease-in-out 1.1s infinite", willChange: "transform" }}>leaking.</span>
          </span>
        </h1>

        <p style={{ fontSize: isMobile ? "0.9rem" : "1.14rem", color: theme.text2, maxWidth: isMobile ? 322 : 720, lineHeight: isMobile ? 1.58 : 1.78, marginBottom: isMobile ? 16 : 32, position: "relative", zIndex: 2, animation: "heroFadeUp 0.72s ease-out 0.32s both" }}>
          I build GoHighLevel CRM systems, Voice AI agents, and automation pipelines that generate, qualify, and close revenue — without you babysitting them. Systems that compound.
        </p>

        <div style={{ display: isMobile ? "grid" : "flex", gap: isMobile ? 10 : 12, gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : undefined, flexWrap: isMobile ? undefined : "wrap", width: isMobile ? "100%" : "auto", maxWidth: isMobile ? 340 : "none", justifyContent: "center", position: "relative", zIndex: 2, animation: "heroFadeUp 0.72s ease-out 0.44s both" }}>
          <a href={UPWORK_URL} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: isMobile ? "13px 14px" : "15px 30px", width: isMobile ? "100%" : "auto", background: theme.grad, color: "#fff", borderRadius: 999, fontWeight: 700, fontSize: isMobile ? "0.86rem" : "0.95rem", textDecoration: "none", boxShadow: `${theme.btnGlow}, inset 0 2px 6px rgba(255,255,255,0.25)` }}>
            Hire on Upwork -&gt;
          </a>
          <a href="/#results" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: isMobile ? "13px 14px" : "15px 26px", width: isMobile ? "100%" : "auto", background: theme.card, color: theme.text, borderRadius: 999, fontWeight: 600, fontSize: isMobile ? "0.86rem" : "0.95rem", textDecoration: "none", boxShadow: clay(), border: `1px solid ${theme.cardBorder}` }}>
            See Results
          </a>
        </div>

        <a href="/funnel-quiz" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: isMobile ? 14 : 20, padding: isMobile ? "8px 16px" : "9px 20px", background: theme.chipBg, color: theme.chipC, borderRadius: 999, fontWeight: 700, fontSize: isMobile ? "0.8rem" : "0.88rem", textDecoration: "none", position: "relative", zIndex: 2, animation: "heroFadeUp 0.72s ease-out 0.5s both" }}>
          <span aria-hidden="true">🩺</span> Take the free Funnel Health Quiz — 6 min -&gt;
        </a>

        <div className="hero-scroll" style={{ width: "100%", maxWidth: 1140, marginTop: isMobile ? 14 : 34, display: isMobile ? "flex" : "grid", gridTemplateColumns: isMobile ? undefined : "repeat(3, minmax(0, 1fr))", gap: isMobile ? 10 : 14, position: "relative", zIndex: 2, overflowX: isMobile ? "auto" : "visible", paddingBottom: isMobile ? 4 : 0, scrollSnapType: isMobile ? "x mandatory" : "none", animation: "heroFadeUp 0.76s ease-out 0.56s both" }}>
          {heroPrinciples.map((item, index) => (
            <div key={item.title} style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 24, padding: isMobile ? "14px 14px 12px" : "22px 22px", boxShadow: clay(theme.cardGlow), textAlign: "left", minWidth: isMobile ? "76vw" : "auto", maxWidth: isMobile ? 286 : "none", scrollSnapAlign: isMobile ? "start" : "none", flexShrink: 0, animation: `heroFadeUp 0.76s ease-out ${0.56 + index * 0.12}s both, cardFloat ${7 + index}s ease-in-out ${1 + index * 0.35}s infinite`, willChange: "transform" }}>
              <div style={{ width: isMobile ? 38 : 42, height: isMobile ? 38 : 42, borderRadius: 14, background: theme.chipBg, color: theme.a1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? "1rem" : "1.1rem", marginBottom: isMobile ? 8 : 14 }}>
                {item.emoji}
              </div>
              <div style={{ fontFamily: TYPOGRAPHY.head, fontSize: isMobile ? "0.92rem" : "1.06rem", fontWeight: 700, color: theme.text, marginBottom: 6, letterSpacing: "-0.03em" }}>{item.title}</div>
              <div style={{ color: theme.text2, fontSize: isMobile ? "0.8rem" : "0.88rem", lineHeight: isMobile ? 1.48 : 1.68, display: "-webkit-box", WebkitLineClamp: isMobile ? 3 : "unset", WebkitBoxOrient: "vertical", overflow: isMobile ? "hidden" : "visible" }}>{item.copy}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ padding: isMobile ? "20px 0 8px" : "28px 0", overflow: "hidden", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", fontSize: "0.72rem", color: theme.text3, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 18 }}>
          Platforms I architect across
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: isMobile ? 48 : 120, background: `linear-gradient(90deg,${theme.bg},transparent)`, zIndex: 2 }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: isMobile ? 48 : 120, background: `linear-gradient(-90deg,${theme.bg},transparent)`, zIndex: 2 }} />
          <div style={{ display: "flex", gap: isMobile ? 10 : 14, animation: "logoScroll 50s linear infinite", width: "max-content", willChange: "transform" }}>
            {[...platformLogos, ...platformLogos].map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: item.kind === "image" ? (isMobile ? 150 : 180) : isMobile ? 126 : 148,
                  padding: item.kind === "image" ? (isMobile ? "12px 18px" : "14px 22px") : isMobile ? "9px 12px" : "10px 14px",
                  background: theme.card,
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: 999,
                  boxShadow: clay(),
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                <PlatformLogo item={item} compact={isMobile} theme={theme} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {showBelowFold && (
        <Suspense fallback={null}>
          <BelowFoldSections
            theme={theme}
            isMobile={isMobile}
            isTablet={isTablet}
            clay={clay}
            typography={TYPOGRAPHY}
            upworkUrl={UPWORK_URL}
          />
        </Suspense>
      )}
    </div>
  );
}


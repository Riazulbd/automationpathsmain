// Shared visual language for standalone pages (e.g. the Funnel Health quiz).
// Mirrors the tokens used in automation-paths-final.jsx so pages feel native and
// respect the same randomized theme selected once per session in main.jsx.

export const TYPOGRAPHY = {
  display: "'Fraunces', Georgia, serif",
  head: "'Outfit', 'Fraunces', Georgia, serif",
  body: "'Manrope', sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

export const THEMES = [
  { id: "flame", name: "Sunset Flame", dark: false, bg: "#FFFAF5", bgDark: "#FFECE0", card: "#FFFFFF", cardBorder: "rgba(0,0,0,0.05)", text: "#1F1510", text2: "#6B5040", text3: "#A08878", a1: "#FF6B35", a2: "#FF4F81", grad: "linear-gradient(135deg,#FF6B35,#FF4F81,#FF2D87)", glow1: "rgba(255,107,53,0.18)", glow2: "rgba(255,79,129,0.12)", glow3: "rgba(255,140,66,0.10)", cardGlow: "0 0 40px rgba(255,107,53,0.05)", btnGlow: "0 6px 30px rgba(255,107,53,0.35), 0 0 50px rgba(255,79,129,0.12)", chipBg: "rgba(255,107,53,0.08)", chipC: "#E85A28", tagBg: "rgba(255,107,53,0.08)", tagC: "#E85A28", starG: "linear-gradient(135deg,#FFCB47,#FF8C42)", navBg: "rgba(255,250,245,0.75)", navBorder: "rgba(255,255,255,0.8)", hoverBorder: "rgba(255,107,53,0.3)", iL: 0.7, iD: 0.04 },
  { id: "ocean", name: "Sky Glass", dark: false, bg: "#F5FBFF", bgDark: "#E6F4FF", card: "#FFFFFF", cardBorder: "rgba(19,79,125,0.08)", text: "#14314B", text2: "#52748F", text3: "#8BA9BF", a1: "#06B6D4", a2: "#3B82F6", grad: "linear-gradient(135deg,#06B6D4,#3B82F6,#6366F1)", glow1: "rgba(6,182,212,0.18)", glow2: "rgba(59,130,246,0.12)", glow3: "rgba(99,102,241,0.10)", cardGlow: "0 0 45px rgba(6,182,212,0.05)", btnGlow: "0 6px 30px rgba(6,182,212,0.28)", chipBg: "rgba(6,182,212,0.10)", chipC: "#1599BF", tagBg: "rgba(6,182,212,0.10)", tagC: "#1599BF", starG: "linear-gradient(135deg,#FBBF24,#F59E0B)", navBg: "rgba(255,255,255,0.78)", navBorder: "rgba(255,255,255,0.84)", hoverBorder: "rgba(6,182,212,0.28)", iL: 0.7, iD: 0.04 },
];

// Resolve the session theme picked once in main.jsx (falls back to the first theme
// during SSR / before the global is set).
export function useSessionTheme() {
  if (typeof window === "undefined") return THEMES[0];
  const index = typeof window.__AP_THEME_INDEX__ === "number" ? window.__AP_THEME_INDEX__ : 0;
  return THEMES[index] || THEMES[0];
}

// Soft "clay" / neumorphic shadow stack used across the site.
export function makeClay(theme, extra = "") {
  const base = `0 2px 4px rgba(0,0,0,${theme.iD}), 0 8px 18px rgba(0,0,0,${theme.iD * 1.3}), 0 24px 48px rgba(0,0,0,${theme.iD * 1.1}), inset 0 2px 4px rgba(255,255,255,${theme.iL}), inset 0 -1px 2px rgba(0,0,0,${theme.iD})`;
  return extra ? `${base}, ${extra}` : base;
}

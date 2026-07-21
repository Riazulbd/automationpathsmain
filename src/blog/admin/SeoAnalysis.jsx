import React, { useMemo, useState } from "react";
import { Check, AlertTriangle, X, ChevronDown, Info } from "lucide-react";
import { TYPOGRAPHY } from "../../quiz/theme.js";
import { analyzeContent, scoreBand } from "./seoScore.js";

// Circular score gauge (SVG), matching the reference design.
function Gauge({ score, color }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circ;
  return (
    <div style={{ position: "relative", width: 66, height: 66, flexShrink: 0 }}>
      <svg width="66" height="66" viewBox="0 0 66 66" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="33" cy="33" r={r} fill="none" stroke="rgba(128,128,128,0.18)" strokeWidth="6" />
        <circle
          cx="33" cy="33" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.5s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 1 }}>
        <span style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: "1.15rem", color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: "0.6rem", color, opacity: 0.75, fontWeight: 700 }}>%</span>
      </div>
    </div>
  );
}

const STATUS_ICON = {
  good: { Icon: Check, color: "#10B981" },
  ok: { Icon: AlertTriangle, color: "#F59E0B" },
  bad: { Icon: X, color: "#EF4444" },
};

function CheckRow({ check, theme }) {
  const { Icon, color } = STATUS_ICON[check.status] || STATUS_ICON.bad;
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "6px 0" }} title={check.tip}>
      <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: 5, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
        <Icon size={12} color={color} strokeWidth={3} />
      </span>
      <span style={{ fontSize: "0.82rem", color: theme.text2, lineHeight: 1.4 }}>{check.label}</span>
    </div>
  );
}

function CategoryCard({ cat, theme, open, onToggle }) {
  const band = scoreBand(cat.score);
  const order = { bad: 0, ok: 1, good: 2 };
  const sorted = [...cat.checks].sort((a, b) => order[a.status] - order[b.status]);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      style={{
        border: `1px solid ${open ? theme.hoverBorder || theme.chipC : theme.cardBorder}`,
        borderRadius: 16,
        padding: "16px 16px",
        marginBottom: 12,
        background: theme.card,
        transition: "border-color 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={onToggle}>
        <Gauge score={cat.score} color={band.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: "1.05rem", color: theme.text }}>{cat.label}</span>
            <span
              onClick={(e) => { e.stopPropagation(); setShowInfo((s) => !s); }}
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
              style={{ position: "relative", display: "inline-flex", cursor: "help" }}
            >
              <Info size={14} color={theme.text3} />
              {showInfo && (
                <span style={{ position: "absolute", top: "130%", left: "50%", transform: "translateX(-50%)", width: 240, background: theme.text, color: theme.bg, fontSize: "0.72rem", lineHeight: 1.45, fontWeight: 500, padding: "9px 11px", borderRadius: 9, zIndex: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
                  {cat.info}
                </span>
              )}
            </span>
          </div>
          <div style={{ fontSize: "0.82rem", color: theme.text2, lineHeight: 1.4, marginTop: 3 }}>{cat.description}</div>
        </div>
        <ChevronDown size={18} color={theme.text3} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </div>

      {open && (
        <div style={{ marginTop: 12, paddingTop: 8, borderTop: `1px solid ${theme.cardBorder}` }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 8, fontSize: "0.74rem", fontWeight: 700 }}>
            <span style={{ color: "#10B981" }}>{cat.passed} passed</span>
            {cat.warnings > 0 && <span style={{ color: "#F59E0B" }}>{cat.warnings} warnings</span>}
            {cat.failed > 0 && <span style={{ color: "#EF4444" }}>{cat.failed} to fix</span>}
          </div>
          {sorted.map((ch) => <CheckRow key={ch.id} check={ch} theme={theme} />)}
        </div>
      )}
    </div>
  );
}

export default function SeoAnalysis({ form, theme, onSetKeyword, cardStyle, labelStyle, inpStyle }) {
  const [openId, setOpenId] = useState("seo");
  const analysis = useMemo(() => analyzeContent(form), [form]);

  return (
    <div style={{ ...cardStyle, padding: "16px 16px 4px" }}>
      <div style={{ ...labelStyle, marginBottom: 12 }}>Content score</div>

      {/* Focus keyword drives the SEO checks — surface it up top. */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Focus keyword</label>
        <input
          value={form.focus_keyword || ""}
          onChange={(e) => onSetKeyword(e.target.value)}
          placeholder="e.g. gohighlevel crm setup"
          style={{ ...inpStyle, fontSize: "0.85rem" }}
        />
      </div>

      {analysis.categories.map((cat) => (
        <CategoryCard
          key={cat.id}
          cat={cat}
          theme={theme}
          open={openId === cat.id}
          onToggle={() => setOpenId((id) => (id === cat.id ? null : cat.id))}
        />
      ))}
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from "react";
import SEOHead from "../SEOHead.jsx";
import automationPathsBrandLogo from "../../Automation Paths Logo (3).png";
import { TYPOGRAPHY, useSessionTheme, makeClay } from "./theme.js";
import { PROFILE_QUESTIONS, DIAGNOSTIC_QUESTIONS, CATEGORIES } from "./quizData.js";

const TOKEN_KEY = "quiz_dash_token";

const LEVEL_COLOR = {
  "Strong and Scalable": "#10B981",
  "Functional with Hidden Leaks": "#F59E0B",
  "Revenue Leakage Risk": "#F97316",
  "Critical Funnel Blindness": "#EF4444",
};
const SEV_COLOR = {
  Healthy: "#10B981",
  Improvement: "#F59E0B",
  "High Risk": "#F97316",
  Critical: "#EF4444",
};

const PROFILE_BY_KEY = new Map(PROFILE_QUESTIONS.map((q) => [q.key, q]));
const DIAG_BY_ID = new Map(DIAGNOSTIC_QUESTIONS.map((q) => [q.id, q]));
const CAT_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

function scoreColor(score) {
  if (score >= 85) return "#10B981";
  if (score >= 70) return "#F59E0B";
  if (score >= 50) return "#F97316";
  return "#EF4444";
}

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// Reconstruct the option text a participant chose for a diagnostic question.
function diagnosticSelection(sub, q) {
  const raw = sub.answers?.[q.id] ?? sub.answers?.[String(q.id)];
  if (raw == null) return { text: "—", points: null, letter: "" };
  const option = q.options[raw];
  return {
    text: option ? option.text : "—",
    points: option ? option.points : null,
    letter: ["A", "B", "C", "D"][raw] || "",
  };
}

function profileSelection(sub, q) {
  const v = sub.profile?.[q.key];
  if (v == null) return "—";
  return Array.isArray(v) ? v.join(", ") : v;
}

// ---------------------------------------------------------------------------
export default function QuizDashboard() {
  const theme = useSessionTheme();
  const clay = useCallback((extra) => makeClay(theme, extra), [theme]);
  const [width, setWidth] = useState(typeof window === "undefined" ? 1200 : window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isMobile = width < 820;

  const [token, setToken] = useState(() =>
    typeof window === "undefined" ? null : sessionStorage.getItem(TOKEN_KEY)
  );
  const [submissions, setSubmissions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);

  const loadSubmissions = useCallback(async (tok) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/quiz/dashboard/submissions", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setSubmissions(null);
        setError("Session expired — please sign in again.");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const body = await res.json();
      setSubmissions(body.submissions || []);
    } catch (e) {
      setError(
        e.message === "Failed to fetch"
          ? "Could not reach the API. Is the server running (npm run server:dev)?"
          : e.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) loadSubmissions(token);
  }, [token, loadSubmissions]);

  const onLogin = useCallback(
    async (password) => {
      setError("");
      try {
        const res = await fetch("/api/quiz/dashboard/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Login failed");
        sessionStorage.setItem(TOKEN_KEY, body.token);
        setToken(body.token);
      } catch (e) {
        setError(
          e.message === "Failed to fetch"
            ? "Could not reach the API. Is the server running (npm run server:dev)?"
            : e.message
        );
      }
    },
    []
  );

  const onLogout = useCallback(() => {
    fetch("/api/quiz/dashboard/logout", { method: "POST" }).catch(() => {});
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setSubmissions(null);
  }, []);

  const shell = {
    background: theme.bg,
    color: theme.text,
    fontFamily: TYPOGRAPHY.body,
    minHeight: "100vh",
    position: "relative",
  };

  return (
    <div style={shell}>
      <SEOHead
        title="Quiz Submissions | Automation Paths"
        description="Private dashboard."
        path="/funnel-quiz/admin"
        publicPaths={["/"]}
        noindex
      />
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { -webkit-font-smoothing: antialiased; }
        input::placeholder { color: ${theme.text3}; }
        .qd-row:hover { background: ${theme.chipBg} !important; }
        .qd-btn { transition: transform 0.14s ease; }
        .qd-btn:hover { transform: translateY(-1px); }
      `}</style>

      {!token ? (
        <LoginScreen theme={theme} clay={clay} onLogin={onLogin} error={error} isMobile={isMobile} />
      ) : (
        <DashboardScreen
          theme={theme}
          clay={clay}
          isMobile={isMobile}
          submissions={submissions}
          loading={loading}
          error={error}
          onRefresh={() => loadSubmissions(token)}
          onLogout={onLogout}
          onOpen={setDetail}
        />
      )}

      {detail && (
        <DetailModal theme={theme} clay={clay} isMobile={isMobile} sub={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function LoginScreen({ theme, clay, onLogin, error, isMobile }) {
  const [password, setPassword] = useState("");
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div
        style={{
          background: theme.card,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 22,
          boxShadow: clay(theme.cardGlow),
          padding: isMobile ? "28px 22px" : "38px 40px",
          width: "100%",
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        <img
          src={automationPathsBrandLogo}
          alt="Automation Paths"
          style={{ height: 30, width: "auto", objectFit: "contain", marginBottom: 22 }}
        />
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 14,
            background: theme.grad,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.4rem",
            margin: "0 auto 16px",
            boxShadow: theme.btnGlow,
          }}
        >
          🔒
        </div>
        <h1 style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: "1.4rem", marginBottom: 6 }}>
          Quiz Submissions
        </h1>
        <p style={{ color: theme.text2, fontSize: "0.9rem", marginBottom: 22 }}>
          Enter the dashboard password to continue.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin(password);
          }}
        >
          <input
            type="password"
            placeholder="Password"
            value={password}
            autoFocus
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "13px 16px",
              borderRadius: 12,
              border: `1.5px solid ${theme.cardBorder}`,
              background: theme.bg,
              color: theme.text,
              fontSize: "1rem",
              fontFamily: TYPOGRAPHY.body,
              outline: "none",
              marginBottom: 12,
            }}
          />
          {error && (
            <div style={{ color: "#EF4444", fontSize: "0.84rem", fontWeight: 600, marginBottom: 12 }}>{error}</div>
          )}
          <button
            type="submit"
            className="qd-btn"
            style={{
              width: "100%",
              padding: "13px",
              background: theme.grad,
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              fontFamily: TYPOGRAPHY.body,
              boxShadow: theme.btnGlow,
            }}
          >
            Unlock dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function StatCard({ theme, clay, label, value, color }) {
  return (
    <div
      style={{
        background: theme.card,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 16,
        boxShadow: clay(),
        padding: "16px 18px",
        flex: "1 1 140px",
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: theme.text3, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: "1.8rem", color: color || theme.text, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function DashboardScreen({ theme, clay, isMobile, submissions, loading, error, onRefresh, onLogout, onOpen }) {
  const rows = submissions || [];
  const stats = useMemo(() => {
    if (!rows.length) return { total: 0, avg: 0, criticals: 0, levels: {} };
    const total = rows.length;
    const avg = Math.round(rows.reduce((s, r) => s + (r.health_score || 0), 0) / total);
    const criticals = rows.filter((r) => (r.critical_flags?.length || 0) > 0).length;
    const levels = rows.reduce((acc, r) => {
      acc[r.result_level] = (acc[r.result_level] || 0) + 1;
      return acc;
    }, {});
    return { total, avg, criticals, levels };
  }, [rows]);

  const exportCsv = useCallback(() => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const headers = [
      "Submitted At",
      "Name",
      "Email",
      "Health Score",
      "Result Level",
      "Total Risk",
      "Top Leaks",
      "Critical Flags",
      ...PROFILE_QUESTIONS.map((q) => q.key),
      ...DIAGNOSTIC_QUESTIONS.map((q) => `Q${q.id}`),
    ];
    const lines = rows.map((r) => {
      const base = [
        r.created_at,
        r.name,
        r.email,
        r.health_score,
        r.result_level,
        r.total_risk_points,
        (r.top_leaks || []).map((l) => `${l.name} (${l.levelShort})`).join(" | "),
        (r.critical_flags || []).map((f) => f.label).join(" | "),
      ];
      const profile = PROFILE_QUESTIONS.map((q) => profileSelection(r, q));
      const diag = DIAGNOSTIC_QUESTIONS.map((q) => diagnosticSelection(r, q).text);
      return [...base, ...profile, ...diag].map(esc).join(",");
    });
    const csv = [headers.map(esc).join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "funnel-quiz-submissions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "16px 14px 60px" : "22px 24px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={automationPathsBrandLogo} alt="Automation Paths" style={{ height: 28, width: "auto", objectFit: "contain" }} />
          <div>
            <div style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: "1.25rem", lineHeight: 1 }}>Funnel Quiz — Submissions</div>
            <div style={{ fontSize: "0.78rem", color: theme.text3, marginTop: 3 }}>{stats.total} total responses</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onRefresh} className="qd-btn" style={btnGhost(theme)}>↻ Refresh</button>
          <button onClick={exportCsv} className="qd-btn" style={btnGhost(theme)} disabled={!rows.length}>⬇ CSV</button>
          <button onClick={onLogout} className="qd-btn" style={btnGhost(theme)}>Log out</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <StatCard theme={theme} clay={clay} label="Submissions" value={stats.total} />
        <StatCard theme={theme} clay={clay} label="Avg. Score" value={rows.length ? `${stats.avg}` : "—"} color={rows.length ? scoreColor(stats.avg) : theme.text} />
        <StatCard theme={theme} clay={clay} label="With Criticals" value={stats.criticals} color={stats.criticals ? "#EF4444" : theme.text} />
        <StatCard theme={theme} clay={clay} label="Critical Blindness" value={stats.levels["Critical Funnel Blindness"] || 0} />
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#DC2626", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: "0.88rem", fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 18, boxShadow: clay(), overflow: "hidden" }}>
        {loading && !rows.length ? (
          <div style={{ padding: 40, textAlign: "center", color: theme.text3 }}>Loading…</div>
        ) : !rows.length ? (
          <div style={{ padding: 48, textAlign: "center", color: theme.text3 }}>
            No submissions yet. They'll appear here as people complete the quiz.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", minWidth: 720 }}>
              <thead>
                <tr style={{ textAlign: "left", color: theme.text3, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <th style={th}>Date</th>
                  <th style={th}>Name</th>
                  <th style={th}>Email</th>
                  <th style={th}>Score</th>
                  <th style={th}>Level</th>
                  <th style={th}>Top Leak</th>
                  <th style={th}>Criticals</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const topLeak = (r.top_leaks || [])[0];
                  const nCrit = r.critical_flags?.length || 0;
                  return (
                    <tr
                      key={r.id || i}
                      className="qd-row"
                      onClick={() => onOpen(r)}
                      style={{ cursor: "pointer", borderTop: `1px solid ${theme.cardBorder}` }}
                    >
                      <td style={{ ...td, color: theme.text2, whiteSpace: "nowrap" }}>{fmtDate(r.created_at)}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
                      <td style={{ ...td, color: theme.text2 }}>{r.email}</td>
                      <td style={td}>
                        <span style={{ fontWeight: 800, color: scoreColor(r.health_score) }}>{r.health_score}</span>
                        <span style={{ color: theme.text3 }}>/100</span>
                      </td>
                      <td style={{ ...td }}>
                        <span style={{ color: LEVEL_COLOR[r.result_level] || theme.text, fontWeight: 600, fontSize: "0.82rem" }}>{r.result_level}</span>
                      </td>
                      <td style={{ ...td, color: theme.text2, fontSize: "0.82rem" }}>
                        {topLeak ? `${topLeak.name} (${topLeak.levelShort})` : "—"}
                      </td>
                      <td style={td}>
                        {nCrit > 0 ? (
                          <span style={{ background: "rgba(239,68,68,0.14)", color: "#DC2626", borderRadius: 999, padding: "2px 9px", fontWeight: 800, fontSize: "0.74rem" }}>{nCrit}</span>
                        ) : (
                          <span style={{ color: theme.text3 }}>0</span>
                        )}
                      </td>
                      <td style={{ ...td, color: theme.a1, fontWeight: 700, whiteSpace: "nowrap" }}>View →</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function DetailModal({ theme, clay, isMobile, sub, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const catScores = sub.category_scores || [];
  const catById = new Map(catScores.map((c) => [c.id, c]));

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: isMobile ? "0" : "40px 20px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.bg,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: isMobile ? 0 : 22,
          width: "100%",
          maxWidth: 760,
          boxShadow: "0 30px 80px rgba(0,0,0,0.3)",
          minHeight: isMobile ? "100vh" : "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            background: theme.card,
            borderBottom: `1px solid ${theme.cardBorder}`,
            borderRadius: isMobile ? 0 : "22px 22px 0 0",
            padding: isMobile ? "16px 18px" : "20px 26px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            zIndex: 2,
          }}
        >
          <div>
            <div style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: "1.2rem" }}>{sub.name}</div>
            <div style={{ color: theme.text2, fontSize: "0.86rem" }}>{sub.email}</div>
            <div style={{ color: theme.text3, fontSize: "0.78rem", marginTop: 2 }}>{fmtDate(sub.created_at)}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: "1.8rem", color: scoreColor(sub.health_score), lineHeight: 1 }}>
                {sub.health_score}<span style={{ fontSize: "0.9rem", color: theme.text3 }}>/100</span>
              </div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: LEVEL_COLOR[sub.result_level] || theme.text }}>{sub.result_level}</div>
            </div>
            <button onClick={onClose} style={{ background: theme.chipBg, border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: "1.1rem", color: theme.text2 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: isMobile ? "18px" : "24px 26px" }}>
          {/* Critical flags */}
          {(sub.critical_flags?.length || 0) > 0 && (
            <Section title="⚠️ Revenue-critical warnings" theme={theme}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {sub.critical_flags.map((f) => (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.86rem", color: theme.text }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444" }} />
                    {f.label}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Category scores */}
          <Section title="Category scores" theme={theme}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
              {catScores.map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 10 }}>
                  <span style={{ fontSize: "0.84rem" }}>{c.name}</span>
                  <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: "0.78rem", color: theme.text3 }}>{c.score}/{c.max}</span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: SEV_COLOR[c.levelShort] || theme.text }}>{c.levelShort}</span>
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* Business profile — all selections */}
          <Section title="Business profile" theme={theme}>
            {PROFILE_QUESTIONS.map((q) => (
              <QARow key={q.id} theme={theme} q={`${q.prompt}`} a={profileSelection(sub, q)} />
            ))}
          </Section>

          {/* Diagnostic answers — all 27 selections, grouped by category */}
          {CATEGORIES.map((cat) => {
            const cs = catById.get(cat.id);
            return (
              <Section
                key={cat.id}
                theme={theme}
                title={cat.name}
                right={cs ? <span style={{ fontSize: "0.72rem", fontWeight: 800, color: SEV_COLOR[cs.levelShort] || theme.text }}>{cs.score}/{cs.max} · {cs.levelShort}</span> : null}
              >
                {cat.questionIds.map((qid) => {
                  const q = DIAG_BY_ID.get(qid);
                  const sel = diagnosticSelection(sub, q);
                  return (
                    <QARow
                      key={qid}
                      theme={theme}
                      q={`${qid}. ${q.prompt}`}
                      a={sel.text}
                      badge={sel.letter}
                      points={sel.points}
                    />
                  );
                })}
              </Section>
            );
          })}

          {/* Attribution */}
          <Section title="Attribution" theme={theme}>
            <QARow theme={theme} q="Page" a={sub.page_path || "—"} />
            <QARow theme={theme} q="Referrer" a={sub.referrer || "—"} />
            <QARow theme={theme} q="User agent" a={sub.user_agent || "—"} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, right, theme, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 700, fontSize: "0.95rem", color: theme.text }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function QARow({ theme, q, a, badge, points }) {
  const pointColor = points == null ? theme.text3 : ["#10B981", "#F59E0B", "#F97316", "#EF4444"][points] || theme.text3;
  return (
    <div style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${theme.cardBorder}`, alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.8rem", color: theme.text3, marginBottom: 2, lineHeight: 1.4 }}>{q}</div>
        <div style={{ fontSize: "0.9rem", color: theme.text, fontWeight: 600, lineHeight: 1.4 }}>
          {badge ? <span style={{ color: theme.a1, marginRight: 6 }}>{badge}.</span> : null}
          {a}
        </div>
      </div>
      {points != null && (
        <span
          title={`${points} risk point${points === 1 ? "" : "s"}`}
          style={{ flexShrink: 0, marginTop: 2, width: 22, height: 22, borderRadius: 7, background: `${pointColor}22`, color: pointColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.74rem", fontWeight: 800 }}
        >
          {points}
        </span>
      )}
    </div>
  );
}

const th = { padding: "12px 14px", fontWeight: 700 };
const td = { padding: "12px 14px" };
function btnGhost(theme) {
  return {
    padding: "9px 16px",
    background: theme.card,
    color: theme.text2,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: 999,
    fontWeight: 600,
    fontSize: "0.82rem",
    cursor: "pointer",
    fontFamily: TYPOGRAPHY.body,
  };
}

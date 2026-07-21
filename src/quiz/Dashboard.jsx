import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import SEOHead from "../SEOHead.jsx";
import automationPathsBrandLogo from "../../Automation Paths Logo (3).png";
import { TYPOGRAPHY, useSessionTheme, makeClay } from "./theme.js";
import { PROFILE_QUESTIONS, DIAGNOSTIC_QUESTIONS, CATEGORIES } from "./quizData.js";

const BlogAdmin = lazy(() => import("../blog/admin/BlogAdmin.jsx"));

const TOKEN_KEY = "quiz_dash_token";
const API = "/api/dashboard";

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

const DIAG_BY_ID = new Map(DIAGNOSTIC_QUESTIONS.map((q) => [q.id, q]));

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
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
function fmtNum(n) {
  return typeof n === "number" ? n.toLocaleString() : "—";
}

function diagnosticSelection(sub, q) {
  const raw = sub.answers?.[q.id] ?? sub.answers?.[String(q.id)];
  if (raw == null) return { text: "—", points: null, letter: "" };
  const option = q.options[raw];
  return { text: option ? option.text : "—", points: option ? option.points : null, letter: ["A", "B", "C", "D"][raw] || "" };
}
function profileSelection(sub, q) {
  const v = sub.profile?.[q.key];
  if (v == null) return "—";
  return Array.isArray(v) ? v.join(", ") : v;
}

// ---------------------------------------------------------------------------
export default function Dashboard() {
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
  const [tab, setTab] = useState("overview");
  const [submissions, setSubmissions] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);

  const authGet = useCallback(
    async (path, tok) => {
      const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${tok}` } });
      if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        throw new Error("__expired__");
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      return body;
    },
    []
  );

  const loadAll = useCallback(
    async (tok) => {
      setLoading(true);
      setError("");
      const results = await Promise.allSettled([authGet("/submissions", tok), authGet("/analytics?days=30", tok)]);
      const [subs, an] = results;
      if (subs.status === "fulfilled") setSubmissions(subs.value.submissions || []);
      if (an.status === "fulfilled") setAnalytics(an.value);

      const firstErr = results.find((r) => r.status === "rejected");
      if (firstErr) {
        const msg = firstErr.reason?.message || "";
        if (msg === "__expired__") setError("Session expired — please sign in again.");
        else if (msg === "Failed to fetch") setError("Could not reach the API. Is the server running (npm run server:dev)?");
        else setError(msg);
      }
      setLoading(false);
    },
    [authGet]
  );

  useEffect(() => {
    if (token) loadAll(token);
  }, [token, loadAll]);

  const onLogin = useCallback(async (password) => {
    setError("");
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.token) throw new Error(body.error || "Login failed");
      sessionStorage.setItem(TOKEN_KEY, body.token);
      setToken(body.token);
    } catch (e) {
      setError(e.message === "Failed to fetch" ? "Could not reach the API. Is the server running (npm run server:dev)?" : e.message);
    }
  }, []);

  const onLogout = useCallback(() => {
    fetch(`${API}/logout`, { method: "POST" }).catch(() => {});
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setSubmissions(null);
    setAnalytics(null);
  }, []);

  const onExpired = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setError("Session expired — please sign in again.");
  }, []);

  const shell = { background: theme.bg, color: theme.text, fontFamily: TYPOGRAPHY.body, minHeight: "100vh", position: "relative" };

  return (
    <div style={shell}>
      <SEOHead title="Dashboard | Automation Paths" description="Private dashboard." path="/dashboard" publicPaths={["/"]} noindex />
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { -webkit-font-smoothing: antialiased; }
        input::placeholder { color: ${theme.text3}; }
        .qd-row:hover { background: ${theme.chipBg} !important; }
        .qd-btn { transition: transform 0.14s ease; }
        .qd-btn:hover { transform: translateY(-1px); }
        .qd-bar:hover .qd-tip { opacity: 1; }
      `}</style>

      {!token ? (
        <LoginScreen theme={theme} clay={clay} onLogin={onLogin} error={error} isMobile={isMobile} />
      ) : (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "16px 14px 60px" : "22px 24px 80px" }}>
          <Header
            theme={theme}
            isMobile={isMobile}
            submissions={submissions}
            onRefresh={() => loadAll(token)}
            onLogout={onLogout}
            onExport={submissions ? () => exportCsv(submissions) : null}
          />

          <Tabs theme={theme} tab={tab} setTab={setTab} isMobile={isMobile} />

          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#DC2626", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: "0.86rem", fontWeight: 600 }}>
              {error}
            </div>
          )}

          {tab === "overview" && (
            <Overview theme={theme} clay={clay} isMobile={isMobile} analytics={analytics} submissions={submissions} loading={loading} />
          )}
          {tab === "submissions" && (
            <Submissions theme={theme} clay={clay} isMobile={isMobile} submissions={submissions} loading={loading} onOpen={setDetail} />
          )}
          {tab === "blog" && (
            <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: theme.text3 }}>Loading editor…</div>}>
              <BlogAdmin token={token} theme={theme} isMobile={isMobile} onExpired={onExpired} />
            </Suspense>
          )}
        </div>
      )}

      {detail && <DetailModal theme={theme} clay={clay} isMobile={isMobile} sub={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
function Header({ theme, isMobile, submissions, onRefresh, onLogout, onExport }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <img src={automationPathsBrandLogo} alt="Automation Paths" style={{ height: 28, width: "auto", objectFit: "contain" }} />
        <div>
          <div style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: "1.25rem", lineHeight: 1 }}>Dashboard</div>
          <div style={{ fontSize: "0.78rem", color: theme.text3, marginTop: 3 }}>Website analytics & quiz submissions</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onRefresh} className="qd-btn" style={btnGhost(theme)}>↻ Refresh</button>
        {onExport && <button onClick={onExport} className="qd-btn" style={btnGhost(theme)} disabled={!submissions?.length}>⬇ CSV</button>}
        <button onClick={onLogout} className="qd-btn" style={btnGhost(theme)}>Log out</button>
      </div>
    </div>
  );
}

function Tabs({ theme, tab, setTab, isMobile }) {
  const items = [
    { id: "overview", label: "Overview" },
    { id: "submissions", label: "Submissions" },
    { id: "blog", label: "Blog" },
  ];
  return (
    <div style={{ display: "inline-flex", gap: 4, padding: 4, background: theme.chipBg, borderRadius: 999, marginBottom: 20 }}>
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => setTab(it.id)}
          style={{
            padding: isMobile ? "8px 18px" : "9px 24px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            fontFamily: TYPOGRAPHY.body,
            fontWeight: 700,
            fontSize: "0.86rem",
            background: tab === it.id ? theme.grad : "transparent",
            color: tab === it.id ? "#fff" : theme.text2,
            boxShadow: tab === it.id ? theme.btnGlow : "none",
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
function Overview({ theme, clay, isMobile, analytics, submissions, loading }) {
  const subStats = useMemo(() => {
    const rows = submissions || [];
    if (!rows.length) return { total: 0, avg: 0, criticals: 0 };
    const total = rows.length;
    const avg = Math.round(rows.reduce((s, r) => s + (r.health_score || 0), 0) / total);
    const criticals = rows.filter((r) => (r.critical_flags?.length || 0) > 0).length;
    return { total, avg, criticals };
  }, [submissions]);

  const a = analytics;
  const days = a?.range_days || 30;

  return (
    <div>
      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
        <Metric theme={theme} clay={clay} label="Page Views" value={a ? fmtNum(a.total_pageviews) : "—"} sub={`last ${days} days`} />
        <Metric theme={theme} clay={clay} label="Unique Visitors" value={a ? fmtNum(a.unique_visitors) : "—"} sub={`last ${days} days`} color={theme.a1} />
        <Metric theme={theme} clay={clay} label="Clicks" value={a ? fmtNum(a.total_clicks) : "—"} sub={`last ${days} days`} />
        <Metric theme={theme} clay={clay} label="Quiz Submissions" value={fmtNum(subStats.total)} sub={submissions ? `${subStats.criticals} with criticals` : ""} color="#10B981" />
      </div>

      {!a && !loading && (
        <div style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 16, boxShadow: clay(), padding: 22, marginBottom: 18, color: theme.text2, fontSize: "0.9rem" }}>
          Analytics aren't available yet. Make sure you ran <b>supabase/analytics.sql</b> and that the site has received some traffic.
        </div>
      )}

      {/* Traffic chart */}
      {a && (
        <Card theme={theme} clay={clay} title={`Traffic — last ${days} days`}>
          <TrafficChart theme={theme} data={a.by_day || []} isMobile={isMobile} />
        </Card>
      )}

      {/* Top pages + top clicks */}
      {a && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          <Card theme={theme} clay={clay} title="Top pages">
            <RankList theme={theme} rows={(a.top_pages || []).map((p) => ({ label: p.path, value: p.views }))} empty="No page views yet." unit="views" />
          </Card>
          <Card theme={theme} clay={clay} title="Top clicks">
            <RankList theme={theme} rows={(a.top_clicks || []).map((c) => ({ label: c.label, value: c.count }))} empty="No clicks tracked yet." unit="clicks" />
          </Card>
        </div>
      )}
    </div>
  );
}

function Metric({ theme, clay, label, value, sub, color }) {
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 16, boxShadow: clay(), padding: "16px 18px" }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: theme.text3, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: "1.9rem", color: color || theme.text, lineHeight: 1 }}>{value}</div>
      {sub ? <div style={{ fontSize: "0.72rem", color: theme.text3, marginTop: 5 }}>{sub}</div> : null}
    </div>
  );
}

function Card({ theme, clay, title, children }) {
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 18, boxShadow: clay(), padding: "20px 22px", marginBottom: 16 }}>
      <div style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 700, fontSize: "1rem", marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

function TrafficChart({ theme, data, isMobile }) {
  if (!data.length) return <div style={{ color: theme.text3, fontSize: "0.86rem" }}>No traffic in this period yet.</div>;
  const max = Math.max(1, ...data.map((d) => d.pageviews));
  const show = data.slice(-30);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: isMobile ? 3 : 5, height: 140 }}>
        {show.map((d) => {
          const h = Math.max(3, (d.pageviews / max) * 130);
          const vh = Math.max(0, (d.visitors / max) * 130);
          return (
            <div key={d.day} className="qd-bar" style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", height: "100%" }}>
              <div style={{ position: "relative", width: "100%", maxWidth: 26, height: h, borderRadius: "5px 5px 0 0", background: theme.chipBg, overflow: "hidden" }}>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: vh, background: theme.grad }} />
              </div>
              <div className="qd-tip" style={{ position: "absolute", bottom: "100%", marginBottom: 6, background: theme.text, color: theme.bg, fontSize: "0.68rem", fontWeight: 700, padding: "4px 8px", borderRadius: 8, whiteSpace: "nowrap", opacity: 0, transition: "opacity 0.15s", pointerEvents: "none", zIndex: 3 }}>
                {d.day}: {d.pageviews} views · {d.visitors} visitors · {d.clicks} clicks
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: "0.74rem", color: theme.text3 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: theme.chipBg, border: `1px solid ${theme.cardBorder}` }} /> Page views</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: theme.grad }} /> Unique visitors</span>
      </div>
    </div>
  );
}

function RankList({ theme, rows, empty, unit }) {
  if (!rows.length) return <div style={{ color: theme.text3, fontSize: "0.86rem" }}>{empty}</div>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: "0.84rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{r.label || "(none)"}</span>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: theme.text2, flexShrink: 0 }}>{r.value.toLocaleString()} <span style={{ color: theme.text3, fontWeight: 500 }}>{unit}</span></span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: theme.chipBg, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(r.value / max) * 100}%`, background: theme.grad, borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
function Submissions({ theme, clay, isMobile, submissions, loading, onOpen }) {
  const rows = submissions || [];
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 18, boxShadow: clay(), overflow: "hidden" }}>
      {loading && !rows.length ? (
        <div style={{ padding: 40, textAlign: "center", color: theme.text3 }}>Loading…</div>
      ) : !rows.length ? (
        <div style={{ padding: 48, textAlign: "center", color: theme.text3 }}>No submissions yet. They'll appear here as people complete the quiz.</div>
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
                  <tr key={r.id || i} className="qd-row" onClick={() => onOpen(r)} style={{ cursor: "pointer", borderTop: `1px solid ${theme.cardBorder}` }}>
                    <td style={{ ...td, color: theme.text2, whiteSpace: "nowrap" }}>{fmtDate(r.created_at)}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
                    <td style={{ ...td, color: theme.text2 }}>{r.email}</td>
                    <td style={td}><span style={{ fontWeight: 800, color: scoreColor(r.health_score) }}>{r.health_score}</span><span style={{ color: theme.text3 }}>/100</span></td>
                    <td style={td}><span style={{ color: LEVEL_COLOR[r.result_level] || theme.text, fontWeight: 600, fontSize: "0.82rem" }}>{r.result_level}</span></td>
                    <td style={{ ...td, color: theme.text2, fontSize: "0.82rem" }}>{topLeak ? `${topLeak.name} (${topLeak.levelShort})` : "—"}</td>
                    <td style={td}>{nCrit > 0 ? <span style={{ background: "rgba(239,68,68,0.14)", color: "#DC2626", borderRadius: 999, padding: "2px 9px", fontWeight: 800, fontSize: "0.74rem" }}>{nCrit}</span> : <span style={{ color: theme.text3 }}>0</span>}</td>
                    <td style={{ ...td, color: theme.a1, fontWeight: 700, whiteSpace: "nowrap" }}>View →</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function LoginScreen({ theme, clay, onLogin, error, isMobile }) {
  const [password, setPassword] = useState("");
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 22, boxShadow: clay(theme.cardGlow), padding: isMobile ? "28px 22px" : "38px 40px", width: "100%", maxWidth: 400, textAlign: "center" }}>
        <img src={automationPathsBrandLogo} alt="Automation Paths" style={{ height: 30, width: "auto", objectFit: "contain", marginBottom: 22 }} />
        <div style={{ width: 50, height: 50, borderRadius: 14, background: theme.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", margin: "0 auto 16px", boxShadow: theme.btnGlow }}>🔒</div>
        <h1 style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: "1.4rem", marginBottom: 6 }}>Dashboard</h1>
        <p style={{ color: theme.text2, fontSize: "0.9rem", marginBottom: 22 }}>Enter the dashboard password to continue.</p>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(password); }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            autoFocus
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: `1.5px solid ${theme.cardBorder}`, background: theme.bg, color: theme.text, fontSize: "1rem", fontFamily: TYPOGRAPHY.body, outline: "none", marginBottom: 12 }}
          />
          {error && <div style={{ color: "#EF4444", fontSize: "0.84rem", fontWeight: 600, marginBottom: 12 }}>{error}</div>}
          <button type="submit" className="qd-btn" style={{ width: "100%", padding: "13px", background: theme.grad, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: TYPOGRAPHY.body, boxShadow: theme.btnGlow }}>
            Unlock dashboard
          </button>
        </form>
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
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: isMobile ? "0" : "40px 20px", overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: theme.bg, border: `1px solid ${theme.cardBorder}`, borderRadius: isMobile ? 0 : 22, width: "100%", maxWidth: 760, boxShadow: "0 30px 80px rgba(0,0,0,0.3)", minHeight: isMobile ? "100vh" : "auto" }}>
        <div style={{ position: "sticky", top: 0, background: theme.card, borderBottom: `1px solid ${theme.cardBorder}`, borderRadius: isMobile ? 0 : "22px 22px 0 0", padding: isMobile ? "16px 18px" : "20px 26px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, zIndex: 2 }}>
          <div>
            <div style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: "1.2rem" }}>{sub.name}</div>
            <div style={{ color: theme.text2, fontSize: "0.86rem" }}>{sub.email}</div>
            <div style={{ color: theme.text3, fontSize: "0.78rem", marginTop: 2 }}>{fmtDate(sub.created_at)}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: "1.8rem", color: scoreColor(sub.health_score), lineHeight: 1 }}>{sub.health_score}<span style={{ fontSize: "0.9rem", color: theme.text3 }}>/100</span></div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: LEVEL_COLOR[sub.result_level] || theme.text }}>{sub.result_level}</div>
            </div>
            <button onClick={onClose} style={{ background: theme.chipBg, border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: "1.1rem", color: theme.text2 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: isMobile ? "18px" : "24px 26px" }}>
          {(sub.critical_flags?.length || 0) > 0 && (
            <SectionBlock title="⚠️ Revenue-critical warnings" theme={theme}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {sub.critical_flags.map((f) => (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.86rem", color: theme.text }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444" }} />{f.label}
                  </div>
                ))}
              </div>
            </SectionBlock>
          )}

          <SectionBlock title="Category scores" theme={theme}>
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
          </SectionBlock>

          <SectionBlock title="Business profile" theme={theme}>
            {PROFILE_QUESTIONS.map((q) => (
              <QARow key={q.id} theme={theme} q={q.prompt} a={profileSelection(sub, q)} />
            ))}
          </SectionBlock>

          {CATEGORIES.map((cat) => {
            const cs = catById.get(cat.id);
            return (
              <SectionBlock key={cat.id} theme={theme} title={cat.name} right={cs ? <span style={{ fontSize: "0.72rem", fontWeight: 800, color: SEV_COLOR[cs.levelShort] || theme.text }}>{cs.score}/{cs.max} · {cs.levelShort}</span> : null}>
                {cat.questionIds.map((qid) => {
                  const q = DIAG_BY_ID.get(qid);
                  const sel = diagnosticSelection(sub, q);
                  return <QARow key={qid} theme={theme} q={`${qid}. ${q.prompt}`} a={sel.text} badge={sel.letter} points={sel.points} />;
                })}
              </SectionBlock>
            );
          })}

          <SectionBlock title="Attribution" theme={theme}>
            <QARow theme={theme} q="Page" a={sub.page_path || "—"} />
            <QARow theme={theme} q="Referrer" a={sub.referrer || "—"} />
            <QARow theme={theme} q="User agent" a={sub.user_agent || "—"} />
          </SectionBlock>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({ title, right, theme, children }) {
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
        <span title={`${points} risk point${points === 1 ? "" : "s"}`} style={{ flexShrink: 0, marginTop: 2, width: 22, height: 22, borderRadius: 7, background: `${pointColor}22`, color: pointColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.74rem", fontWeight: 800 }}>{points}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function exportCsv(rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const headers = [
    "Submitted At", "Name", "Email", "Health Score", "Result Level", "Total Risk", "Top Leaks", "Critical Flags",
    ...PROFILE_QUESTIONS.map((q) => q.key),
    ...DIAGNOSTIC_QUESTIONS.map((q) => `Q${q.id}`),
  ];
  const lines = rows.map((r) => {
    const base = [
      r.created_at, r.name, r.email, r.health_score, r.result_level, r.total_risk_points,
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
}

const th = { padding: "12px 14px", fontWeight: 700 };
const td = { padding: "12px 14px" };
function btnGhost(theme) {
  return { padding: "9px 16px", background: theme.card, color: theme.text2, border: `1px solid ${theme.cardBorder}`, borderRadius: 999, fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", fontFamily: TYPOGRAPHY.body };
}

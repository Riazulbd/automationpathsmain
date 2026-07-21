import React, { useEffect, useState } from "react";
import { TYPOGRAPHY } from "../../quiz/theme.js";
import { apiGet } from "./adminApi.js";

const REGION = typeof Intl !== "undefined" && Intl.DisplayNames
  ? new Intl.DisplayNames(["en"], { type: "region" })
  : null;
function countryName(code) {
  if (!code) return "Unknown";
  try {
    return REGION ? REGION.of(code) || code : code;
  } catch {
    return code;
  }
}

function Metric({ theme, label, value, sub, color }) {
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 16, padding: "16px 18px" }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: theme.text3, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: "1.8rem", color: color || theme.text, lineHeight: 1 }}>{value}</div>
      {sub ? <div style={{ fontSize: "0.72rem", color: theme.text3, marginTop: 5 }}>{sub}</div> : null}
    </div>
  );
}

function Card({ theme, title, children }) {
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 18, padding: "20px 22px", marginBottom: 16 }}>
      <div style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 700, fontSize: "1rem", marginBottom: 16 }}>{title}</div>
      {children}
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
            <span style={{ fontSize: "0.84rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{r.label}</span>
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

export default function BlogAnalytics({ token, theme, isMobile, onExpired }) {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    apiGet(token, `/analytics?days=${days}`)
      .then((d) => alive && setData(d))
      .catch((e) => {
        if (!alive) return;
        if (e.expired) onExpired?.();
        else setError(e.message);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [token, days, onExpired]);

  const max = Math.max(1, ...((data?.trend || []).map((d) => d.views)));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <div style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: "1.15rem" }}>Blog performance</div>
        <div style={{ display: "inline-flex", gap: 4, padding: 4, background: theme.chipBg, borderRadius: 999 }}>
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} style={{
              padding: "6px 14px", borderRadius: 999, border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem",
              background: days === d ? theme.grad : "transparent", color: days === d ? "#fff" : theme.text2,
            }}>{d}d</button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#DC2626", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: "0.86rem", fontWeight: 600 }}>
          {error}
        </div>
      )}

      {loading && !data ? (
        <div style={{ padding: 50, textAlign: "center", color: theme.text3 }}>Loading analytics…</div>
      ) : data ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
            <Metric theme={theme} label="Views" value={data.period_views.toLocaleString()} sub={`last ${days} days`} />
            <Metric theme={theme} label="Unique visitors" value={data.unique_visitors.toLocaleString()} sub={`last ${days} days`} color={theme.a1} />
            <Metric theme={theme} label="All-time views" value={data.all_time_views.toLocaleString()} />
            <Metric theme={theme} label="Published posts" value={data.published_posts} sub={`${data.total_posts} total`} color="#10B981" />
          </div>

          <Card theme={theme} title={`Views — last ${days} days`}>
            {data.trend.length ? (
              <div style={{ display: "flex", alignItems: "flex-end", gap: isMobile ? 2 : 4, height: 130 }}>
                {data.trend.slice(-Math.min(days, 60)).map((d) => (
                  <div key={d.day} title={`${d.day}: ${d.views} views`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", height: "100%" }}>
                    <div style={{ width: "100%", maxWidth: 24, height: Math.max(3, (d.views / max) * 120), borderRadius: "5px 5px 0 0", background: theme.grad }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: theme.text3, fontSize: "0.86rem" }}>No views recorded in this period yet.</div>
            )}
          </Card>

          <Card theme={theme} title="Posts by views">
            {data.per_post.length ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", minWidth: 480 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: theme.text3, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      <th style={th}>Post</th>
                      <th style={th}>Status</th>
                      <th style={{ ...th, textAlign: "right" }}>Views ({days}d)</th>
                      <th style={{ ...th, textAlign: "right" }}>Visitors</th>
                      <th style={{ ...th, textAlign: "right" }}>All-time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.per_post.map((p) => (
                      <tr key={p.id} style={{ borderTop: `1px solid ${theme.cardBorder}` }}>
                        <td style={{ ...td, fontWeight: 600 }}>
                          {p.status === "published" ? (
                            <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" style={{ color: theme.text, textDecoration: "none" }}>{p.title}</a>
                          ) : p.title}
                        </td>
                        <td style={{ ...td, color: theme.text3, fontSize: "0.8rem", textTransform: "capitalize" }}>{p.status}</td>
                        <td style={{ ...td, textAlign: "right", fontWeight: 800, color: theme.a1 }}>{p.period_views.toLocaleString()}</td>
                        <td style={{ ...td, textAlign: "right", color: theme.text2 }}>{p.period_visitors.toLocaleString()}</td>
                        <td style={{ ...td, textAlign: "right", color: theme.text2 }}>{p.total_views.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: theme.text3, fontSize: "0.86rem" }}>No posts yet.</div>
            )}
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <Card theme={theme} title="Top referrers">
              <RankList theme={theme} rows={data.top_referrers.map((r) => ({ label: r.label, value: r.count }))} empty="No referrer data yet." unit="views" />
            </Card>
            <Card theme={theme} title="Visitors by country">
              <RankList theme={theme} rows={data.countries.map((c) => ({ label: countryName(c.code), value: c.count }))} empty="No location data yet. (Depends on your host providing geo headers.)" unit="views" />
            </Card>
          </div>
          {data.sampled && (
            <div style={{ color: theme.text3, fontSize: "0.76rem", marginTop: 4 }}>
              Showing a sample of the most recent 20,000 views.
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

const th = { padding: "10px 12px", fontWeight: 700 };
const td = { padding: "10px 12px" };

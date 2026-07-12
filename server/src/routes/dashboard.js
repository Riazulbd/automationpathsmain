import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../utils/auth.js";

// Private dashboard API (submissions + website analytics).
//
// Reads require the service_role key, which lives ONLY on the server. Every read
// is gated behind a password → short-lived JWT, so no data is reachable without
// the dashboard password.

const router = express.Router();
const SUBMISSIONS = "funnel_quiz_submissions";
const EVENTS = "site_events";
const SCOPE = "quiz-dashboard";
const MAX_EVENTS = 20000; // cap for detailed aggregation

function supabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

function serviceHeaders(key) {
  return { apikey: key, Authorization: `Bearer ${key}` };
}

function timingSafeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) {
    crypto.timingSafeEqual(ab, ab);
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

function dashSecret(req) {
  return req.app.locals.jwtSecret || getJwtSecret(req.app.locals.db);
}

function requireDashAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token =
    req.cookies?.quiz_dash_token ||
    (authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null);

  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(token, dashSecret(req));
    if (payload.scope !== SCOPE) throw new Error("Wrong token scope");
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

// POST /api/dashboard/login  { password } -> { token }
router.post("/login", (req, res) => {
  const expected = process.env.QUIZ_DASHBOARD_PASSWORD;
  if (!expected) return res.status(503).json({ error: "Dashboard is not configured on the server." });
  const password = req.body?.password || "";
  if (!timingSafeEqual(password, expected)) {
    return res.status(401).json({ error: "Incorrect password." });
  }
  const token = jwt.sign({ scope: SCOPE }, dashSecret(req), { expiresIn: "12h" });
  res.cookie("quiz_dash_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 12 * 60 * 60 * 1000,
  });
  return res.json({ token });
});

// POST /api/dashboard/logout
router.post("/logout", (_req, res) => {
  res.clearCookie("quiz_dash_token");
  return res.json({ success: true });
});

// GET /api/dashboard/submissions
router.get("/submissions", requireDashAuth, async (req, res) => {
  const { url, serviceKey } = supabaseConfig();
  if (!url || !serviceKey) return res.status(503).json({ error: "Supabase is not configured on the server." });
  const limit = Math.min(Number(req.query.limit) || 2000, 5000);
  try {
    const endpoint = `${url}/rest/v1/${SUBMISSIONS}?select=*&order=created_at.desc&limit=${limit}`;
    const response = await fetch(endpoint, { headers: serviceHeaders(serviceKey) });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return res.status(502).json({ error: `Supabase read failed (${response.status})`, detail });
    }
    const submissions = await response.json();
    return res.json({ submissions, count: submissions.length });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to load submissions" });
  }
});

// GET /api/dashboard/analytics?days=30
router.get("/analytics", requireDashAuth, async (req, res) => {
  const { url, serviceKey } = supabaseConfig();
  if (!url || !serviceKey) return res.status(503).json({ error: "Supabase is not configured on the server." });

  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const sinceQ = encodeURIComponent(since);
  const H = serviceHeaders(serviceKey);

  const exactCount = async (type) => {
    const r = await fetch(
      `${url}/rest/v1/${EVENTS}?select=id&type=eq.${type}&created_at=gte.${sinceQ}`,
      { headers: { ...H, Prefer: "count=exact", Range: "0-0" } }
    );
    if (!r.ok) throw new Error(`${r.status} ${await r.text().catch(() => "")}`);
    const cr = r.headers.get("content-range") || "*/0";
    return Number(cr.split("/")[1]) || 0;
  };

  try {
    const [totalPageviews, totalClicks] = await Promise.all([exactCount("pageview"), exactCount("click")]);

    const evRes = await fetch(
      `${url}/rest/v1/${EVENTS}?select=type,path,visitor_id,label,href,created_at&created_at=gte.${sinceQ}&order=created_at.desc&limit=${MAX_EVENTS}`,
      { headers: H }
    );
    const events = evRes.ok ? await evRes.json() : [];

    const uniq = new Set();
    const byDay = new Map();
    const pages = new Map();
    const clicks = new Map();

    for (const e of events) {
      const day = (e.created_at || "").slice(0, 10);
      if (!byDay.has(day)) byDay.set(day, { day, pageviews: 0, visitors: new Set(), clicks: 0 });
      const bucket = byDay.get(day);
      if (e.type === "pageview") {
        bucket.pageviews += 1;
        if (e.visitor_id) {
          uniq.add(e.visitor_id);
          bucket.visitors.add(e.visitor_id);
        }
        const p = e.path || "(unknown)";
        pages.set(p, (pages.get(p) || 0) + 1);
      } else if (e.type === "click") {
        bucket.clicks += 1;
        const k = e.label || e.href || "(unlabeled)";
        clicks.set(k, (clicks.get(k) || 0) + 1);
      }
    }

    const by_day = [...byDay.values()]
      .map((d) => ({ day: d.day, pageviews: d.pageviews, visitors: d.visitors.size, clicks: d.clicks }))
      .sort((a, b) => a.day.localeCompare(b.day));
    const top_pages = [...pages.entries()]
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
    const top_clicks = [...clicks.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return res.json({
      range_days: days,
      total_pageviews: totalPageviews,
      total_clicks: totalClicks,
      unique_visitors: uniq.size,
      sampled: events.length >= MAX_EVENTS,
      by_day,
      top_pages,
      top_clicks,
    });
  } catch (error) {
    const msg = String(error.message || error);
    if (msg.includes("PGRST205") || msg.includes("site_events")) {
      return res.status(502).json({
        error: "The site_events table is missing. Run supabase/analytics.sql in Supabase.",
        detail: msg,
      });
    }
    return res.status(500).json({ error: msg });
  }
});

export default router;

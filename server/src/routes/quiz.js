import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../utils/auth.js";

// Funnel Health quiz — submissions dashboard API.
//
// The public quiz writes to Supabase with the anon key (insert-only RLS). Reading
// submissions requires the service_role key, which lives ONLY on the server. Every
// read here is gated behind a password → short-lived JWT, so no submission data is
// reachable without the dashboard password.

const router = express.Router();
const TABLE = "funnel_quiz_submissions";
const SCOPE = "quiz-dashboard";

function supabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

function timingSafeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) {
    // Compare against self to keep timing roughly constant, then fail.
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

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const payload = jwt.verify(token, dashSecret(req));
    if (payload.scope !== SCOPE) {
      throw new Error("Wrong token scope");
    }
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

// POST /api/quiz/dashboard/login  { password } -> { token }
router.post("/dashboard/login", (req, res) => {
  const expected = process.env.QUIZ_DASHBOARD_PASSWORD;
  if (!expected) {
    return res.status(503).json({ error: "Dashboard is not configured on the server." });
  }
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

// POST /api/quiz/dashboard/logout
router.post("/dashboard/logout", (_req, res) => {
  res.clearCookie("quiz_dash_token");
  return res.json({ success: true });
});

// GET /api/quiz/dashboard/submissions  (auth required)
router.get("/dashboard/submissions", requireDashAuth, async (req, res) => {
  const { url, serviceKey } = supabaseConfig();
  if (!url || !serviceKey) {
    return res.status(503).json({ error: "Supabase is not configured on the server." });
  }
  const limit = Math.min(Number(req.query.limit) || 2000, 5000);
  try {
    const endpoint = `${url}/rest/v1/${TABLE}?select=*&order=created_at.desc&limit=${limit}`;
    const response = await fetch(endpoint, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
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

export default router;

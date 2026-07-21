import jwt from "jsonwebtoken";
import { getJwtSecret } from "../utils/auth.js";

// Shared auth for every private dashboard endpoint (quiz submissions, website
// analytics, and the blog CMS). A single dashboard password → short-lived JWT
// scoped to "quiz-dashboard" gates all of it.

export const DASH_SCOPE = "quiz-dashboard";

export function dashSecret(req) {
  return req.app.locals.jwtSecret || getJwtSecret(req.app.locals.db);
}

export function requireDashAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token =
    req.cookies?.quiz_dash_token ||
    (authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null);

  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(token, dashSecret(req));
    if (payload.scope !== DASH_SCOPE) throw new Error("Wrong token scope");
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

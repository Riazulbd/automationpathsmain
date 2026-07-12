// First-party website analytics — pageviews + clicks.
//
// Events are inserted straight into Supabase with the public anon key (insert-only
// RLS), exactly like quiz submissions. The dashboard reads/aggregates them
// server-side with the service_role key.

const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ENDPOINT = URL && ANON ? `${URL}/rest/v1/site_events` : null;

// Don't track the private dashboard.
const IGNORED = (path) => !path || path.startsWith("/dashboard") || path.startsWith("/funnel-quiz/admin");

function uuid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function persistentId(store, key) {
  try {
    let id = store.getItem(key);
    if (!id) {
      id = uuid();
      store.setItem(key, id);
    }
    return id;
  } catch {
    return uuid();
  }
}

function visitorId() {
  return persistentId(window.localStorage, "ap_visitor_id");
}
function sessionId() {
  return persistentId(window.sessionStorage, "ap_session_id");
}

function send(event) {
  if (!ENDPOINT || typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      ...event,
      visitor_id: visitorId(),
      session_id: sessionId(),
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    });
    // keepalive lets the request survive a page unload (unlike a normal fetch).
    fetch(ENDPOINT, {
      method: "POST",
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${ANON}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analytics must never break the page */
  }
}

export function trackPageview(path) {
  const p = path || window.location.pathname;
  if (IGNORED(p)) return;
  send({ type: "pageview", path: p });
}

let clickBound = false;
export function initClickTracking() {
  if (clickBound || typeof document === "undefined") return;
  clickBound = true;
  document.addEventListener(
    "click",
    (e) => {
      const el = e.target && e.target.closest ? e.target.closest("a, button, [data-track]") : null;
      if (!el) return;
      const path = window.location.pathname;
      if (IGNORED(path)) return;
      const label = (
        el.getAttribute("data-track") ||
        el.getAttribute("aria-label") ||
        (el.textContent || "").trim()
      ).slice(0, 120);
      const href = el.tagName === "A" ? el.getAttribute("href") : null;
      send({ type: "click", path, label: label || null, href });
    },
    { capture: true, passive: true }
  );
}

// Public blog data access (no auth). Talks to the Express server, which reads
// published posts from Supabase with the service_role key.

const API = "/api/blog";

async function getJson(path) {
  const res = await fetch(`${API}${path}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export function listPosts({ limit = 24, offset = 0, category, tag } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (category) params.set("category", category);
  if (tag) params.set("tag", tag);
  return getJson(`/posts?${params.toString()}`);
}

export function getPost(slug) {
  return getJson(`/posts/${encodeURIComponent(slug)}`);
}

export function listCategories() {
  return getJson(`/categories`);
}

export function listTags() {
  return getJson(`/tags`);
}

// Reuse the same persistent visitor id the site analytics uses, so blog view
// counts line up with overall unique-visitor tracking.
function visitorId() {
  try {
    let id = window.localStorage.getItem("ap_visitor_id");
    if (!id) {
      id =
        (window.crypto && window.crypto.randomUUID && window.crypto.randomUUID()) ||
        `v-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
      window.localStorage.setItem("ap_visitor_id", id);
    }
    return id;
  } catch {
    return null;
  }
}

// Fire-and-forget view tracking. Never throws.
export function trackView(slug) {
  try {
    fetch(`${API}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        slug,
        visitor_id: visitorId(),
        referrer: document.referrer || null,
      }),
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

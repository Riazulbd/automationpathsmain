// Authenticated admin blog API. Reuses the dashboard JWT (Bearer token) that the
// dashboard already holds after the password login.

const BASE = "/api/dashboard/blog";

async function handle(res) {
  if (res.status === 401) {
    const err = new Error("__expired__");
    err.expired = true;
    throw err;
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

function authHeaders(token, extra = {}) {
  return { Authorization: `Bearer ${token}`, ...extra };
}

export function apiGet(token, path) {
  return fetch(`${BASE}${path}`, { headers: authHeaders(token) }).then(handle);
}

export function apiPost(token, path, data) {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  }).then(handle);
}

export function apiPatch(token, path, data) {
  return fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  }).then(handle);
}

export function apiDelete(token, path) {
  return fetch(`${BASE}${path}`, {
    method: "DELETE",
    headers: authHeaders(token),
  }).then(handle);
}

// Upload an image file → returns { url, width, height }.
export function apiUpload(token, file) {
  const form = new FormData();
  form.append("image", file);
  return fetch(`${BASE}/upload`, {
    method: "POST",
    headers: authHeaders(token), // do NOT set Content-Type; browser sets the multipart boundary
    body: form,
  }).then(handle);
}

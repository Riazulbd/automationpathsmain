// Server-side Supabase access using the service_role key.
//
// We talk to PostgREST / Storage over plain fetch (no SDK) to stay consistent
// with the rest of the codebase and keep the dependency surface small. The
// service_role key bypasses RLS, so this module must ONLY ever be imported by
// server code — never bundled into the frontend.

function config() {
  return {
    url: (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, ""),
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

export function isSupabaseConfigured() {
  const { url, serviceKey } = config();
  return Boolean(url && serviceKey);
}

function headers(extra = {}) {
  const { serviceKey } = config();
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    ...extra,
  };
}

class SupabaseError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = "SupabaseError";
    this.status = status || 500;
    this.detail = detail;
  }
}

export { SupabaseError };

function assertConfigured() {
  if (!isSupabaseConfigured()) {
    throw new SupabaseError("Supabase is not configured on the server.", 503);
  }
}

// -----------------------------------------------------------------------------
// PostgREST helpers
// -----------------------------------------------------------------------------

// GET /rest/v1/<table>?<query>. Returns parsed JSON (array) plus the total count
// when Prefer: count=exact is requested.
export async function sbSelect(table, query = "", { count = false } = {}) {
  assertConfigured();
  const { url } = config();
  const endpoint = `${url}/rest/v1/${table}${query ? `?${query}` : ""}`;
  const h = headers(count ? { Prefer: "count=exact" } : {});
  const res = await fetch(endpoint, { headers: h });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new SupabaseError(`Supabase read failed (${res.status})`, 502, detail);
  }
  const rows = await res.json();
  let total = null;
  if (count) {
    const cr = res.headers.get("content-range") || "*/0";
    total = Number(cr.split("/")[1]) || 0;
  }
  return { rows, total };
}

export async function sbSelectOne(table, query = "") {
  const { rows } = await sbSelect(table, query);
  return rows[0] || null;
}

export async function sbInsert(table, row, { returning = "representation" } = {}) {
  assertConfigured();
  const { url } = config();
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: headers({
      "Content-Type": "application/json",
      Prefer: `return=${returning}`,
    }),
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new SupabaseError(`Supabase insert failed (${res.status})`, res.status, detail);
  }
  if (returning === "minimal") return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] : rows;
}

// Upsert on a unique column (e.g. slug). Returns the resulting row.
export async function sbUpsert(table, row, onConflict) {
  assertConfigured();
  const { url } = config();
  const q = onConflict ? `?on_conflict=${onConflict}` : "";
  const res = await fetch(`${url}/rest/v1/${table}${q}`, {
    method: "POST",
    headers: headers({
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    }),
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new SupabaseError(`Supabase upsert failed (${res.status})`, res.status, detail);
  }
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function sbUpdate(table, query, patch, { returning = "representation" } = {}) {
  assertConfigured();
  const { url } = config();
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: headers({
      "Content-Type": "application/json",
      Prefer: `return=${returning}`,
    }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new SupabaseError(`Supabase update failed (${res.status})`, res.status, detail);
  }
  if (returning === "minimal") return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function sbDelete(table, query) {
  assertConfigured();
  const { url } = config();
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: headers({ Prefer: "return=minimal" }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new SupabaseError(`Supabase delete failed (${res.status})`, res.status, detail);
  }
  return true;
}

// Call a Postgres function via PostgREST RPC.
export async function sbRpc(fn, body = {}) {
  assertConfigured();
  const { url } = config();
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new SupabaseError(`Supabase rpc failed (${res.status})`, res.status, detail);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// -----------------------------------------------------------------------------
// Storage
// -----------------------------------------------------------------------------

// Upload a Buffer to a Storage bucket and return the public URL.
export async function sbUploadImage(bucket, objectPath, buffer, contentType) {
  assertConfigured();
  const { url } = config();
  const clean = objectPath.replace(/^\/+/, "");
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${clean}`, {
    method: "POST",
    headers: headers({
      "Content-Type": contentType,
      "x-upsert": "true",
      "Cache-Control": "public, max-age=31536000, immutable",
    }),
    body: buffer,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new SupabaseError(`Storage upload failed (${res.status})`, res.status, detail);
  }
  return `${url}/storage/v1/object/public/${bucket}/${clean}`;
}

// Supabase persistence for the Funnel Health quiz.
//
// We only ever do a single insert, so instead of pulling in the full
// @supabase/supabase-js SDK we POST directly to the PostgREST endpoint. This
// keeps the lazy-loaded quiz bundle small.
//
// The frontend uses ONLY the public anon key (safe to ship — inserts are guarded
// by a Row-Level Security "insert-only" policy; see supabase/schema.sql).
// The service_role key must never appear in frontend code.
//
// Config comes from Vite env vars (see .env / .env.example):
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY

const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(URL && ANON_KEY);
export const SUBMISSIONS_TABLE = "funnel_quiz_submissions";

// Best-effort insert. Never throws — returns { saved, error } so the results
// screen can render even when persistence is unavailable.
export async function saveQuizSubmission(row) {
  if (!isSupabaseConfigured) {
    return { saved: false, error: new Error("Supabase not configured") };
  }
  try {
    const res = await fetch(`${URL}/rest/v1/${SUBMISSIONS_TABLE}`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { saved: false, error: new Error(`Supabase ${res.status}: ${detail}`) };
    }
    return { saved: true, error: null };
  } catch (error) {
    return { saved: false, error };
  }
}

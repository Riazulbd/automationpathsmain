// Feature switches, set at build time. The blog is off until Supabase is
// configured — set VITE_BLOG_ENABLED=true (and BLOG_ENABLED=true for the server)
// to turn it back on.
export const BLOG_ENABLED = import.meta.env.VITE_BLOG_ENABLED === "true";

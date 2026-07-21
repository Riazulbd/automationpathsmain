import cron from "node-cron";
import { isSupabaseConfigured, sbSelect, sbUpdate } from "../config/supabase.js";

// Promote scheduled posts whose time has arrived. Runs every minute.
async function promoteDueScheduledPosts() {
  if (!isSupabaseConfigured()) return;
  const nowIso = new Date().toISOString();
  try {
    const { rows } = await sbSelect(
      "blog_posts",
      `status=eq.scheduled&scheduled_at=lte.${encodeURIComponent(nowIso)}&select=id&limit=100`
    );
    if (!rows.length) return;
    await sbUpdate(
      "blog_posts",
      `status=eq.scheduled&scheduled_at=lte.${encodeURIComponent(nowIso)}`,
      { status: "published" },
      { returning: "minimal" }
    );
    console.log(`[cron] Published ${rows.length} scheduled post(s)`);
  } catch (error) {
    console.error("[cron] scheduled-post promotion failed:", error.message);
  }
}

export function startScheduler(_db) {
  if (!isSupabaseConfigured()) {
    return;
  }
  // Every minute.
  cron.schedule("* * * * *", promoteDueScheduledPosts);
  // Run once shortly after boot too.
  setTimeout(() => {
    promoteDueScheduledPosts();
  }, 5000);
}

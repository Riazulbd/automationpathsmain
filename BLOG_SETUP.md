# Blog / CMS — setup & how it works

A full blog engine wired into your existing dashboard. Posts, images, and view
analytics live in **Supabase**; the block editor and analytics live inside
`/dashboard`; public pages are built for Google (schema, sitemap, SSR).

## One-time setup

### 1. Run the database migration
Open the **Supabase SQL editor** and run [`supabase/blog.sql`](supabase/blog.sql).
This creates the `blog_posts`, `blog_categories`, `blog_tags`, `blog_post_tags`,
and `blog_post_views` tables, the row-level-security policies, a couple of helper
functions, and a **public `blog-images` Storage bucket** for uploads.

### 2. Environment variables
The blog reuses the same Supabase keys the dashboard already uses. Add these to
your `.env` (see [`.env.example`](.env.example)):

| Var | Required | Purpose |
|-----|----------|---------|
| `SUPABASE_URL` | ✅ (already set) | Server reads/writes posts |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (already set) | Server-side writes + image upload |
| `QUIZ_DASHBOARD_PASSWORD` | ✅ (already set) | Gates the whole dashboard, incl. blog |
| `SITE_URL` | recommended | Canonical URLs, sitemap, RSS, OG tags (defaults to `https://automationpaths.com`) |
| `OPENROUTER_API_KEY` | optional | Enables the AI writing assistant |

### 3. Redeploy
`nginx.conf` now routes `/blog`, `/sitemap.xml`, `/feed.xml`, and `/robots.txt`
through the Node server (for server-side SEO). The server also gained the
`sanitize-html` dependency (auto-installed by `npm ci` in the Docker build).

### 4. Tell Google
In **Google Search Console**, submit `https://automationpaths.com/sitemap.xml`.
New posts are added to the sitemap automatically the moment you publish, so
Google re-discovers and indexes them on its own.

## Writing posts
Go to **`/dashboard` → Blog tab**:
- **New post** opens the block editor (headings, images, lists, quotes, code,
  tables, YouTube embeds). Images you drop in are optimized to WebP and stored in
  Supabase Storage.
- **Draft / Publish / Schedule** — scheduled posts auto-publish at their set time.
- **AI buttons** (if `OPENROUTER_API_KEY` is set): *Draft with AI*, *Improve
  content*, *Generate SEO* (meta title/description/keywords).
- **SEO panel** — every post ships `BlogPosting` + `BreadcrumbList` JSON-LD
  schema, canonical URL, and OpenGraph/Twitter tags automatically. You can
  override any of them per post.

## Analytics
**Blog tab → Analytics**: views, unique visitors, per-post breakdown, view trend,
top referrers, and visitors by country. (Country/city require your host/CDN to
send geo headers such as `cf-ipcountry` or `x-vercel-ip-country`; without them,
everything else still works.)

## How it fits together
- **Public reads** and **all writes** go through the Express server, which uses
  the Supabase service-role key — the same proven pattern as the quiz dashboard.
- **`/blog/:slug` is server-rendered for SEO**: the Node server injects the
  post's `<title>`, meta, OpenGraph, JSON-LD, and article text into the HTML
  before sending it, so crawlers and social scrapers see real content. React then
  takes over for humans.
- **Images** are stored in Supabase Storage (permanent CDN URLs) rather than on
  disk, because the container's filesystem is wiped on every redeploy.

-- Blog / CMS — posts, categories, tags, and per-post view tracking.
-- Run this ONCE in the Supabase SQL editor (in addition to schema.sql + analytics.sql).
--
-- Security model (mirrors the rest of this project):
--   * The public site reads PUBLISHED posts only. Reads happen through the
--     Express server using the service_role key, but we also grant anon SELECT on
--     published rows so the data model stays flexible/safe.
--   * All writes (create / edit / delete / image upload) go through the Express
--     server using the service_role key, gated behind the dashboard password.
--     Anon has NO write access to posts.
--   * Per-post views are inserted server-side (so we can attach geo from the
--     request), but anon INSERT is also allowed as a fallback (insert-only, like
--     site_events).

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table if not exists public.blog_categories (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  slug        text unique not null,
  description text
);

-- ---------------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------------
create table if not exists public.blog_tags (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  slug        text unique not null
);

-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------
create table if not exists public.blog_posts (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Core content
  title               text not null,
  slug                text unique not null,
  excerpt             text,
  content             text not null default '',   -- sanitized HTML from the editor
  content_text        text,                        -- plaintext (word count / reading time / snippets)

  featured_image      text,                        -- Supabase Storage public URL
  featured_image_alt  text,

  category_id         uuid references public.blog_categories(id) on delete set null,

  -- Publishing
  status              text not null default 'draft' check (status in ('draft','published','scheduled')),
  published_at        timestamptz,
  scheduled_at        timestamptz,

  reading_time        integer not null default 0,  -- minutes
  word_count          integer not null default 0,
  view_count          integer not null default 0,  -- denormalized running total

  author_name         text not null default 'Riazul Islam',
  author_title        text,          -- job title / role (E-E-A-T)
  author_bio          text,
  author_credentials  text,
  author_avatar       text,
  author_url          text,          -- personal / company site
  author_linkedin     text,
  author_twitter      text,

  -- SEO / structured data
  meta_title          text,
  meta_description    text,
  focus_keyword       text,
  keywords            text,                        -- comma separated
  canonical_url       text,
  og_title            text,
  og_description      text,
  og_image            text,
  schema_type         text not null default 'BlogPosting'
                        check (schema_type in ('BlogPosting','Article','NewsArticle','TechArticle')),
  noindex             boolean not null default false
);

-- ---------------------------------------------------------------------------
-- Post <-> Tag join
-- ---------------------------------------------------------------------------
create table if not exists public.blog_post_tags (
  post_id uuid references public.blog_posts(id) on delete cascade,
  tag_id  uuid references public.blog_tags(id)  on delete cascade,
  primary key (post_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- Per-post views (powers dashboard analytics: views, unique visitors, geo)
-- ---------------------------------------------------------------------------
create table if not exists public.blog_post_views (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  post_id     uuid references public.blog_posts(id) on delete cascade,
  slug        text,
  visitor_id  text,
  referrer    text,
  country     text,
  city        text
);

-- ---------------------------------------------------------------------------
-- Author E-E-A-T columns (safe to re-run on an existing install)
-- ---------------------------------------------------------------------------
alter table public.blog_posts add column if not exists author_title       text;
alter table public.blog_posts add column if not exists author_bio         text;
alter table public.blog_posts add column if not exists author_credentials text;
alter table public.blog_posts add column if not exists author_url         text;
alter table public.blog_posts add column if not exists author_linkedin    text;
alter table public.blog_posts add column if not exists author_twitter     text;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists blog_posts_status_idx      on public.blog_posts (status, published_at desc);
create index if not exists blog_posts_slug_idx        on public.blog_posts (slug);
create index if not exists blog_posts_category_idx    on public.blog_posts (category_id);
create index if not exists blog_post_views_post_idx   on public.blog_post_views (post_id, created_at desc);
create index if not exists blog_post_views_slug_idx   on public.blog_post_views (slug);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_blog_posts_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blog_posts_updated_at on public.blog_posts;
create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.set_blog_posts_updated_at();

-- ---------------------------------------------------------------------------
-- Atomic view-count increment (called server-side via /rpc/increment_blog_view)
-- ---------------------------------------------------------------------------
create or replace function public.increment_blog_view(p_post_id uuid)
returns void language sql as $$
  update public.blog_posts set view_count = view_count + 1 where id = p_post_id;
$$;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.blog_posts enable row level security;
drop policy if exists "anon reads published posts" on public.blog_posts;
create policy "anon reads published posts" on public.blog_posts
  for select to anon using (status = 'published');

alter table public.blog_categories enable row level security;
drop policy if exists "anon reads categories" on public.blog_categories;
create policy "anon reads categories" on public.blog_categories
  for select to anon using (true);

alter table public.blog_tags enable row level security;
drop policy if exists "anon reads tags" on public.blog_tags;
create policy "anon reads tags" on public.blog_tags
  for select to anon using (true);

alter table public.blog_post_tags enable row level security;
drop policy if exists "anon reads post_tags" on public.blog_post_tags;
create policy "anon reads post_tags" on public.blog_post_tags
  for select to anon using (true);

alter table public.blog_post_views enable row level security;
drop policy if exists "anon inserts post views" on public.blog_post_views;
create policy "anon inserts post views" on public.blog_post_views
  for insert to anon with check (true);

-- ---------------------------------------------------------------------------
-- Storage bucket for blog images (public read; writes are service_role only)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do update set public = true;

-- Public read for the bucket (writes go through the server with service_role).
drop policy if exists "public read blog images" on storage.objects;
create policy "public read blog images" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'blog-images');

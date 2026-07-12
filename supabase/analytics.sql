-- Website analytics — lightweight first-party event tracking.
-- Run this in the Supabase SQL editor once (in addition to schema.sql).
--
-- Security model (same as submissions): the browser inserts events with the PUBLIC
-- anon key. RLS is enabled and only INSERT is granted to anon (no read). The
-- dashboard reads/aggregates server-side with the service_role key.

create table if not exists public.site_events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  type        text not null check (type in ('pageview', 'click')),
  path        text,
  visitor_id  text,   -- persistent per-browser id (localStorage) → unique visitors
  session_id  text,   -- per-tab id (sessionStorage)
  label       text,   -- for clicks: element text / data-track label
  href        text,   -- for clicks: link target
  referrer    text,
  user_agent  text
);

create index if not exists site_events_created_at_idx on public.site_events (created_at desc);
create index if not exists site_events_type_idx       on public.site_events (type);
create index if not exists site_events_visitor_idx    on public.site_events (visitor_id);

-- Row-Level Security: anon may INSERT only.
alter table public.site_events enable row level security;

drop policy if exists "anon can insert events" on public.site_events;
create policy "anon can insert events"
  on public.site_events
  for insert
  to anon
  with check (true);

-- Funnel Health Diagnostic — submissions table.
-- Run this in the Supabase SQL editor (or via the CLI) once.
--
-- Security model: the browser inserts with the PUBLIC anon key. RLS is enabled
-- and only INSERT is granted to anon (no SELECT/UPDATE/DELETE), so visitors can
-- submit but cannot read other people's submissions. Read the data using the
-- service_role key (server side) or the Supabase dashboard.

create table if not exists public.funnel_quiz_submissions (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),

  -- Lead capture
  name                  text not null,
  email                 text not null,

  -- Part 1 — business profile (unscored). Keys are the profile question `key`s.
  profile               jsonb not null default '{}'::jsonb,

  -- Part 2 — raw diagnostic answers: { "7": <optionIndex>, ... }
  answers               jsonb not null default '{}'::jsonb,

  -- Computed results
  total_risk_points     integer not null,
  max_applicable_points integer not null,
  health_score          integer not null,
  result_level          text not null,
  category_scores       jsonb not null default '[]'::jsonb,
  top_leaks             jsonb not null default '[]'::jsonb,
  critical_flags        jsonb not null default '[]'::jsonb,

  -- Lightweight attribution / debugging context
  page_path             text,
  referrer              text,
  user_agent            text
);

create index if not exists funnel_quiz_submissions_created_at_idx
  on public.funnel_quiz_submissions (created_at desc);

create index if not exists funnel_quiz_submissions_email_idx
  on public.funnel_quiz_submissions (email);

-- Row-Level Security: anon may INSERT only.
alter table public.funnel_quiz_submissions enable row level security;

drop policy if exists "anon can insert submissions" on public.funnel_quiz_submissions;
create policy "anon can insert submissions"
  on public.funnel_quiz_submissions
  for insert
  to anon
  with check (true);

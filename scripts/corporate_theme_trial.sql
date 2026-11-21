-- Corporate theme color + 7-day HR trial fields.
-- Run once in the Supabase SQL editor.
alter table public.corporates
  add column if not exists theme_color text default null,
  add column if not exists trial_started_at timestamptz default null,
  add column if not exists trial_ends_at timestamptz default null,
  add column if not exists trial_token text default null;

-- Index for quick trial-expiry lookups
create index if not exists corporates_trial_ends_idx
  on public.corporates (trial_ends_at)
  where trial_ends_at is not null;

-- Index for trial token lookups
create index if not exists corporates_trial_token_idx
  on public.corporates (trial_token)
  where trial_token is not null;

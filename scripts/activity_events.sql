-- WellSpend product analytics — run once in the Supabase SQL editor.
-- Stores app-usage events for the /admin/analytics page.

create table if not exists public.activity_events (
  id          bigint generated always as identity primary key,
  event       text        not null,
  path        text,
  visitor_id  text,
  user_id     text,
  user_email  text,
  meta        jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists activity_events_created_idx
  on public.activity_events (created_at desc);

create index if not exists activity_events_event_idx
  on public.activity_events (event);

alter table public.activity_events enable row level security;

-- Inserts go through the service-role /api/track endpoint, and reads through
-- /api/admin/analytics (also service role) — so no client-side RLS grants are
-- needed at all. Deny direct anon/authenticated access explicitly.
create policy "no direct access" on public.activity_events
  for all using (false) with check (false);

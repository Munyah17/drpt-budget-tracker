-- WellSpend bill reminders — run once in the Supabase SQL editor.
-- Stores per-user reminder preferences for the paid add-on. Sends happen via
-- the service-role /api/reminders/run endpoint (Vercel cron, daily 06:00 UTC).

create table if not exists public.bill_reminders (
  id           bigint generated always as identity primary key,
  user_key     text        not null,  -- profile uuid, or 'admin:<email>' for local admin
  bill_id      text        not null,  -- client-side bill id (text to tolerate any shape)
  bill_name    text        not null,
  amount       numeric(12,2),
  currency     text        not null default 'USD',
  due_date     date        not null,
  channel      text        not null default 'email'
                 check (channel in ('email','sms','whatsapp')),
  days_before  smallint    not null default 1
                 check (days_before between 0 and 14),
  destination  text        not null,  -- email address, or E.164 phone for sms/whatsapp
  enabled      boolean     not null default true,
  last_sent_at timestamptz,            -- null = not yet sent for this reminder config
  last_error   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_key, bill_id)
);

create index if not exists bill_reminders_due_idx
  on public.bill_reminders (enabled, due_date);

alter table public.bill_reminders enable row level security;

-- Writes go through the service-role /api/reminders endpoint and sends through
-- /api/reminders/run — so no client-side RLS grants are needed at all.
drop policy if exists "no direct access" on public.bill_reminders;
create policy "no direct access" on public.bill_reminders
  for all using (false) with check (false);

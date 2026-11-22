-- WellSpend Growth Agent — run once in the Supabase SQL editor.
-- Logs every outreach the agent sends and holds its single-row state
-- (enabled flag, last run/digest timestamps). Service-role only — all
-- access goes through /api/growth/* and /api/admin/growth endpoints.

create table if not exists public.sales_outreach (
  id           uuid        primary key default gen_random_uuid(),
  lead_key     text        not null,
  email        text,
  name         text,
  intent_score integer     not null default 0,
  signals      jsonb       not null default '[]'::jsonb,
  channel      text        not null default 'email',
  subject      text,
  body         text,
  status       text        not null default 'sent',
  error        text,
  created_at   timestamptz not null default now()
);

create index if not exists sales_outreach_lead_key_idx
  on public.sales_outreach (lead_key, created_at desc);

create index if not exists sales_outreach_created_idx
  on public.sales_outreach (created_at desc);

alter table public.sales_outreach enable row level security;

drop policy if exists "no direct access" on public.sales_outreach;
create policy "no direct access" on public.sales_outreach
  for all using (false) with check (false);

-- Single-row state (id is always 1): enabled flag + run/digest bookkeeping.
create table if not exists public.sales_agent_state (
  id               int          primary key default 1 check (id = 1),
  enabled          boolean      not null default true,
  last_run_at      timestamptz,
  last_digest_at   timestamptz,
  sent_today       integer      not null default 0,
  sent_today_date  date,
  updated_at       timestamptz  not null default now()
);

insert into public.sales_agent_state (id) values (1) on conflict (id) do nothing;

alter table public.sales_agent_state enable row level security;

drop policy if exists "no direct access" on public.sales_agent_state;
create policy "no direct access" on public.sales_agent_state
  for all using (false) with check (false);

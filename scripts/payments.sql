-- WellSpend payments ledger — run once in the Supabase SQL editor.
-- Traceable record of every successful payment / manual grant: who paid,
-- when, how much, which provider/method, and the provider reference.
-- Read by /api/admin/users (service role) to populate the "Paid users"
-- details modal at /admin/people/individuals.

create table if not exists public.payments (
  id          bigint generated always as identity primary key,
  user_id     uuid,
  user_email  text,
  provider    text        not null,            -- stripe | paynow | ecocash | bank | admin
  method      text,                            -- e.g. card, manual grant
  amount      numeric(12,2),
  currency    text        not null default 'usd',
  reference   text,                            -- stripe session id / WSPD-xxx / txn ref
  status      text        not null default 'paid',
  meta        jsonb       not null default '{}'::jsonb,
  paid_at     timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists payments_user_idx
  on public.payments (user_id, paid_at desc);

create index if not exists payments_reference_idx
  on public.payments (reference);

alter table public.payments enable row level security;

-- Inserts/reads go through service-role API routes (verify-payment, stripe
-- webhook, /api/admin/users) — block direct anon/authenticated access.
drop policy if exists "no direct access" on public.payments;
create policy "no direct access" on public.payments
  for all using (false) with check (false);

-- WellSpend custom price overrides — run once in the Supabase SQL editor.
-- Super Admin can set monthly prices per market (region) or per country.
-- Country overrides win over market overrides; missing rows fall back to the
-- built-in regional prices in lib/pricing.ts.

create table if not exists public.price_overrides (
  id          bigint generated always as identity primary key,
  scope       text        not null check (scope in ('market', 'country')),
  key         text        not null,               -- market name or ISO 3166-1 alpha-2
  amount_usd  numeric(10,2) not null check (amount_usd > 0 and amount_usd <= 1000),
  updated_at  timestamptz not null default now(),
  unique (scope, key)
);

alter table public.price_overrides enable row level security;

-- Prices are public (checkout displays them); writes go through the
-- service-role admin API only.
drop policy if exists "public read prices" on public.price_overrides;
create policy "public read prices" on public.price_overrides
  for select using (true);

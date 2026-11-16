-- Manual paid override for Super Admin / Access Control.
-- paid_override: NULL = follow normal billing, 'paid' = always paid,
-- 'unpaid' = always unpaid (beats auto renewals and expiry).
alter table public.profiles
  add column if not exists paid_override text;

alter table public.profiles
  drop constraint if exists profiles_paid_override_check;

alter table public.profiles
  add constraint profiles_paid_override_check
  check (paid_override is null or paid_override in ('paid', 'unpaid'));

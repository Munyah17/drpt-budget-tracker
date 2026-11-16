-- WellSpend monthly subscription expiry — run once in the Supabase SQL editor.
-- Adds paid_until to profiles. Existing paid users get a fresh month from the
-- migration date; every new payment (or renewal) sets paid_until = +1 month.
-- NULL paid_until + is_paid = exempt (admin/demo/legacy accounts).

alter table public.profiles
  add column if not exists paid_until timestamptz;

update public.profiles
  set paid_until = now() + interval '1 month'
  where is_paid = true
    and paid_until is null
    and role = 'user';

-- Security fix: corporates table RLS (bug-bounty VULN-07)
-- Run in Supabase Dashboard → SQL Editor.
--
-- Problem: the public anon key could SELECT every corporate row (and INSERT
-- attempts passed RLS, failing only on NOT NULL). profiles/payments/user_data
-- are already protected — corporates was the gap.
--
-- After this: anon gets nothing; signed-in users only see their own org;
-- the service role (all /api/admin/* routes) bypasses RLS automatically.

alter table public.corporates enable row level security;

-- Remove any legacy allow-all policies (names may vary — adjust if yours differ)
drop policy if exists "Enable read access for all users" on public.corporates;
drop policy if exists "corporates_public_read" on public.corporates;
drop policy if exists "corporates_insert" on public.corporates;
drop policy if exists "Allow all" on public.corporates;

-- Signed-in users can read the corporate org they belong to.
-- profiles.corporate_id links a user/employee profile to their organisation.
create policy "corporates_member_read" on public.corporates
  for select to authenticated
  using (
    id in (
      select corporate_id from public.profiles
      where id = auth.uid() and corporate_id is not null
    )
  );

-- Corporate admins and staff can update their own org row
-- (trial activation, theme colour, seats).
create policy "corporates_member_update" on public.corporates
  for update to authenticated
  using (
    id in (
      select corporate_id from public.profiles
      where id = auth.uid() and corporate_id is not null
    )
  )
  with check (
    id in (
      select corporate_id from public.profiles
      where id = auth.uid() and corporate_id is not null
    )
  );

-- Nobody may insert/delete corporates from the client — orgs are created
-- by the admin API (service role bypasses RLS).

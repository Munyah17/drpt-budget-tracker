-- Corporate client management: link employee profiles to their organisation.
-- Run once in the Supabase SQL editor.
alter table public.profiles
  add column if not exists corporate_id uuid references public.corporates(id) on delete set null;

create index if not exists profiles_corporate_idx
  on public.profiles (corporate_id)
  where corporate_id is not null;

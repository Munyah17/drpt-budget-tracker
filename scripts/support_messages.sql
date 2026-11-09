-- Support inbox: one row per client message, rendered at /admin/support.
-- Written by POST /api/support via the service role; access is admin-only
-- through /api/admin/support, so no RLS policies are needed.
create table if not exists public.support_messages (
  id bigint generated always as identity primary key,
  user_key text,                       -- supabase uid, "admin:<email>", or null (anonymous)
  user_email text,
  user_name text,
  subject text not null,
  message text not null,
  status text not null default 'open'
    check (status in ('open', 'in-progress', 'resolved', 'closed')),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists support_messages_status_idx
  on public.support_messages (status, created_at desc);

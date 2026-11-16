-- Customer suggestions & feedback — visible to Super Admin only.
-- kind: suggestion | feedback | bug. status: new | reviewed | planned | shipped | declined.

create table if not exists public.customer_feedback (
  id           bigint generated always as identity primary key,
  user_key     text,
  user_email   text        not null,
  user_name    text,
  kind         text        not null,
  message      text        not null,
  page         text,
  app_version  text,
  status       text        not null default 'new',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint customer_feedback_kind_check
    check (kind in ('suggestion', 'feedback', 'bug')),
  constraint customer_feedback_status_check
    check (status in ('new', 'reviewed', 'planned', 'shipped', 'declined'))
);

create index if not exists customer_feedback_created_idx
  on public.customer_feedback (created_at desc);

create index if not exists customer_feedback_status_idx
  on public.customer_feedback (status);

alter table public.customer_feedback enable row level security;

-- All access goes through service-role API routes (/api/feedback and
-- /api/admin/feedback). Deny direct anon/authenticated access explicitly.
drop policy if exists "no direct access" on public.customer_feedback;
create policy "no direct access" on public.customer_feedback
  for all using (false) with check (false);

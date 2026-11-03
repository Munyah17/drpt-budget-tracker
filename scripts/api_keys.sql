-- External API access: API keys for ERP/CRM/accounting integrations, a request
-- audit log, and outbound webhook subscriptions. Run once in the Supabase SQL editor.

-- ── API keys ───────────────────────────────────────────────────────────────
-- Keys are handed to integrators once, stored only as SHA-256 hashes.
create table if not exists public.api_keys (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,                    -- "Sage ERP", "Salesforce", …
  key_prefix    text not null,                    -- "drpt_sk_a1b2c3" for display
  key_hash      text not null unique,             -- sha256 hex of the full key
  scopes        text[] not null default '{read}', -- read / write
  active        boolean not null default true,
  last_used_at  timestamptz,
  created_at    timestamptz not null default now(),
  revoked_at    timestamptz
);

create index if not exists api_keys_hash_idx on public.api_keys (key_hash);

-- ── Request audit log ──────────────────────────────────────────────────────
create table if not exists public.api_audit_log (
  id          uuid primary key default gen_random_uuid(),
  key_id      uuid references public.api_keys(id) on delete set null,
  method      text not null,
  path        text not null,
  status      int  not null,
  ip          text,
  duration_ms int,
  created_at  timestamptz not null default now()
);

create index if not exists api_audit_key_idx    on public.api_audit_log (key_id, created_at desc);
create index if not exists api_audit_created_idx on public.api_audit_log (created_at desc);

-- ── Webhook subscriptions ──────────────────────────────────────────────────
-- Signed event pushes (HMAC-SHA256 in X-WellSpend-Signature) for events like
-- invoice.paid, corporate.created.
create table if not exists public.webhooks (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  url         text not null,
  events      text[] not null,                    -- invoice.paid, corporate.created, employee.created
  secret      text not null,                      -- HMAC signing secret, shown once
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.webhook_deliveries (
  id           uuid primary key default gen_random_uuid(),
  webhook_id   uuid references public.webhooks(id) on delete cascade,
  event        text not null,
  status       int,                               -- HTTP status returned by target, null = unreachable
  success      boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index if not exists webhook_deliveries_idx on public.webhook_deliveries (webhook_id, attempted_at desc);

-- RLS: service role (API routes) only — anon/auth get nothing.
alter table public.api_keys enable row level security;
alter table public.api_audit_log enable row level security;
alter table public.webhooks enable row level security;
alter table public.webhook_deliveries enable row level security;

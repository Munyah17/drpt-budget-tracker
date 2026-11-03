-- WellSpend receipt/statement import + Open Banking — run once in the
-- Supabase SQL editor. All access goes through service-role API routes, so
-- every table gets the deny-all RLS policy used elsewhere (bill_reminders).
--
-- Required env vars (set in .env.local AND Vercel):
--   GEMINI_API_KEY        — Google AI Studio key for receipt/statement vision
--   PLAID_CLIENT_ID       — Plaid API credentials (see PLAID_ENV)
--   PLAID_SECRET          — same
--   PLAID_ENV             — sandbox | development | production
--   SUPABASE_JWT_SECRET   — already used by requireSession; needed locally too
--
-- Also create a PRIVATE storage bucket named "receipts" in the dashboard.

create table if not exists public.import_documents (
  id           bigint generated always as identity primary key,
  user_key     text        not null,  -- profile uuid
  storage_path text        not null,  -- path inside the "receipts" bucket
  mime         text        not null,
  source       text        not null default 'upload'
                 check (source in ('camera','upload')),
  status       text        not null default 'processing'
                 check (status in ('processing','extracted','failed','confirmed')),
  error        text,
  created_at   timestamptz not null default now()
);

create index if not exists import_documents_user_idx
  on public.import_documents (user_key, created_at desc);

create table if not exists public.extracted_items (
  id           bigint generated always as identity primary key,
  user_key     text        not null,
  document_id  bigint      not null references public.import_documents(id) on delete cascade,
  payload      jsonb       not null,
  status       text        not null default 'pending'
                 check (status in ('pending','accepted','dismissed')),
  created_at   timestamptz not null default now()
);

create index if not exists extracted_items_doc_idx
  on public.extracted_items (document_id);

create table if not exists public.bank_connections (
  id              bigint generated always as identity primary key,
  user_key        text        not null unique,   -- one live connection per user (MVP)
  provider        text        not null default 'plaid',
  requisition_id  text,                          -- provider requisition id
  institution_id  text,
  institution_name text,
  link_ref        text        unique,            -- our reference returned via ?ref=
  status          text        not null default 'pending'
                    check (status in ('pending','active','expired','revoked')),
  consent_expires_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.bank_accounts (
  id                  bigint generated always as identity primary key,
  user_key            text        not null,
  connection_id       bigint      not null references public.bank_connections(id) on delete cascade,
  external_account_id text        not null unique,  -- provider account id
  name                text,
  iban                text,
  currency            text,
  created_at          timestamptz not null default now()
);

create index if not exists bank_accounts_user_idx
  on public.bank_accounts (user_key);

create table if not exists public.bank_transactions (
  id                   bigint generated always as identity primary key,
  user_key             text        not null,
  bank_account_id      bigint      not null references public.bank_accounts(id) on delete cascade,
  external_id          text        not null,          -- provider transaction id
  booked_at            date        not null,
  amount               numeric(12,2) not null,        -- negative = money out
  currency             text        not null default 'GBP',
  counterparty         text,                          -- merchant/payee
  description          text,
  imported_expense_id  bigint,                        -- set once committed client-side
  dismissed            boolean     not null default false, -- user marked "already logged"
  created_at           timestamptz not null default now(),
  unique (bank_account_id, external_id)
);

create index if not exists bank_transactions_user_idx
  on public.bank_transactions (user_key, booked_at desc);

-- One-off paid unlocks for free-tier users: $1 net per bank/institution
-- connected. Paid plans and corporate roles skip this entirely.
create table if not exists public.banking_unlocks (
  id             bigint generated always as identity primary key,
  user_key       text        not null,
  institution_id text        not null,   -- provider institution id the unlock covers
  amount_cents   integer     not null,
  currency       text        not null default 'usd',
  provider       text        not null default 'stripe',
  session_id     text        unique,     -- checkout session, also dedupes webhook retries
  created_at     timestamptz not null default now(),
  unique (user_key, institution_id)
);

-- Service-role only everywhere — mirror bill_reminders' deny-all policy.
alter table public.import_documents    enable row level security;
alter table public.extracted_items     enable row level security;
alter table public.bank_connections    enable row level security;
alter table public.bank_accounts       enable row level security;
alter table public.bank_transactions   enable row level security;
alter table public.banking_unlocks     enable row level security;

drop policy if exists "no direct access" on public.import_documents;
create policy "no direct access" on public.import_documents
  for all using (false) with check (false);

drop policy if exists "no direct access" on public.extracted_items;
create policy "no direct access" on public.extracted_items
  for all using (false) with check (false);

drop policy if exists "no direct access" on public.bank_connections;
create policy "no direct access" on public.bank_connections
  for all using (false) with check (false);

drop policy if exists "no direct access" on public.bank_accounts;
create policy "no direct access" on public.bank_accounts
  for all using (false) with check (false);

drop policy if exists "no direct access" on public.bank_transactions;
create policy "no direct access" on public.bank_transactions
  for all using (false) with check (false);

drop policy if exists "no direct access" on public.banking_unlocks;
create policy "no direct access" on public.banking_unlocks
  for all using (false) with check (false);

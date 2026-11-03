-- Invoicing & quotations: persisted client documents (invoices + quotations).
-- Run once in the Supabase SQL editor.

create table if not exists public.invoices (
  id            uuid primary key default gen_random_uuid(),
  number        text not null unique,               -- INV-000001 / QUO-000001
  kind          text not null default 'invoice' check (kind in ('invoice', 'quotation')),
  bill_to_name  text not null,                      -- client / company billed
  bill_to_lines jsonb not null default '[]'::jsonb, -- address lines, email, VAT no., etc.
  items         jsonb not null default '[]'::jsonb, -- [{description, qty, unitPrice, discount}]
  subtotal      numeric(12,2) not null default 0,
  extra_totals  jsonb not null default '[]'::jsonb, -- [{label, amount}] e.g. VAT row
  total         numeric(12,2) not null default 0,
  notes         jsonb not null default '[]'::jsonb,
  status        text not null default 'Pending',    -- invoice: Pending/Paid/Overdue · quotation: Draft/Sent/Accepted/Declined
  due_date      date,                               -- invoice due date or quotation valid-until
  corporate_id  uuid references public.corporates(id) on delete set null,
  issued_at     timestamptz,
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists invoices_kind_idx    on public.invoices (kind);
create index if not exists invoices_status_idx  on public.invoices (status);
create index if not exists invoices_created_idx on public.invoices (created_at desc);

-- RLS on: only the service role (admin API routes) can read/write.
alter table public.invoices enable row level security;

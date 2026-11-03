-- Plaid port: bank_connections gains the item's access token and the
-- incremental /transactions/sync cursor. Run once in the Supabase SQL editor.
alter table public.bank_connections
  add column if not exists access_token text;
alter table public.bank_connections
  add column if not exists plaid_cursor text;

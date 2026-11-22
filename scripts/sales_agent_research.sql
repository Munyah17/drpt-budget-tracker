-- Growth Agent — external research session tracking.
-- Run in the Supabase SQL editor after scripts/sales_agent.sql.
-- Stores the Devin Cloud research session id so the daily agent run can
-- launch a weekly prospecting session and collect its findings.

alter table public.sales_agent_state
  add column if not exists research_session_id     text,
  add column if not exists research_launched_at    timestamptz,
  add column if not exists research_status         text,
  add column if not exists research_last_digest_at timestamptz;

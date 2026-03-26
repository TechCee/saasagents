-- Cleanup: remove ALL agent schedule rows.
-- Run in Supabase SQL Editor (as postgres / service role).
--
-- Use when you intend to have NO scheduled agents, but stray rows exist in public.agent_schedules
-- which can cause the UI to show "scheduled" statuses.
--
-- This is idempotent (running multiple times is safe).

BEGIN;

-- Optional: see what will be deleted
-- SELECT organisation_id, agent_type, cron_expr, next_run_at, created_at
-- FROM public.agent_schedules
-- ORDER BY created_at DESC;

DELETE FROM public.agent_schedules;

COMMIT;


-- Phase 01: add run_at scheduling + READY state.
-- PENDING  = submitted, time nahi aaya abhi
-- READY    = time aa gaya, worker utha sakte ho
-- RUNNING  = worker ne utha liya, execute ho raha hai

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS run_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Update CHECK constraint to include READY
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('PENDING','READY','RUNNING','SUCCESS','FAILED'));

-- Scheduler will query this: "PENDING jobs jinka time aa gaya"
CREATE INDEX IF NOT EXISTS idx_jobs_pending_run_at
  ON jobs (run_at) WHERE status = 'PENDING';

-- Worker will query this: "READY jobs to claim"
CREATE INDEX IF NOT EXISTS idx_jobs_ready
  ON jobs (run_at) WHERE status = 'READY';

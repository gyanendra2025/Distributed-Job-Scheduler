import { pool } from "../database/db";
import {
  JobStatus,
  canTransition,
  IllegalTransitionError,
} from "../stateMachine/stateMachine";

export interface Job {
  id: string;
  type: string;
  payload: unknown;
  status: JobStatus;
  run_at: Date;
  result: unknown | null;
  error: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createJob(
  type: string,
  payload: unknown,
  runAt?: Date | string
): Promise<Job> {
  const { rows } = await pool.query<Job>(
    `INSERT INTO jobs (type, payload, run_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [type, payload ?? {}, runAt ?? new Date()]
  );
  return rows[0];
}

export async function getJob(id: string): Promise<Job | null> {
  const { rows } = await pool.query<Job>(
    `SELECT * FROM jobs WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

// Scheduler calls this: PENDING jobs jinka run_at <= now → mark READY
export async function markDueJobsReady(): Promise<number> {
  const { rowCount } = await pool.query(
    `UPDATE jobs
        SET status = 'READY', updated_at = now()
      WHERE status = 'PENDING'
        AND run_at <= now()`
  );
  return rowCount ?? 0;
}

// Worker calls this: pick one READY job → RUNNING (atomic)
export async function claimNextReady(): Promise<Job | null> {
  const { rows } = await pool.query<Job>(
    `UPDATE jobs
        SET status = 'RUNNING', updated_at = now()
      WHERE id = (
        SELECT id FROM jobs
         WHERE status = 'READY'
         ORDER BY created_at
         LIMIT 1
      )
      RETURNING *`
  );
  return rows[0] ?? null;
}

export async function markSuccess(id: string, result: unknown): Promise<Job> {
  return transitionTo(id, "SUCCESS", { result });
}

export async function markFailed(id: string, error: string): Promise<Job> {
  return transitionTo(id, "FAILED", { error });
}

async function transitionTo(
  id: string,
  to: JobStatus,
  fields: { result?: unknown; error?: string }
): Promise<Job> {
  const current = await getJob(id);
  if (!current) throw new Error(`Job ${id} not found`);
  if (!canTransition(current.status, to)) {
    throw new IllegalTransitionError(current.status, to);
  }

  const { rows } = await pool.query<Job>(
    `UPDATE jobs
        SET status = $2,
            result = COALESCE($3, result),
            error  = COALESCE($4, error),
            updated_at = now()
      WHERE id = $1
        AND status = $5
      RETURNING *`,
    [id, to, fields.result ?? null, fields.error ?? null, current.status]
  );
  if (rows.length === 0) {
    throw new Error(`Concurrent status change on job ${id}`);
  }
  return rows[0];
}

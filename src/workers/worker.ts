import { claimNextReady, markFailed, markSuccess, Job } from "../jobs/jobs";

async function runJob(job: Job): Promise<unknown> {
  await sleep(500);
  if (job.type.startsWith("fail_")) {
    throw new Error(`simulated failure for type=${job.type}`);
  }
  return { ranAt: new Date().toISOString(), type: job.type };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export interface WorkerOptions {
  pollIntervalMs?: number;
  onIdle?: () => void;
}

export async function runWorkerLoop(
  opts: WorkerOptions = {},
  stopSignal: { stopped: boolean }
): Promise<void> {
  const pollInterval = opts.pollIntervalMs ?? 1000;

  while (!stopSignal.stopped) {
    const job = await claimNextReady();
    if (!job) {
      opts.onIdle?.();
      await sleep(pollInterval);
      continue;
    }

    console.log(`[worker] claimed ${job.id} (${job.type})`);
    try {
      const result = await runJob(job);
      await markSuccess(job.id, result);
      console.log(`[worker] SUCCESS ${job.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await markFailed(job.id, msg);
      console.log(`[worker] FAILED  ${job.id} — ${msg}`);
    }
  }
}

import { markDueJobsReady } from "../jobs/jobs";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export interface SchedulerOptions {
  pollIntervalMs?: number;
}

export async function runSchedulerLoop(
  opts: SchedulerOptions = {},
  stopSignal: { stopped: boolean }
): Promise<void> {
  const pollInterval = opts.pollIntervalMs ?? 5000;

  while (!stopSignal.stopped) {
    const count = await markDueJobsReady();
    if (count > 0) {
      console.log(`[scheduler] marked ${count} due job(s) as READY`);
    }
    await sleep(pollInterval);
  }
}

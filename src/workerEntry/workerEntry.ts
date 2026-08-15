import { runWorkerLoop } from "../workers/worker";
import { closeDb } from "../database/db";

const stopSignal = { stopped: false };

runWorkerLoop({ pollIntervalMs: 1000 }, stopSignal).catch((err) => {
  console.error("[worker] fatal:", err);
  process.exit(1);
});

async function shutdown(signal: string) {
  console.log(`[worker] ${signal} received, stopping after current job...`);
  stopSignal.stopped = true;
  setTimeout(async () => {
    await closeDb();
    process.exit(0);
  }, 1500);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

import { runSchedulerLoop } from "./schedular";
import { closeDb } from "../database/db";

const stopSignal = { stopped: false };

console.log("[scheduler] starting, polling every 5s...");

runSchedulerLoop({ pollIntervalMs: 5000 }, stopSignal).catch((err) => {
  console.error("[scheduler] fatal:", err);
  process.exit(1);
});

async function shutdown(signal: string) {
  console.log(`[scheduler] ${signal} received, stopping...`);
  stopSignal.stopped = true;
  setTimeout(async () => {
    await closeDb();
    process.exit(0);
  }, 1500);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

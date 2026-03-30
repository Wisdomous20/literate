import "dotenv/config";

console.log("  LiteRate Worker Process Starting...");
console.log("  Redis:", process.env.REDIS_URL || "redis://localhost:6379");

import { transcriptionWorker } from "./transcriptionWorker";
import { gradingWorker } from "./gradingWorker";
import { oralReadingLevelWorker } from "./oralReadingLevelWorker";

async function shutdown(signal: string) {
  console.log(`\n[Worker] ${signal} received, shutting down...`);
  await Promise.allSettled([
    transcriptionWorker.close(),
    gradingWorker.close(),
    oralReadingLevelWorker.close(),
  ]);
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log("[Worker] All workers running. Waiting for jobs...");
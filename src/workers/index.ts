import "dotenv/config";
import http from "http";

console.log("  LiteRate Worker Process Starting...");
console.log("  Redis:", process.env.REDIS_URL || "redis://localhost:6379");

import { transcriptionWorker } from "./transcriptionWorker";
import { gradingWorker } from "./gradingWorker";
import { oralReadingLevelWorker } from "./oralReadingLevelWorker";
import fs from "fs";

const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
console.log(`[Worker] GOOGLE_APPLICATION_CREDENTIALS: ${keyFile}`);
if (keyFile) {
  console.log(`[Worker] Key file exists: ${fs.existsSync(keyFile)}`);
  if (fs.existsSync(keyFile)) {
    const data = JSON.parse(fs.readFileSync(keyFile, "utf8"));
    console.log(`[Worker] Key file client_email: ${data.client_email}`);
  }
}

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

// Cloud Run requires a listening port for health checks
const PORT = process.env.PORT || 8080;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("OK");
}).listen(PORT, () => {
  console.log(`[Worker] Health check listening on port ${PORT}`);
});

console.log("[Worker] All workers running. Waiting for jobs...");
import { Worker, Job } from "bullmq";
import { getRedis } from "@/lib/redis";
import { createOralReadingService } from "@/service/oral-reading/createOralReadingService";
import type { OralReadingLevelJobData } from "@/lib/queues";
import { LevelClassification } from "@/generated/prisma/enums";

async function processLevel(job: Job<OralReadingLevelJobData>) {
  const { assessmentId, comprehensionLevel } = job.data;
  const result = await createOralReadingService(assessmentId, comprehensionLevel as LevelClassification);

  if (!result.success) {
    console.log(`[Worker:oral-reading] Not ready: ${result.error}`);
    return { status: "PENDING" };
  }

  return { status: "COMPLETED", level: result.oralReadingLevel };
}

export const oralReadingLevelWorker = new Worker<OralReadingLevelJobData>(
  "oral-reading-level",
  processLevel,
  { connection: getRedis(), concurrency: 5 },
);
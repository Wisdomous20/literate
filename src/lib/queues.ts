import { Queue } from "bullmq";
import { getRedis } from "./redis";

export const transcriptionQueue = new Queue("transcription", {
  connection: getRedis(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
  },
});

export const gradingQueue = new Queue("grading", {
  connection: getRedis(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
  },
});

export const oralReadingLevelQueue = new Queue("oral-reading-level", {
  connection: getRedis(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 2000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 100 },
  },
});

// Job data types

export interface TranscriptionJobData {
  assessmentId: string;
  audioUrl: string;
  fileName: string;
}

export interface GradingJobData {
  assessmentId: string;
  comprehensionTestId: string;
  answers: { questionId: string; answer: string }[];
}

export interface OralReadingLevelJobData {
  assessmentId: string;
  comprehensionLevel?: string;
}
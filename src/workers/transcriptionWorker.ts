import { Worker, Job } from "bullmq";
import { getRedis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { analyzeOralFluency } from "@/service/oral-fluency/analysisService";
import { createOralReadingService } from "@/service/oral-reading/createOralReadingService";
import type { TranscriptionJobData } from "@/lib/queues";
import type { OralFluencyAnalysis } from "@/types/oral-reading";

async function downloadAudio(audioUrl: string): Promise<Buffer> {
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function processTranscription(job: Job<TranscriptionJobData>) {
  const { assessmentId, audioUrl, fileName } = job.data;
  console.log(`[Worker:transcription] Processing ${assessmentId}`);

  const session = await prisma.oralFluencySession.findUnique({
    where: { assessmentId },
  });
  if (!session) throw new Error(`No session for ${assessmentId}`);

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { passage: { select: { content: true, language: true } } },
  });
  if (!assessment?.passage) throw new Error(`Assessment/passage not found`);

  await prisma.oralFluencySession.update({
    where: { id: session.id },
    data: { status: "PROCESSING" },
  });

  const audioBuffer = await downloadAudio(audioUrl);

  const analysis: OralFluencyAnalysis = await analyzeOralFluency(
    audioBuffer,
    fileName,
    assessment.passage.content,
    assessment.passage.language,
  );

  await prisma.$transaction(async (tx) => {
    await tx.oralFluencySession.update({
      where: { id: session.id },
      data: {
        transcript: analysis.transcript,
        wordsPerMinute: analysis.wordsPerMinute,
        accuracy: analysis.accuracy,
        totalWords: analysis.totalWords,
        totalMiscues: analysis.totalMiscues,
        duration: analysis.duration,
        oralFluencyScore: analysis.oralFluencyScore,
        classificationLevel: analysis.classificationLevel,
        status: "COMPLETED",
      },
    });

    const timestampData = analysis.alignedWords
      .filter((w) => w.spoken && w.timestamp !== null)
      .map((w, index) => ({
        sessionId: session.id,
        word: w.spoken!,
        startTime: w.timestamp!,
        endTime: w.endTimestamp ?? w.timestamp!,
        confidence: w.confidence,
        index,
      }));

    if (timestampData.length > 0) {
      await tx.wordTimestamp.createMany({ data: timestampData });
    }

    if (analysis.miscues.length > 0) {
      await tx.oralFluencyMiscue.createMany({
        data: analysis.miscues.map((m) => ({
          sessionId: session.id,
          miscueType: m.miscueType,
          expectedWord: m.expectedWord,
          spokenWord: m.spokenWord,
          wordIndex: m.wordIndex,
          timestamp: m.timestamp,
          isSelfCorrected: m.isSelfCorrected,
        })),
      });
    }

    if (analysis.behaviors.length > 0) {
      await tx.oralFluencyBehavior.createMany({
        data: analysis.behaviors.map((b) => ({
          sessionId: session.id,
          behaviorType: b.behaviorType,
          startIndex: b.startIndex,
          endIndex: b.endIndex,
          startTime: b.startTime,
          endTime: b.endTime,
          notes: b.notes,
        })),
      });
    }
  }, { maxWait: 10000, timeout: 30000 });

  // Try computing oral reading level
  try {
    await createOralReadingService(assessmentId);
  } catch {
    console.log(`[Worker] Oral reading level not ready yet`);
  }

  return { assessmentId, status: "COMPLETED" };
}

export const transcriptionWorker = new Worker<TranscriptionJobData>(
  "transcription",
  processTranscription,
  {
    connection: getRedis(),
    concurrency: 2,
    limiter: { max: 5, duration: 60000 },
  },
);

transcriptionWorker.on("completed", (job) =>
  console.log(`[Worker:transcription] Job ${job.id} done`)
);
transcriptionWorker.on("failed", (job, err) =>
  console.error(`[Worker:transcription] Job ${job?.id} failed:`, err.message)
);
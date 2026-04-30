import { prisma } from "@/lib/prisma";
import { transcriptionQueue } from "@/lib/queues";
import type { TranscriptionJobData } from "@/lib/queues";

export interface EnqueueTranscriptionInput {
  assessmentId: string;
  audioUrl: string;
  fileName?: string;
}

export interface EnqueueTranscriptionResult {
  success: boolean;
  assessmentId?: string;
  sessionId?: string;
  status?: "PENDING";
  jobId?: string;
  error?: string;
  code?: "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR";
}

function normalizeFileName(fileName?: string): string {
  return fileName?.trim() || "recording.wav";
}

export async function enqueueTranscriptionService(
  input: EnqueueTranscriptionInput,
): Promise<EnqueueTranscriptionResult> {
  const assessmentId = input.assessmentId?.trim();
  const audioUrl = input.audioUrl?.trim();
  const fileName = normalizeFileName(input.fileName);
  let sessionId: string | undefined;

  if (!assessmentId || !audioUrl) {
    return {
      success: false,
      error: "assessmentId and audioUrl are required.",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { id: true },
    });

    if (!assessment) {
      return {
        success: false,
        error: "Assessment not found.",
        code: "NOT_FOUND",
      };
    }

    const session = await prisma.oralFluencySession.upsert({
      where: { assessmentId },
      create: {
        assessmentId,
        audioUrl,
        status: "PENDING",
      },
      update: {
        audioUrl,
        status: "PENDING",
        transcript: null,
        wordsPerMinute: null,
        accuracy: null,
        totalWords: null,
        totalMiscues: null,
        duration: null,
        oralFluencyScore: null,
        classificationLevel: null,
      },
      select: { id: true },
    });
    sessionId = session.id;

    const jobData: TranscriptionJobData = {
      assessmentId,
      audioUrl,
      fileName,
    };

    const job = await transcriptionQueue.add(
      `transcribe-${assessmentId}`,
      jobData,
      { jobId: `transcription-${assessmentId}` },
    );

    console.log(
      `[Transcription] Enqueued job ${job.id} for assessment ${assessmentId}`,
    );

    return {
      success: true,
      assessmentId,
      sessionId,
      status: "PENDING",
      jobId: job.id,
    };
  } catch (error) {
    if (sessionId) {
      await prisma.oralFluencySession
        .update({
          where: { id: sessionId },
          data: { status: "FAILED" },
        })
        .catch(() => undefined);
    }

    console.error("Failed to enqueue transcription:", error);
    return {
      success: false,
      error: "Failed to enqueue transcription.",
      code: "INTERNAL_ERROR",
    };
  }
}

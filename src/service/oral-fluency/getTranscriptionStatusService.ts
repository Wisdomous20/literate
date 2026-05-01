import { prisma } from "@/lib/prisma";

type TranscriptionStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface TranscriptionStatusData {
  status: TranscriptionStatus;
  assessmentId: string;
  sessionId: string;
  error?: string;
  analysis?: {
    transcript: string | null;
    wordsPerMinute: number | null;
    accuracy: number | null;
    totalWords: number | null;
    totalMiscues: number | null;
    duration: number | null;
    classificationLevel: string | null;
    oralFluencyScore: number | null;
    miscues: Array<{
      miscueType: string;
      expectedWord: string;
      spokenWord: string | null;
      wordIndex: number;
      timestamp: number | null;
      isSelfCorrected: boolean;
    }>;
    behaviors: Array<{
      behaviorType: string;
      startIndex: number | null;
      endIndex: number | null;
      startTime: number | null;
      endTime: number | null;
      notes: string | null;
    }>;
    alignedWords: Array<{
      spoken: string;
      timestamp: number;
      endTimestamp: number;
      confidence: number | null;
    }>;
  };
}

export interface GetTranscriptionStatusResult {
  success: boolean;
  data?: TranscriptionStatusData;
  error?: string;
  code?: "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR";
}

export async function getTranscriptionStatusService(
  assessmentId: string,
): Promise<GetTranscriptionStatusResult> {
  if (!assessmentId) {
    return {
      success: false,
      error: "assessmentId is required.",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const session = await prisma.oralFluencySession.findUnique({
      where: { assessmentId },
      include: {
        miscues: true,
        behaviors: true,
        wordTimestamps: { orderBy: { index: "asc" } },
      },
    });

    if (!session) {
      return {
        success: false,
        error: "Session not found.",
        code: "NOT_FOUND",
      };
    }

    const base = {
      assessmentId,
      sessionId: session.id,
    };

    if (session.status === "PENDING" || session.status === "PROCESSING") {
      return {
        success: true,
        data: {
          ...base,
          status: session.status,
        },
      };
    }

    if (session.status === "FAILED") {
      return {
        success: true,
        data: {
          ...base,
          status: "FAILED",
          error: "Transcription failed",
        },
      };
    }

    return {
      success: true,
      data: {
        ...base,
        status: "COMPLETED",
        analysis: {
          transcript: session.transcript,
          wordsPerMinute: session.wordsPerMinute,
          accuracy: session.accuracy,
          totalWords: session.totalWords,
          totalMiscues: session.totalMiscues,
          duration: session.duration,
          classificationLevel: session.classificationLevel,
          oralFluencyScore: session.oralFluencyScore,
          miscues: session.miscues.map((m) => ({
            miscueType: m.miscueType,
            expectedWord: m.expectedWord,
            spokenWord: m.spokenWord,
            wordIndex: m.wordIndex,
            timestamp: m.timestamp,
            isSelfCorrected: m.isSelfCorrected,
          })),
          behaviors: session.behaviors.map((b) => ({
            behaviorType: b.behaviorType,
            startIndex: b.startIndex,
            endIndex: b.endIndex,
            startTime: b.startTime,
            endTime: b.endTime,
            notes: b.notes,
          })),
          alignedWords: session.wordTimestamps.map((w) => ({
            spoken: w.word,
            timestamp: w.startTime,
            endTimestamp: w.endTime,
            confidence: w.confidence,
          })),
        },
      },
    };
  } catch (error) {
    console.error("Failed to fetch transcription status:", error);
    return {
      success: false,
      error: "Failed to fetch transcription status.",
      code: "INTERNAL_ERROR",
    };
  }
}

import { prisma } from "@/lib/prisma";
import { createOralReadingService } from "@/service/oral-reading/createOralReadingService";
import { analyzeOralFluency } from "./analysisService";
import type {
  AlignedWord,
  BehaviorResult,
  MiscueResult,
  OralFluencyAnalysis,
} from "@/types/oral-reading";
import { postCorrectTranscription } from "@/utils/postCorrectTranscription";
import { initPhoneticDict } from "@/utils/phoneticUtils";
import { normalizeWordStrict as normalizeWord } from "@/utils/textUtils";
import { alignWords } from "./alignmentService";
import { detectMiscues } from "./miscueDetectionService";
import { phoneticPostCorrection } from "./phoneticPostCorrection";

type RecheckCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INVALID_STATE"
  | "INTERNAL_ERROR";

type DbMiscue = {
  id: string;
  miscueType: MiscueResult["miscueType"];
  expectedWord: string;
  spokenWord: string | null;
  wordIndex: number;
  timestamp: number | null;
  isSelfCorrected: boolean;
};

type DbBehavior = {
  behaviorType: BehaviorResult["behaviorType"];
  startIndex: number | null;
  endIndex: number | null;
  startTime: number | null;
  endTime: number | null;
  notes: string | null;
};

type DbWordTimestamp = {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number | null;
  index: number;
};

interface TranscriptWordInput {
  word: string;
  start: number;
  end: number;
}

interface RecheckMetrics {
  totalMiscues: number;
  oralFluencyScore: number;
  classificationLevel: OralFluencyAnalysis["classificationLevel"];
  accuracy: number;
}

interface MiscueComparisonPlan {
  updates: Array<{ id: string; data: MiscueResult }>;
  deletions: string[];
  summary: RecheckAllMiscuesSummary;
}

interface TranscriptCleanupPlan extends MiscueComparisonPlan {
  alignedWords: AlignedWord[];
  generatedMiscues: MiscueResult[];
  totalWords: number;
}

export interface RecheckAllMiscuesSummary {
  checked: number;
  removed: number;
  changed: number;
  kept: number;
  added: number;
  reranTranscription: boolean;
}

export interface RecheckAllMiscuesResult {
  success: boolean;
  error?: string;
  code?: RecheckCode;
  summary?: RecheckAllMiscuesSummary;
  analysis?: OralFluencyAnalysis;
}

function computeMetrics(
  totalWords: number,
  miscues: Pick<MiscueResult, "isSelfCorrected">[],
): RecheckMetrics {
  const totalMiscues = miscues.filter((m) => !m.isSelfCorrected).length;
  const oralFluencyScore =
    totalWords > 0
      ? Math.round(((totalWords - totalMiscues) / totalWords) * 100 * 10) / 10
      : 0;
  const accuracy = oralFluencyScore;
  const classificationLevel =
    oralFluencyScore >= 97
      ? "INDEPENDENT"
      : oralFluencyScore >= 90
        ? "INSTRUCTIONAL"
        : "FRUSTRATION";

  return {
    totalMiscues,
    oralFluencyScore,
    classificationLevel,
    accuracy,
  };
}

function normalizeNullableWord(value: string | null | undefined) {
  if (!value) return "";
  return normalizeWord(value);
}

function sameNullableWord(
  left: string | null | undefined,
  right: string | null | undefined,
) {
  return normalizeNullableWord(left) === normalizeNullableWord(right);
}

function needsUpdate(current: DbMiscue, generated: MiscueResult) {
  return (
    current.miscueType !== generated.miscueType ||
    !sameNullableWord(current.expectedWord, generated.expectedWord) ||
    !sameNullableWord(current.spokenWord, generated.spokenWord) ||
    current.wordIndex !== generated.wordIndex ||
    (current.timestamp ?? null) !== (generated.timestamp ?? null) ||
    current.isSelfCorrected !== generated.isSelfCorrected
  );
}

function toMiscueResult(miscue: DbMiscue): MiscueResult {
  return {
    miscueType: miscue.miscueType,
    expectedWord: miscue.expectedWord,
    spokenWord: miscue.spokenWord,
    wordIndex: miscue.wordIndex,
    timestamp: miscue.timestamp,
    isSelfCorrected: miscue.isSelfCorrected,
  };
}

function toBehaviorResult(behavior: DbBehavior): BehaviorResult {
  return {
    behaviorType: behavior.behaviorType,
    startIndex: behavior.startIndex,
    endIndex: behavior.endIndex,
    startTime: behavior.startTime,
    endTime: behavior.endTime,
    notes: behavior.notes,
  };
}

function buildTranscriptWords(
  transcript: string | null,
  wordTimestamps: DbWordTimestamp[],
): TranscriptWordInput[] {
  const transcriptTokens = (transcript ?? "").split(/\s+/).filter(Boolean);
  const sourceTokens =
    transcriptTokens.length > 0
      ? transcriptTokens
      : wordTimestamps.map((word) => word.word);

  let lastEnd = 0;

  return sourceTokens.flatMap((token, index) => {
    const word = normalizeWord(token);
    if (!word) return [];

    const timestamp = wordTimestamps[index];
    const start =
      timestamp && Number.isFinite(timestamp.startTime)
        ? timestamp.startTime
        : lastEnd;
    const end =
      timestamp &&
      Number.isFinite(timestamp.endTime) &&
      timestamp.endTime >= start
        ? timestamp.endTime
        : start;

    lastEnd = end;

    return [{ word, start, end }];
  });
}

function reprocessMiscuesFromTranscript({
  transcript,
  wordTimestamps,
  passageText,
  language,
}: {
  transcript: string | null;
  wordTimestamps: DbWordTimestamp[];
  passageText: string;
  language: string;
}): { alignedWords: AlignedWord[]; miscues: MiscueResult[]; totalWords: number } {
  const originalPassageWords = passageText
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const normalizedPassageWords = originalPassageWords.map(normalizeWord);
  const transcribedWords = buildTranscriptWords(transcript, wordTimestamps);

  const correctedWords = postCorrectTranscription(
    transcribedWords,
    normalizedPassageWords,
  );
  const rawAlignedWords = alignWords(
    normalizedPassageWords,
    correctedWords.map((word) => ({
      word: word.word,
      start: word.start,
      end: word.end,
    })),
  );
  const alignedWords = phoneticPostCorrection(rawAlignedWords);

  return {
    alignedWords,
    miscues: detectMiscues(alignedWords, language),
    totalWords: originalPassageWords.length,
  };
}

function findGeneratedMatch(
  current: DbMiscue,
  generatedMiscues: MiscueResult[],
  usedGeneratedIndexes: Set<number>,
) {
  const candidates = generatedMiscues
    .map((miscue, index) => ({ miscue, index }))
    .filter(({ index }) => !usedGeneratedIndexes.has(index));

  const exact = candidates.find(
    ({ miscue }) =>
      current.wordIndex === miscue.wordIndex &&
      current.miscueType === miscue.miscueType &&
      sameNullableWord(current.expectedWord, miscue.expectedWord) &&
      sameNullableWord(current.spokenWord, miscue.spokenWord),
  );
  if (exact) return exact;

  const sameAnchor = candidates.find(({ miscue }) => {
    if (current.wordIndex !== miscue.wordIndex) return false;

    if (normalizeNullableWord(current.expectedWord)) {
      return sameNullableWord(current.expectedWord, miscue.expectedWord);
    }

    return sameNullableWord(current.spokenWord, miscue.spokenWord);
  });
  if (sameAnchor) return sameAnchor;

  return candidates.find(({ miscue }) => {
    const currentSpoken = normalizeNullableWord(current.spokenWord);
    const generatedSpoken = normalizeNullableWord(miscue.spokenWord);

    return (
      currentSpoken.length > 0 &&
      currentSpoken === generatedSpoken &&
      Math.abs(current.wordIndex - miscue.wordIndex) <= 1
    );
  });
}

function buildMiscueComparisonPlan(
  currentMiscues: DbMiscue[],
  generatedMiscues: MiscueResult[],
  reranTranscription: boolean,
): MiscueComparisonPlan {
  const usedGeneratedIndexes = new Set<number>();
  const updates: Array<{ id: string; data: MiscueResult }> = [];
  const deletions: string[] = [];
  let kept = 0;

  for (const current of currentMiscues) {
    const match = findGeneratedMatch(
      current,
      generatedMiscues,
      usedGeneratedIndexes,
    );

    if (!match) {
      deletions.push(current.id);
      continue;
    }

    usedGeneratedIndexes.add(match.index);

    if (needsUpdate(current, match.miscue)) {
      updates.push({ id: current.id, data: match.miscue });
    } else {
      kept++;
    }
  }

  return {
    updates,
    deletions,
    summary: {
      checked: currentMiscues.length,
      removed: deletions.length,
      changed: updates.length,
      kept,
      added: Math.max(0, generatedMiscues.length - usedGeneratedIndexes.size),
      reranTranscription,
    },
  };
}

function buildTimestampData(sessionId: string, alignedWords: AlignedWord[]) {
  return alignedWords
    .filter((word) => word.spoken && word.timestamp !== null)
    .map((word, index) => ({
      sessionId,
      word: word.spoken!,
      startTime: word.timestamp!,
      endTime: word.endTimestamp ?? word.timestamp!,
      confidence: word.confidence,
      index,
    }));
}

function shouldFallbackToRetranscription(
  session: {
    audioUrl: string;
    miscues: DbMiscue[];
  },
  transcriptPlan: TranscriptCleanupPlan | null,
) {
  if (!session.audioUrl) return false;
  if (session.miscues.length === 0) return false;
  if (!transcriptPlan) return true;

  return (
    transcriptPlan.summary.added > 0 ||
    (transcriptPlan.summary.removed === 0 &&
      transcriptPlan.summary.changed === 0 &&
      transcriptPlan.summary.kept > 0)
  );
}

async function downloadAudio(audioUrl: string): Promise<Buffer> {
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function persistTranscriptCleanup({
  sessionId,
  session,
  transcriptPlan,
}: {
  sessionId: string;
  session: {
    transcript: string | null;
    wordsPerMinute: number | null;
    duration: number | null;
    behaviors: DbBehavior[];
  };
  transcriptPlan: TranscriptCleanupPlan;
}) {
  const timestampData = buildTimestampData(sessionId, transcriptPlan.alignedWords);

  const transactionResult = await prisma.$transaction(async (tx) => {
    for (const id of transcriptPlan.deletions) {
      await tx.oralFluencyMiscue.delete({ where: { id } });
    }

    for (const update of transcriptPlan.updates) {
      await tx.oralFluencyMiscue.update({
        where: { id: update.id },
        data: {
          miscueType: update.data.miscueType,
          expectedWord: update.data.expectedWord,
          spokenWord: update.data.spokenWord,
          wordIndex: update.data.wordIndex,
          timestamp: update.data.timestamp,
          isSelfCorrected: update.data.isSelfCorrected,
        },
      });
    }

    await tx.wordTimestamp.deleteMany({ where: { sessionId } });
    if (timestampData.length > 0) {
      await tx.wordTimestamp.createMany({ data: timestampData });
    }

    const remainingMiscues = (await tx.oralFluencyMiscue.findMany({
      where: { sessionId },
      orderBy: { wordIndex: "asc" },
    })) as DbMiscue[];

    const metrics = computeMetrics(transcriptPlan.totalWords, remainingMiscues);

    await tx.oralFluencySession.update({
      where: { id: sessionId },
      data: {
        totalWords: transcriptPlan.totalWords,
        totalMiscues: metrics.totalMiscues,
        accuracy: metrics.accuracy,
        oralFluencyScore: metrics.oralFluencyScore,
        classificationLevel: metrics.classificationLevel,
      },
    });

    return { remainingMiscues, metrics };
  });

  return {
    summary: transcriptPlan.summary,
    analysis: {
      transcript: session.transcript ?? "",
      wordsPerMinute: session.wordsPerMinute ?? 0,
      accuracy: transactionResult.metrics.accuracy,
      totalWords: transcriptPlan.totalWords,
      totalMiscues: transactionResult.metrics.totalMiscues,
      duration: session.duration ?? 0,
      classificationLevel: transactionResult.metrics.classificationLevel,
      oralFluencyScore: transactionResult.metrics.oralFluencyScore,
      miscues: transactionResult.remainingMiscues.map(toMiscueResult),
      behaviors: session.behaviors.map(toBehaviorResult),
      alignedWords: transcriptPlan.alignedWords,
    } satisfies OralFluencyAnalysis,
  };
}

async function persistFullAnalysis({
  sessionId,
  analysis,
}: {
  sessionId: string;
  analysis: OralFluencyAnalysis;
}) {
  const timestampData = buildTimestampData(sessionId, analysis.alignedWords);

  await prisma.$transaction(async (tx) => {
    await tx.wordTimestamp.deleteMany({ where: { sessionId } });
    await tx.oralFluencyMiscue.deleteMany({ where: { sessionId } });
    await tx.oralFluencyBehavior.deleteMany({ where: { sessionId } });

    await tx.oralFluencySession.update({
      where: { id: sessionId },
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

    if (timestampData.length > 0) {
      await tx.wordTimestamp.createMany({ data: timestampData });
    }

    if (analysis.miscues.length > 0) {
      await tx.oralFluencyMiscue.createMany({
        data: analysis.miscues.map((miscue) => ({
          sessionId,
          miscueType: miscue.miscueType,
          expectedWord: miscue.expectedWord,
          spokenWord: miscue.spokenWord,
          wordIndex: miscue.wordIndex,
          timestamp: miscue.timestamp,
          isSelfCorrected: miscue.isSelfCorrected,
        })),
      });
    }

    if (analysis.behaviors.length > 0) {
      await tx.oralFluencyBehavior.createMany({
        data: analysis.behaviors.map((behavior) => ({
          sessionId,
          behaviorType: behavior.behaviorType,
          startIndex: behavior.startIndex,
          endIndex: behavior.endIndex,
          startTime: behavior.startTime,
          endTime: behavior.endTime,
          notes: behavior.notes,
        })),
      });
    }
  });
}

export async function recheckAllMiscuesService(
  sessionId: string,
  userId?: string,
): Promise<RecheckAllMiscuesResult> {
  if (!sessionId) {
    return {
      success: false,
      error: "Session ID is required.",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const session = await prisma.oralFluencySession.findUnique({
      where: { id: sessionId },
      include: {
        miscues: { orderBy: { wordIndex: "asc" } },
        behaviors: true,
        wordTimestamps: { orderBy: { index: "asc" } },
        assessment: {
          select: {
            id: true,
            passage: { select: { content: true, language: true } },
            student: {
              select: {
                classRoom: { select: { userId: true } },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return {
        success: false,
        error: "Session not found.",
        code: "NOT_FOUND",
      };
    }

    if (userId && session.assessment?.student.classRoom.userId !== userId) {
      return {
        success: false,
        error: "You do not have access to this oral reading session.",
        code: "FORBIDDEN",
      };
    }

    if (!session.assessment?.passage) {
      return {
        success: false,
        error: "Passage not found for this session.",
        code: "NOT_FOUND",
      };
    }

    await initPhoneticDict();

    const transcriptWords = buildTranscriptWords(
      session.transcript,
      session.wordTimestamps as DbWordTimestamp[],
    );

    let transcriptPlan: TranscriptCleanupPlan | null = null;

    if (transcriptWords.length > 0) {
      const transcriptResult = reprocessMiscuesFromTranscript({
        transcript: session.transcript,
        wordTimestamps: session.wordTimestamps as DbWordTimestamp[],
        passageText: session.assessment.passage.content,
        language: session.assessment.passage.language,
      });
      const comparisonPlan = buildMiscueComparisonPlan(
        session.miscues as DbMiscue[],
        transcriptResult.miscues,
        false,
      );

      transcriptPlan = {
        ...comparisonPlan,
        alignedWords: transcriptResult.alignedWords,
        generatedMiscues: transcriptResult.miscues,
        totalWords: transcriptResult.totalWords,
      };
    }

    if (!shouldFallbackToRetranscription(session, transcriptPlan)) {
      if (!transcriptPlan) {
        return {
          success: false,
          error: "No transcript words are available to recheck.",
          code: "INVALID_STATE",
        };
      }

      const result = await persistTranscriptCleanup({
        sessionId,
        session: {
          transcript: session.transcript,
          wordsPerMinute: session.wordsPerMinute,
          duration: session.duration,
          behaviors: session.behaviors as DbBehavior[],
        },
        transcriptPlan,
      });

      if (session.assessmentId) {
        const oralReadingResult = await createOralReadingService(
          session.assessmentId,
        );
        if (!oralReadingResult.success) {
          console.log(
            "[recheckAllMiscuesService] Oral reading level not recomputed:",
            oralReadingResult.error,
          );
        }
      }

      return {
        success: true,
        summary: result.summary,
        analysis: result.analysis,
      };
    }

    if (!session.audioUrl) {
      return {
        success: false,
        error: "No saved audio is available to re-run transcription.",
        code: "INVALID_STATE",
      };
    }

    const audioBuffer = await downloadAudio(session.audioUrl);
    const fullAnalysis = await analyzeOralFluency(
      audioBuffer,
      "recording.wav",
      session.assessment.passage.content,
      session.assessment.passage.language,
    );

    await persistFullAnalysis({
      sessionId,
      analysis: fullAnalysis,
    });

    const rerunSummary = buildMiscueComparisonPlan(
      session.miscues as DbMiscue[],
      fullAnalysis.miscues,
      true,
    ).summary;

    if (session.assessmentId) {
      const oralReadingResult = await createOralReadingService(
        session.assessmentId,
      );
      if (!oralReadingResult.success) {
        console.log(
          "[recheckAllMiscuesService] Oral reading level not recomputed:",
          oralReadingResult.error,
        );
      }
    }

    return {
      success: true,
      summary: rerunSummary,
      analysis: fullAnalysis,
    };
  } catch (error) {
    console.error("recheckAllMiscuesService error:", error);
    return {
      success: false,
      error: "Failed to recheck miscues.",
      code: "INTERNAL_ERROR",
    };
  }
}

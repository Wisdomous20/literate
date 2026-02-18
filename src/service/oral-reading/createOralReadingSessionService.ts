import { prisma } from "@/lib/prisma"
import { analyzeOralReading } from "./analysisService"
import { OralReadingAnalysis } from "@/types/oral-reading"

interface CreateOralReadingInput {
  assessmentId: string
  audioBuffer: Buffer
  fileName: string
  audioUrl: string
}

interface CreateOralReadingResult {
  success: boolean
  sessionId?: string
  analysis?: OralReadingAnalysis
  error?: string
  code?: "VALIDATION_ERROR" | "NOT_FOUND" | "ANALYSIS_FAILED" | "INTERNAL_ERROR"
}

export async function createOralReadingSessionService(
  input: CreateOralReadingInput
): Promise<CreateOralReadingResult> {
  const { assessmentId, audioBuffer, fileName, audioUrl } = input

  if (!assessmentId || !audioBuffer) {
    return {
      success: false,
      error: "assessmentId and audio are required.",
      code: "VALIDATION_ERROR",
    }
  }

  // 1. Validate assessment exists and get passage
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { passage: true },
  })

  if (!assessment) {
    return {
      success: false,
      error: "Assessment not found.",
      code: "NOT_FOUND",
    }
  }

  if (!assessment.passage) {
    return {
      success: false,
      error: "Passage not found for this assessment.",
      code: "NOT_FOUND",
    }
  }

  // 2. Create session (linked to existing assessment)
  const session = await prisma.oralReadingSession.create({
    data: {
      assessmentId: assessment.id,
      audioUrl,
      status: "PROCESSING",
    },
  })

  // 3. Run analysis
  try {
    const analysis = await analyzeOralReading(
      audioBuffer,
      fileName,
      assessment.passage.content,
      assessment.passage.language
    )

    // 4. Persist results in transaction
    await prisma.$transaction(async (tx) => {
      await tx.oralReadingSession.update({
        where: { id: session.id },
        data: {
          transcript: analysis.transcript,
          wordsPerMinute: analysis.wordsPerMinute,
          accuracy: analysis.accuracy,
          totalWords: analysis.totalWords,
          totalMiscues: analysis.totalMiscues,
          duration: analysis.duration,
          status: "COMPLETED",
        },
      })

      const timestampData = analysis.alignedWords
        .filter((w) => w.spoken && w.timestamp !== null)
        .map((w, index) => ({
          sessionId: session.id,
          word: w.spoken!,
          startTime: w.timestamp!,
          endTime: w.endTimestamp ?? w.timestamp!,
          confidence: w.confidence,
          index,
        }))

      if (timestampData.length > 0) {
        await tx.wordTimestamp.createMany({ data: timestampData })
      }

      if (analysis.miscues.length > 0) {
        await tx.oralReadingMiscue.createMany({
          data: analysis.miscues.map((m) => ({
            sessionId: session.id,
            miscueType: m.miscueType,
            expectedWord: m.expectedWord,
            spokenWord: m.spokenWord,
            wordIndex: m.wordIndex,
            timestamp: m.timestamp,
            isSelfCorrected: m.isSelfCorrected,
          })),
        })
      }

      if (analysis.behaviors.length > 0) {
        await tx.oralReadingBehavior.createMany({
          data: analysis.behaviors.map((b) => ({
            sessionId: session.id,
            behaviorType: b.behaviorType,
            startIndex: b.startIndex,
            endIndex: b.endIndex,
            startTime: b.startTime,
            endTime: b.endTime,
            notes: b.notes,
          })),
        })
      }
    })

    return { success: true, sessionId: session.id, analysis }
  } catch (error) {
    await prisma.oralReadingSession.update({
      where: { id: session.id },
      data: { status: "FAILED" },
    })
    console.error("Analysis failed:", error)
    return {
      success: false,
      error: "Analysis failed.",
      sessionId: session.id,
      code: "ANALYSIS_FAILED",
    }
  }
}
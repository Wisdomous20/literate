import { prisma } from "@/lib/prisma"
import { OralFluencyAnalysis } from "@/types/oral-reading"
import { analyzeOralFluency } from "./analysisService"

interface CreateOralFluencyInput {
  assessmentId: string
  audioBuffer: Buffer
  fileName: string
  audioUrl: string
}

interface CreateOralFluencyResult {
  success: boolean
  sessionId?: string
  analysis?: OralFluencyAnalysis
  error?: string
  code?: "VALIDATION_ERROR" | "NOT_FOUND" | "ANALYSIS_FAILED" | "INTERNAL_ERROR"
}

export async function createOralFluencySessionService(
  input: CreateOralFluencyInput
): Promise<CreateOralFluencyResult> {
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
  const session = await prisma.oralFluencySession.create({
    data: {
      assessmentId: assessment.id,
      audioUrl,
      status: "PROCESSING",
    },
  })

  // 3. Run analysis
  try {
    const analysis = await analyzeOralFluency(
      audioBuffer,
      fileName,
      assessment.passage.content,
      assessment.passage.language
    )

    // 4. Persist results in transaction
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
        })
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
        })
      }
    }, {
      maxWait: 10000,  // max time to wait to acquire a connection (10s)
      timeout: 30000,  // max time the transaction can run (30s)
    })

    return { success: true, sessionId: session.id, analysis }
  } catch (error) {
    await prisma.oralFluencySession.update({
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
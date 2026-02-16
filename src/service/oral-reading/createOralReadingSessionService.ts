import { prisma } from "@/lib/prisma"
import { analyzeOralReading } from "./analysisService"
import { OralReadingAnalysis } from "@/types/oral-reading"

interface CreateOralReadingInput {
  studentId: string
  passageId: string
  audioBuffer: Buffer
  fileName: string
  audioUrl: string
}

interface CreateOralReadingResult {
  success: boolean
  sessionId?: string
  analysis?: OralReadingAnalysis
  error?: string
}

export async function createOralReadingSessionService(
  input: CreateOralReadingInput
): Promise<CreateOralReadingResult> {
  const { studentId, passageId, audioBuffer, fileName, audioUrl } = input

  // 1. Validate passage exists
  const passage = await prisma.passage.findUnique({
    where: { id: passageId },
  })

  if (!passage) {
    return { success: false, error: "Passage not found" }
  }

  // 2. Create assessment + session
  const assessment = await prisma.assessment.create({
    data: {
      studentId,
      type: "ORAL_READING",
      passageId,
    },
  })

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
      passage.content,
      passage.language
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
    return { success: false, error: "Analysis failed", sessionId: session.id }
  }
}
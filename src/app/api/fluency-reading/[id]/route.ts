import { NextRequest, NextResponse } from "next/server"
import { createAssessmentService } from "@/service/assessment/createAssessmentService"
import { createOralReadingSessionService } from "@/service/oral-reading/createOralReadingSessionService"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const studentId = formData.get("studentId") as string
    const passageId = formData.get("passageId") as string
    const audioFile = formData.get("audio") as File
    const audioUrl = (formData.get("audioUrl") as string) || ""

    if (!studentId || !passageId || !audioFile) {
      return NextResponse.json(
        { error: "studentId, passageId, and audio file are required" },
        { status: 400 }
      )
    }

    // 1. Create assessment FIRST
    const assessmentResult = await createAssessmentService({
      studentId,
      passageId,
      type: "ORAL_READING",
    })

    if (!assessmentResult.success || !assessmentResult.assessment) {
      return NextResponse.json(
        { error: assessmentResult.error || "Failed to create assessment" },
        { status: 400 }
      )
    }

    // 2. Then create oral reading session with assessmentId
    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    const result = await createOralReadingSessionService({
      assessmentId: assessmentResult.assessment.id,
      audioBuffer,
      fileName: audioFile.name || "recording.webm",
      audioUrl,
    })

    if (!result.success) {
      const statusMap: Record<string, number> = {
        VALIDATION_ERROR: 400,
        NOT_FOUND: 404,
        ANALYSIS_FAILED: 500,
        INTERNAL_ERROR: 500,
      }
      const status = result.code ? statusMap[result.code] ?? 500 : 500

      return NextResponse.json(
        {
          error: result.error,
          sessionId: result.sessionId,
          assessmentId: assessmentResult.assessment.id,
        },
        { status }
      )
    }

    return NextResponse.json(
      {
        assessmentId: assessmentResult.assessment.id,
        sessionId: result.sessionId,
        status: "COMPLETED",
        analysis: result.analysis,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error in oral reading API:", error)
    return NextResponse.json(
      { error: "Failed to create oral reading session" },
      { status: 500 }
    )
  }
}
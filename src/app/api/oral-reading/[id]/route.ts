import { NextRequest, NextResponse } from "next/server"
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

    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    const result = await createOralReadingSessionService({
      studentId,
      passageId,
      audioBuffer,
      fileName: audioFile.name || "recording.webm",
      audioUrl,
    })

    if (!result.success) {
      const status = result.error === "Passage not found" ? 404 : 500
      return NextResponse.json(
        { error: result.error, sessionId: result.sessionId },
        { status }
      )
    }

    return NextResponse.json(
      { sessionId: result.sessionId, status: "COMPLETED", analysis: result.analysis },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating session:", error)
    return NextResponse.json(
      { error: "Failed to create oral reading session" },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from "next/server"
import { createAssessmentService } from "@/service/assessment/createAssessmentService"
import { createOralReadingSessionService } from "@/service/oral-reading/createOralReadingSessionService"

function serializeError(err: unknown): string {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}`;
  }
  try {
    const str = JSON.stringify(err);
    if (str && str !== "{}") return str;
  } catch {}
  return String(err);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export const maxDuration = 60; // allow up to 60 seconds for Whisper processing

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
          });
        }
      });

      return NextResponse.json(
        { sessionId: session.id, status: "COMPLETED", analysis },
        { status: 201 }
      );
    } catch (analysisError) {
      const errorMsg = serializeError(analysisError);
      console.error("Analysis failed:", errorMsg, analysisError);
      try {
        await prisma.oralReadingSession.update({
          where: { id: session.id },
          data: { status: "FAILED" },
        });
      } catch (updateErr) {
        console.error("Failed to update session status:", updateErr);
      }
      return NextResponse.json(
        { error: errorMsg, sessionId: session.id },
        { status: 500 }
      );
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
    const errorMsg = serializeError(error);
    console.error("Error creating session:", errorMsg, error);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from "next/server";
import { createOralFluencySessionService } from "@/service/oral-fluency/createOralFluencySessionService";
import { createOralReadingService } from "@/service/oral-reading/createOralReadingService";
import { prisma } from "@/lib/prisma";

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

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const assessmentId = formData.get("assessmentId") as string;
    const audioFile = formData.get("audio") as File;
    const audioUrl = (formData.get("audioUrl") as string) || "";

    if (!assessmentId || !audioFile) {
      return NextResponse.json(
        { error: "assessmentId and audio file are required" },
        { status: 400 },
      );
    }

    console.log("Starting transcription for assessment:", assessmentId);

    // Process the audio and create oral fluency session
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    const result = await createOralFluencySessionService({
      assessmentId,
      audioBuffer,
      fileName: audioFile.name || "recording.wav",
      audioUrl,
    });

    if (!result.success) {
      const statusMap: Record<string, number> = {
        VALIDATION_ERROR: 400,
        NOT_FOUND: 404,
        ANALYSIS_FAILED: 500,
        INTERNAL_ERROR: 500,
      };
      const status = result.code ? (statusMap[result.code] ?? 500) : 500;

      return NextResponse.json(
        {
          error: result.error || "Failed to process transcription",
          sessionId: result.sessionId,
          assessmentId,
        },
        { status },
      );
    }

    // Transcription succeeded - check if comprehension is already submitted
    // If yes, create the oral reading result now
    try {
      const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        select: {
          comprehension: { select: { classificationLevel: true } },
        },
      });

      if (assessment?.comprehension?.classificationLevel) {
        console.log("Comprehension already completed - creating oral reading result");
        await createOralReadingService(
          assessmentId,
          assessment.comprehension.classificationLevel,
        );
      } else {
        console.log("Comprehension not yet completed - oral reading result will be created when comprehension is submitted");
      }
    } catch (error) {
      console.error("Error checking/creating oral reading result:", error);
      // Don't fail the whole request if this fails
    }

    return NextResponse.json(
      {
        assessmentId,
        sessionId: result.sessionId,
        status: "COMPLETED",
        analysis: result.analysis,
      },
      { status: 201 },
    );
  } catch (error) {
    const errorMsg = serializeError(error);
    console.error("Error in transcription:", errorMsg, error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
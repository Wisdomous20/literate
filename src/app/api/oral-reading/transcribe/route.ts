import { NextRequest, NextResponse } from "next/server";
import {
  assessmentIdQuerySchema,
  transcriptionRequestSchema,
} from "@/lib/validation/media";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { enqueueTranscriptionService } from "@/service/oral-fluency/enqueueTranscriptionService";
import { getTranscriptionStatusService } from "@/service/oral-fluency/getTranscriptionStatusService";
import {
  InvalidRequestBodyError,
  readTranscriptionPayload,
} from "@/app/api/_utils/audioRequestPayload";
import { serviceErrorResponse } from "@/app/api/_utils/serviceErrorResponse";

export const maxDuration = 10;

export async function POST(request: NextRequest) {
  try {
    const payload = await readTranscriptionPayload(request);
    const validationResult = transcriptionRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: getFirstZodErrorMessage(validationResult.error) },
        { status: 400 },
      );
    }

    const { assessmentId, audioUrl, fileName = "recording.wav" } =
      validationResult.data;

    const result = await enqueueTranscriptionService({
      assessmentId,
      audioUrl,
      fileName,
    });

    if (!result.success) {
      return serviceErrorResponse(result, "Failed to enqueue transcription");
    }

    return NextResponse.json(
      {
        success: true,
        assessmentId: result.assessmentId,
        sessionId: result.sessionId,
        status: result.status,
        jobId: result.jobId,
      },
      { status: 202 },
    );
  } catch (error) {
    if (error instanceof InvalidRequestBodyError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Transcription enqueue error:", error);
    return NextResponse.json(
      { error: "Failed to enqueue transcription" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const validationResult = assessmentIdQuerySchema.safeParse({
    assessmentId: request.nextUrl.searchParams.get("assessmentId"),
  });

  if (!validationResult.success) {
    return NextResponse.json(
      { error: getFirstZodErrorMessage(validationResult.error) },
      { status: 400 },
    );
  }

  const result = await getTranscriptionStatusService(
    validationResult.data.assessmentId,
  );

  if (!result.success || !result.data) {
    return serviceErrorResponse(result, "Failed to fetch transcription status");
  }

  return NextResponse.json(result.data);
}

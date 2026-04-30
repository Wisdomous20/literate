import { NextRequest, NextResponse } from "next/server";
import { createAudioAssessmentSchema } from "@/lib/validation/media";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { createAudioAssessmentSessionService } from "@/service/oral-fluency/createAudioAssessmentSessionService";
import {
  InvalidRequestBodyError,
  readCreateAudioAssessmentPayload,
} from "@/app/api/_utils/audioRequestPayload";
import { serviceErrorResponse } from "@/app/api/_utils/serviceErrorResponse";

export async function POST(request: NextRequest) {
  try {
    const payload = await readCreateAudioAssessmentPayload(request);
    const validationResult = createAudioAssessmentSchema.safeParse(payload);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: getFirstZodErrorMessage(validationResult.error) },
        { status: 400 },
      );
    }

    const { studentId, passageId, audioUrl, fileName = "recording.wav" } =
      validationResult.data;

    const result = await createAudioAssessmentSessionService({
      studentId,
      passageId,
      type: "READING_FLUENCY",
      audioUrl,
      fileName,
    });

    if (!result.success) {
      return serviceErrorResponse(
        result,
        "Failed to create reading fluency session",
      );
    }

    return NextResponse.json(
      {
        assessmentId: result.assessmentId,
        sessionId: result.sessionId,
        status: result.status,
      },
      { status: 202 },
    );
  } catch (error) {
    if (error instanceof InvalidRequestBodyError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error in fluency reading API:", error);
    return NextResponse.json(
      { error: "Failed to create reading fluency session" },
      { status: 500 },
    );
  }
}

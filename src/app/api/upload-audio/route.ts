import { NextRequest, NextResponse } from "next/server";
import { uploadAudioSchema } from "@/lib/validation/media";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { uploadAudioService } from "@/service/media/uploadAudioService";
import { serviceErrorResponse } from "@/app/api/_utils/serviceErrorResponse";
import {
  hasAssessmentAccess,
  hasAuthenticatedSession,
} from "@/lib/auth/assessmentAuthorization";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const assessmentId = formData.get("assessmentId");
    const assessmentToken = request.headers.get("x-assessment-token");
    const hasAccess =
      typeof assessmentId === "string"
        ? await hasAssessmentAccess(assessmentId, assessmentToken)
        : await hasAuthenticatedSession();

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const validationResult = uploadAudioSchema.safeParse({
      file: formData.get("file"),
      filePath: formData.get("filePath"),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: getFirstZodErrorMessage(validationResult.error),
        },
        { status: 400 },
      );
    }

    const result = await uploadAudioService(validationResult.data);

    if (!result.success) {
      return serviceErrorResponse(result, "Failed to upload audio");
    }

    return NextResponse.json({ success: true, url: result.url });
  } catch (error) {
    console.error("Audio upload route error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload audio" },
      { status: 500 },
    );
  }
}

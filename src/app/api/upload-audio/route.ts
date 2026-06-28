import { NextRequest, NextResponse } from "next/server";
import { uploadAudioSchema } from "@/lib/validation/media";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { uploadAudioService } from "@/service/media/uploadAudioService";
import { serviceErrorResponse } from "@/app/api/_utils/serviceErrorResponse";
import {
  getCurrentUser,
  hasAssessmentAccess,
} from "@/lib/auth/assessmentAuthorization";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const assessmentId = formData.get("assessmentId");
    const assessmentToken = request.headers.get("x-assessment-token");
    const currentUser = await getCurrentUser();
    const hasAccess =
      typeof assessmentId === "string"
        ? await hasAssessmentAccess(
            assessmentId,
            assessmentToken,
            currentUser?.id,
          )
        : Boolean(currentUser);

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: currentUser ? "Forbidden" : "Unauthorized",
        },
        { status: currentUser ? 403 : 401 },
      );
    }

    const validationResult = uploadAudioSchema.safeParse({
      file: formData.get("file"),
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

    return NextResponse.json({
      success: true,
      audioObjectPath: result.audioObjectPath,
    });
  } catch (error) {
    console.error("Audio upload route error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload audio" },
      { status: 500 },
    );
  }
}

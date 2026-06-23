"use server";

import { uploadAudioSchema } from "@/lib/validation/media";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { uploadAudioService } from "@/service/media/uploadAudioService";
import { hasAuthenticatedSession } from "@/lib/auth/assessmentAuthorization";

export async function uploadAudioToGCS(
  formData: FormData
): Promise<{ success: boolean; audioObjectPath?: string; error?: string }> {
  try {
    if (!(await hasAuthenticatedSession())) {
      return { success: false, error: "Unauthorized" };
    }

    const validationResult = uploadAudioSchema.safeParse({
      file: formData.get("file"),
    });

    if (!validationResult.success) {
      return {
        success: false,
        error: getFirstZodErrorMessage(validationResult.error),
      };
    }

    return uploadAudioService(validationResult.data);
  } catch (err) {
    console.error("Audio upload action error:", err);
    return { success: false, error: "Failed to upload audio" };
  }
}

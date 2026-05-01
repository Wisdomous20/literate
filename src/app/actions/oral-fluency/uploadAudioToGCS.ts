"use server";

import { uploadAudioSchema } from "@/lib/validation/media";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { uploadAudioService } from "@/service/media/uploadAudioService";

export async function uploadAudioToGCS(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const validationResult = uploadAudioSchema.safeParse({
      file: formData.get("file"),
      filePath: formData.get("filePath"),
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
    return { success: false, error: String(err) };
  }
}

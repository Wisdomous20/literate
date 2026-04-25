"use server";

import { storage, GCS_BUCKET } from "@/lib/gcs";
import { uploadAudioSchema } from "@/lib/validation/media";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

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

    const { file, filePath } = validationResult.data;

    console.log(`[GCS] Uploading: ${filePath}, size: ${file.size}, type: ${file.type}`);
    console.log(`[GCS] Bucket: ${GCS_BUCKET}`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucket = storage.bucket(GCS_BUCKET);
    const gcsFile = bucket.file(filePath);

    await gcsFile.save(buffer, {
      resumable: false,
      contentType: file.type || "audio/wav",
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });

    console.log(`[GCS] Upload successful: ${filePath}`);

    // Use public URL instead of signed URL
    const url = `https://storage.googleapis.com/${GCS_BUCKET}/${filePath}`;

    return { success: true, url };
  } catch (err) {
    console.error("GCS upload error:", err);
    return { success: false, error: String(err) };
  }
}

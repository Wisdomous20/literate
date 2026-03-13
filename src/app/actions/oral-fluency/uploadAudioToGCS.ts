"use server";

import { storage, GCS_BUCKET } from "@/lib/gcs";

export async function uploadAudioToGCS(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get("file") as File;
    const filePath = formData.get("filePath") as string;

    if (!file || !filePath) {
      return { success: false, error: "Missing file or filePath" };
    }

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

    // Generate a signed URL valid for 7 days (max practical for playback)
    const [signedUrl] = await gcsFile.getSignedUrl({
      action: "read",
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    return { success: true, url: signedUrl };
  } catch (err) {
    console.error("GCS upload error:", err);
    return { success: false, error: String(err) };
  }
}
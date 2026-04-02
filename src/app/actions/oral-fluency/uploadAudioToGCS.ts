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
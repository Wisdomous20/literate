import { storage, GCS_BUCKET } from "@/lib/gcs";

export interface UploadAudioInput {
  file: File;
  filePath: string;
}

export interface UploadAudioResult {
  success: boolean;
  url?: string;
  error?: string;
  code?: "VALIDATION_ERROR" | "INTERNAL_ERROR";
}

export async function uploadAudioService(
  input: UploadAudioInput,
): Promise<UploadAudioResult> {
  if (!input.file || !input.filePath) {
    return {
      success: false,
      error: "file and filePath are required.",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    console.log(
      `[GCS] Uploading: ${input.filePath}, size: ${input.file.size}, type: ${input.file.type}`,
    );

    const arrayBuffer = await input.file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const gcsFile = storage.bucket(GCS_BUCKET).file(input.filePath);

    await gcsFile.save(buffer, {
      resumable: false,
      contentType: input.file.type || "audio/wav",
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });

    console.log(`[GCS] Upload successful: ${input.filePath}`);

    return {
      success: true,
      url: `https://storage.googleapis.com/${GCS_BUCKET}/${input.filePath}`,
    };
  } catch (error) {
    console.error("GCS upload error:", error);
    return {
      success: false,
      error: "Failed to upload audio.",
      code: "INTERNAL_ERROR",
    };
  }
}

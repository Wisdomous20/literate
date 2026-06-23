import { storage, GCS_BUCKET } from "@/lib/gcs";
import { createAudioObjectPath } from "@/lib/media/audioObjectPath";

export interface UploadAudioInput {
  file: File;
}

export interface UploadAudioResult {
  success: boolean;
  audioObjectPath?: string;
  error?: string;
  code?: "VALIDATION_ERROR" | "INTERNAL_ERROR";
}

export async function uploadAudioService(
  input: UploadAudioInput,
): Promise<UploadAudioResult> {
  if (!input.file) {
    return {
      success: false,
      error: "file is required.",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const arrayBuffer = await input.file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioObjectPath = createAudioObjectPath(input.file.type);
    const gcsFile = storage.bucket(GCS_BUCKET).file(audioObjectPath);

    await gcsFile.save(buffer, {
      resumable: false,
      contentType: input.file.type || "audio/wav",
      preconditionOpts: { ifGenerationMatch: 0 },
      metadata: {
        cacheControl: "private, no-store",
      },
    });

    return {
      success: true,
      audioObjectPath,
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

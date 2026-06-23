import type { Readable } from "node:stream";
import { storage, GCS_BUCKET } from "@/lib/gcs";
import { resolveStoredAudioObjectPath } from "@/lib/media/audioObjectPath";

export const MAX_AUDIO_DOWNLOAD_BYTES = 50 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 20_000;

type AudioObjectMetadata = {
  size?: string | number;
  contentType?: string;
};

type AudioStorageFile = {
  getMetadata(): Promise<[AudioObjectMetadata]>;
  createReadStream(): Readable;
};

interface DownloadOptions {
  maxBytes?: number;
  getFile?: (objectPath: string) => AudioStorageFile;
}

function getDefaultFile(objectPath: string): AudioStorageFile {
  return storage.bucket(GCS_BUCKET).file(objectPath) as unknown as AudioStorageFile;
}

function readStreamWithinLimit(stream: Readable, maxBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    stream.on("data", (chunk: Buffer | Uint8Array | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buffer.length;

      if (totalBytes > maxBytes) {
        stream.destroy(new Error("Audio file exceeds the maximum download size."));
        return;
      }

      chunks.push(buffer);
    });
    stream.once("error", reject);
    stream.once("end", () => resolve(Buffer.concat(chunks)));
  });
}

export async function downloadTrustedAudio(
  audioLocation: string,
  options: DownloadOptions = {},
): Promise<Buffer> {
  const objectPath = resolveStoredAudioObjectPath(audioLocation);
  if (!objectPath) {
    throw new Error("Audio location is not an approved storage object.");
  }

  const maxBytes = options.maxBytes ?? MAX_AUDIO_DOWNLOAD_BYTES;
  const file = (options.getFile ?? getDefaultFile)(objectPath);
  const [metadata] = await file.getMetadata();

  const contentType = metadata.contentType?.toLowerCase() ?? "";
  if (!contentType.startsWith("audio/")) {
    throw new Error("Downloaded object is not an audio file.");
  }

  const contentLength = Number(metadata.size);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error("Audio file exceeds the maximum download size.");
  }

  const stream = file.createReadStream();
  const timeout = setTimeout(
    () => stream.destroy(new Error("Audio download timed out.")),
    DOWNLOAD_TIMEOUT_MS,
  );

  try {
    return await readStreamWithinLimit(stream, maxBytes);
  } finally {
    clearTimeout(timeout);
  }
}

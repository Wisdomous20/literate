import { isTrustedAudioUrl } from "@/lib/media/trustedAudioUrl";

export const MAX_AUDIO_DOWNLOAD_BYTES = 50 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 20_000;

interface DownloadOptions {
  fetchImpl?: typeof fetch;
  maxBytes?: number;
}

export async function downloadTrustedAudio(
  audioUrl: string,
  options: DownloadOptions = {},
): Promise<Buffer> {
  if (!isTrustedAudioUrl(audioUrl)) {
    throw new Error("Audio URL is not an approved storage object.");
  }

  const maxBytes = options.maxBytes ?? MAX_AUDIO_DOWNLOAD_BYTES;
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(audioUrl, {
    redirect: "error",
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.status}`);
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("audio/")) {
    throw new Error("Downloaded object is not an audio file.");
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error("Audio file exceeds the maximum download size.");
  }

  if (!response.body) {
    throw new Error("Audio response has no body.");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new Error("Audio file exceeds the maximum download size.");
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

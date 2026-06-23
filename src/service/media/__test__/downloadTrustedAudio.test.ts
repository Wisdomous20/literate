import { describe, expect, it, vi } from "vitest";
import { GCS_BUCKET } from "@/lib/media/storageBucket";
import { isTrustedAudioUrl } from "@/lib/media/trustedAudioUrl";
import { transcriptionRequestSchema } from "@/lib/validation/media";
import { downloadTrustedAudio } from "../downloadTrustedAudio";

const trustedUrl = `https://storage.googleapis.com/${GCS_BUCKET}/oral-fluency/recording.wav`;

describe("trusted audio URL policy", () => {
  it("accepts an audio object in the configured GCS bucket", () => {
    expect(isTrustedAudioUrl(trustedUrl)).toBe(true);
  });

  it.each([
    "http://storage.googleapis.com/cpuliterate-v2/oral-fluency/recording.wav",
    "https://storage.googleapis.com/another-bucket/oral-fluency/recording.wav",
    `https://storage.googleapis.com/${GCS_BUCKET}/other/recording.wav`,
    "https://169.254.169.254/latest/meta-data",
    "https://example.com/recording.wav",
  ])("rejects an untrusted audio URL: %s", (url) => {
    expect(isTrustedAudioUrl(url)).toBe(false);
  });

  it("rejects an external URL at the transcription request boundary", () => {
    const result = transcriptionRequestSchema.safeParse({
      assessmentId: "assessment-1",
      audioUrl: "https://example.com/recording.wav",
    });

    expect(result.success).toBe(false);
  });
});

describe("downloadTrustedAudio", () => {
  it("does not send a request for an untrusted URL", async () => {
    const fetchImpl = vi.fn();

    await expect(
      downloadTrustedAudio("https://example.com/audio.wav", { fetchImpl }),
    ).rejects.toThrow("not an approved storage object");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("downloads a bounded audio response without following redirects", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        headers: {
          "content-type": "audio/wav",
          "content-length": "3",
        },
      }),
    );

    await expect(downloadTrustedAudio(trustedUrl, { fetchImpl })).resolves.toEqual(
      Buffer.from([1, 2, 3]),
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      trustedUrl,
      expect.objectContaining({ redirect: "error", signal: expect.any(AbortSignal) }),
    );
  });

  it("rejects non-audio responses", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response("not audio", {
        headers: { "content-type": "text/html" },
      }),
    );

    await expect(downloadTrustedAudio(trustedUrl, { fetchImpl })).rejects.toThrow(
      "not an audio file",
    );
  });

  it("enforces the streamed size limit when content-length is absent", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3, 4]), {
        headers: { "content-type": "audio/wav" },
      }),
    );

    await expect(
      downloadTrustedAudio(trustedUrl, { fetchImpl, maxBytes: 3 }),
    ).rejects.toThrow("exceeds the maximum download size");
  });
});

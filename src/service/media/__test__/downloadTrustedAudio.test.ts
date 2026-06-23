import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import {
  isUploadedAudioObjectPath,
  resolveStoredAudioObjectPath,
} from "@/lib/media/audioObjectPath";
import { GCS_BUCKET } from "@/lib/media/storageBucket";
import { transcriptionRequestSchema } from "@/lib/validation/media";
import { downloadTrustedAudio } from "../downloadTrustedAudio";

const audioObjectPath = "oral-fluency/123e4567-e89b-12d3-a456-426614174000.wav";
const legacyUrl = `https://storage.googleapis.com/${GCS_BUCKET}/oral-fluency/legacy-recording.wav`;
const expiredLegacySignedUrl = `${legacyUrl}?GoogleAccessId=legacy%40example.com&Expires=1&Signature=expired`;

function audioFile(
  metadata: { contentType?: string; size?: string | number },
  chunks: Buffer[] = [Buffer.from([1, 2, 3])],
) {
  return {
    getMetadata: vi.fn().mockResolvedValue([metadata]),
    createReadStream: vi.fn(() => Readable.from(chunks)),
  };
}

describe("audio object path policy", () => {
  it("accepts opaque server-generated object paths", () => {
    expect(isUploadedAudioObjectPath(audioObjectPath)).toBe(true);
  });

  it.each([
    "oral-fluency/student-passage-123.wav",
    "oral-fluency/../../other.wav",
    "https://storage.googleapis.com/cpuliterate-v2/oral-fluency/recording.wav",
    "https://example.com/recording.wav",
  ])("rejects a client-supplied audio location: %s", (value) => {
    expect(isUploadedAudioObjectPath(value)).toBe(false);
  });

  it("accepts only opaque paths at the transcription request boundary", () => {
    const result = transcriptionRequestSchema.safeParse({
      assessmentId: "assessment-1",
      audioUrl: audioObjectPath,
    });

    expect(result.success).toBe(true);
  });

  it("keeps legacy records readable without accepting them in new requests", () => {
    expect(resolveStoredAudioObjectPath(legacyUrl)).toBe(
      "oral-fluency/legacy-recording.wav",
    );
    expect(resolveStoredAudioObjectPath(expiredLegacySignedUrl)).toBe(
      "oral-fluency/legacy-recording.wav",
    );
    expect(
      transcriptionRequestSchema.safeParse({
        assessmentId: "assessment-1",
        audioUrl: expiredLegacySignedUrl,
      }).success,
    ).toBe(false);
  });

  it("does not resolve signed URLs outside the configured bucket", () => {
    expect(
      resolveStoredAudioObjectPath(
        "https://storage.googleapis.com/another-bucket/oral-fluency/recording.wav?Expires=1",
      ),
    ).toBeNull();
  });
});

describe("downloadTrustedAudio", () => {
  it("does not access storage for an untrusted location", async () => {
    const getFile = vi.fn();

    await expect(
      downloadTrustedAudio("https://example.com/audio.wav", { getFile }),
    ).rejects.toThrow("not an approved storage object");
    expect(getFile).not.toHaveBeenCalled();
  });

  it("downloads a bounded audio object from its private GCS path", async () => {
    const file = audioFile({ contentType: "audio/wav", size: "3" });
    const getFile = vi.fn(() => file);

    await expect(downloadTrustedAudio(audioObjectPath, { getFile })).resolves.toEqual(
      Buffer.from([1, 2, 3]),
    );
    expect(getFile).toHaveBeenCalledWith(audioObjectPath);
    expect(file.createReadStream).toHaveBeenCalledOnce();
  });

  it("rejects non-audio stored objects", async () => {
    const getFile = vi.fn(() => audioFile({ contentType: "text/html", size: "3" }));

    await expect(downloadTrustedAudio(audioObjectPath, { getFile })).rejects.toThrow(
      "not an audio file",
    );
  });

  it("enforces the streamed size limit when metadata is absent", async () => {
    const getFile = vi.fn(() =>
      audioFile({ contentType: "audio/wav" }, [Buffer.from([1, 2, 3, 4])]),
    );

    await expect(
      downloadTrustedAudio(audioObjectPath, { getFile, maxBytes: 3 }),
    ).rejects.toThrow("exceeds the maximum download size");
  });
});

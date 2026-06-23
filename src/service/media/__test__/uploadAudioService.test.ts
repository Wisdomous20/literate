import { describe, expect, it, vi } from "vitest";

const mockSave = vi.hoisted(() => vi.fn());
const mockFile = vi.hoisted(() => vi.fn(() => ({ save: mockSave })));
const mockBucket = vi.hoisted(() => vi.fn(() => ({ file: mockFile })));

vi.mock("@/lib/gcs", () => ({
  GCS_BUCKET: "private-audio-bucket",
  storage: { bucket: mockBucket },
}));

import { uploadAudioService } from "../uploadAudioService";

describe("uploadAudioService", () => {
  it("mints an opaque private object path instead of using a client file name", async () => {
    mockSave.mockResolvedValue(undefined);
    const file = new File([new Uint8Array([1, 2, 3])], "client-controlled.wav", {
      type: "audio/wav",
    });

    const result = await uploadAudioService({ file });

    expect(result).toMatchObject({ success: true });
    expect(result.audioObjectPath).toMatch(
      /^oral-fluency\/[0-9a-f-]+\.wav$/,
    );
    expect(mockFile).toHaveBeenCalledWith(result.audioObjectPath);
    expect(mockSave).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({
        contentType: "audio/wav",
        preconditionOpts: { ifGenerationMatch: 0 },
        metadata: { cacheControl: "private, no-store" },
      }),
    );
  });
});

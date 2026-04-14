import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock fs so tests don't touch the real filesystem
vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(false),
    readFileSync: vi.fn(),
  },
  existsSync: vi.fn().mockReturnValue(false),
  readFileSync: vi.fn(),
}));

// Mock google-auth-library (used via dynamic import inside getAccessToken)
const mockGetAccessToken = vi.hoisted(() => vi.fn());
vi.mock("google-auth-library", () => ({
  GoogleAuth: vi.fn().mockImplementation(() => ({
    getClient: vi.fn().mockResolvedValue({
      getAccessToken: mockGetAccessToken,
    }),
  })),
}));

import { POST } from "../route";

// JSDOM hangs when a File object is used as a FormData body in NextRequest.
// Using plain strings avoids the serialization issue. The route calls
// file.arrayBuffer() on the File value, so we provide a string that mimics
// having a file present (truthiness check passes, arrayBuffer() is available
// on Blob which String is not — handled in the mock below).
function makeFormDataRequest(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  return new NextRequest("http://localhost/api/upload-audio", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/upload-audio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_CLOUD_CLIENT_EMAIL = "test@project.iam.gserviceaccount.com";
    process.env.GOOGLE_CLOUD_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nfakekey\n-----END PRIVATE KEY-----\n";
  });

  it("returns 400 when the file is missing", async () => {
    const req = makeFormDataRequest({ filePath: "audio/recording.wav" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Missing file or filePath/i);
  });

  it("returns 400 when filePath is missing", async () => {
    const req = makeFormDataRequest({ file: "recording.wav" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Missing file or filePath/i);
  });

  it("returns 500 when credentials are not available", async () => {
    delete process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
    delete process.env.GOOGLE_CLOUD_PRIVATE_KEY;

    const req = makeFormDataRequest({ file: "recording.wav", filePath: "audio/recording.wav" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

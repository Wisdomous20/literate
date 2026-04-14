import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock external dependencies ────────────────────────────────────────────────

const mockGetAccessToken = vi.hoisted(() => vi.fn());
const mockConvertToTranscriptResponse = vi.hoisted(() => vi.fn());
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock("google-auth-library", () => ({
  GoogleAuth: class {
    getClient() {
      return Promise.resolve({ getAccessToken: mockGetAccessToken });
    }
  },
}));

vi.mock("../convertToTranscriptResponse", () => ({
  default: mockConvertToTranscriptResponse,
}));

vi.mock("fs", () => ({
  default: { existsSync: vi.fn().mockReturnValue(false), readFileSync: vi.fn() },
  existsSync: vi.fn().mockReturnValue(false),
  readFileSync: vi.fn(),
}));

// Replace global fetch
global.fetch = mockFetch;

import { transcribeAudio } from "../googleSTTService";

// ── Helpers ───────────────────────────────────────────────────────────────────

const BYTES_PER_SECOND = 48000;
const WAV_HEADER = Buffer.alloc(44);

/** Build a WAV buffer for a given duration in seconds. */
function makeWavBuffer(durationSec: number): Buffer {
  return Buffer.concat([WAV_HEADER, Buffer.alloc(Math.round(durationSec * BYTES_PER_SECOND))]);
}

const fakeTranscriptResponse = {
  text: "the cat sat",
  segments: [],
  words: [],
  duration: 1.0,
};

function mockSuccessfulFetch(results = [{ alternatives: [{ transcript: "the cat sat", words: [] }] }]) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({ results }),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("transcribeAudio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAccessToken.mockResolvedValue({ token: "fake-token" });
    mockConvertToTranscriptResponse.mockReturnValue(fakeTranscriptResponse);
  });

  it("calls the STT REST API with a Bearer token", async () => {
    mockSuccessfulFetch();

    await transcribeAudio(makeWavBuffer(1), "audio.wav", "english");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Authorization"]).toMatch(/^Bearer /);
  });

  it("uses inline strategy for short audio (under 55 seconds)", async () => {
    mockSuccessfulFetch();

    await transcribeAudio(makeWavBuffer(30), "audio.wav", "english");

    // Inline = single fetch call
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("uses chunked strategy for long audio (over 55 seconds)", async () => {
    mockSuccessfulFetch();

    // 120 seconds → 3 chunks of 50s each (50 + 50 + 20)
    await transcribeAudio(makeWavBuffer(120), "audio.wav", "english");

    // Should be more than 1 fetch call
    expect(mockFetch.mock.calls.length).toBeGreaterThan(1);
  });

  it("maps 'english' language to en-US in the config", async () => {
    mockSuccessfulFetch();

    await transcribeAudio(makeWavBuffer(1), "audio.wav", "english");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.config.languageCodes).toContain("en-US");
  });

  it("maps 'tagalog' language to fil-PH in the config", async () => {
    mockSuccessfulFetch();

    await transcribeAudio(makeWavBuffer(1), "audio.wav", "tagalog");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.config.languageCodes).toContain("fil-PH");
  });

  it("defaults to en-US for unknown language codes", async () => {
    mockSuccessfulFetch();

    await transcribeAudio(makeWavBuffer(1), "audio.wav", "klingon");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.config.languageCodes).toContain("en-US");
  });

  it("includes passage adaptation phrases when passageText is provided", async () => {
    mockSuccessfulFetch();

    await transcribeAudio(makeWavBuffer(1), "audio.wav", "english", "the cat sat on the mat");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.config.adaptation).toBeDefined();
  });

  it("omits adaptation config when no passageText is provided", async () => {
    mockSuccessfulFetch();

    await transcribeAudio(makeWavBuffer(1), "audio.wav", "english");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.config.adaptation).toBeUndefined();
  });

  it("throws when the STT API returns a non-OK response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      text: vi.fn().mockResolvedValue("Permission denied"),
    });

    await expect(transcribeAudio(makeWavBuffer(1), "audio.wav", "english")).rejects.toThrow(
      "STT API error: 403",
    );
  });

  it("returns the result from convertToTranscriptResponse", async () => {
    mockSuccessfulFetch();

    const result = await transcribeAudio(makeWavBuffer(1), "audio.wav", "english");

    expect(result).toBe(fakeTranscriptResponse);
    expect(mockConvertToTranscriptResponse).toHaveBeenCalledOnce();
  });
});

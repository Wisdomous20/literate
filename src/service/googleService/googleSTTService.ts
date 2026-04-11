import { TranscriptResponse } from "@/types/oral-reading";
import convertToTranscriptResponse from "./convertToTranscriptResponse";
import { protos } from "@google-cloud/speech";
import fs from "fs";
import { GoogleAuth } from "google-auth-library";

const LOCATION = "asia-southeast1";
const WAV_HEADER_BYTES = 44;

// Updated for 24kHz sample rate: 24000 samples/s × 2 bytes/sample = 48000
const BYTES_PER_SECOND = 48000;

const CHUNK_DURATION_SEC = 50;
const CHUNK_BYTE_SIZE = CHUNK_DURATION_SEC * BYTES_PER_SECOND;
const INLINE_DURATION_LIMIT_SEC = 55;

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID ?? "";

// ── Auth ──────────────────────────────────────────────────

let authClient: GoogleAuth;

function getAuth(): GoogleAuth {
  if (authClient) return authClient;

  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFile && fs.existsSync(keyFile)) {
    const keyData = JSON.parse(fs.readFileSync(keyFile, "utf8"));
    console.log(`[STT] Using key file credentials, email: ${keyData.client_email}`);
    authClient = new GoogleAuth({
      credentials: {
        client_email: keyData.client_email,
        private_key: keyData.private_key,
      },
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
  } else {
    const client_email = process.env.GOOGLE_CLOUD_CLIENT_EMAIL ?? "";
    const private_key = (process.env.GOOGLE_CLOUD_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
    console.log(`[STT] Using env var credentials, email: ${client_email}`);
    authClient = new GoogleAuth({
      credentials: { client_email, private_key },
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
  }

  return authClient;
}

async function getAccessToken(): Promise<string> {
  const auth = getAuth();
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token!;
}

// ── Language / Config ─────────────────────────────────────

function getGoogleLanguageCode(language: string): string {
  const normalized = language.toLowerCase().trim();
  const languageMap: Record<string, string> = {
    english: "en-US",
    en: "en-US",
    tagalog: "fil-PH",
    tl: "fil-PH",
    filipino: "fil-PH",
    fil: "fil-PH",
  };
  return languageMap[normalized] ?? "en-US";
}

/**
 * Build the recognition config with tuned phrase boosting.
 *
 * Key changes from the old config:
 *
 * 1. Word boost lowered from 5 → 3. At 5 the model over-corrects real miscues
 *    to match passage words, hiding genuine reading errors.
 *
 * 2. Passage-level boost lowered from 20 → 6. At 20 on a 500-char string, the
 *    model hallucinated passage words even when the student said something
 *    completely different. 6 gives enough domain context without overriding
 *    what the model actually heard.
 *
 * 3. Passage snippet trimmed from 500 → 300 chars. Smaller payload = faster
 *    API processing, and the first 300 chars give enough context.
 *
 * 4. Word filter lowered from length > 3 → length > 1. Short function words
 *    like "the", "and", "was", "had" are exactly the words Chirp 2 struggles
 *    with on children's voices. The old filter excluded them entirely.
 *
 * 5. maxAlternatives set to 3 so we can pick the best hypothesis downstream.
 */
function buildConfig(languageCode: string, passageText?: string) {
  const config: Record<string, unknown> = {
    model: "chirp_2",
    languageCodes: [languageCode],
    autoDecodingConfig: {},
    features: {
      enableWordTimeOffsets: true,
      enableAutomaticPunctuation: false,
      enableWordConfidence: true,
      maxAlternatives: 3,
    },
  };

  if (passageText) {
    // Include words > 1 char so short function words get boosted too.
    // Cap at 150 to keep payload size reasonable.
    const uniqueWords = [
      ...new Set(passageText.split(/\s+/).filter((w) => w.length > 1)),
    ].slice(0, 150);

    config.adaptation = {
      phraseSets: [
        {
          inlinePhraseSet: {
            phrases: [
              // Per-word boost: moderate so real miscues still surface
              ...uniqueWords.map((word) => ({ value: word, boost: 3 })),
              // Passage context: enough to nudge domain recognition without
              // masking what the student actually said
              { value: passageText.slice(0, 300), boost: 6 },
            ],
          },
        },
      ],
    };
  }

  return config;
}

// ── REST-based transcription ──────────────────────────────

async function transcribeChunk(
  chunk: Buffer,
  config: Record<string, unknown>,
  recognizer: string,
  timeOffsetSec: number,
): Promise<protos.google.cloud.speech.v2.ISpeechRecognitionResult[]> {
  const token = await getAccessToken();
  const url = `https://${LOCATION}-speech.googleapis.com/v2/${recognizer}:recognize`;

  const body = JSON.stringify({
    config,
    content: chunk.toString("base64"),
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[STT] REST API error: ${response.status} ${errorText}`);
    throw new Error(`STT API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const results = (data.results ?? []) as protos.google.cloud.speech.v2.ISpeechRecognitionResult[];

  if (timeOffsetSec === 0) return results;

  // Shift word timestamps by the chunk's offset so all times are relative
  // to the start of the full recording
  return results.map((result) => ({
    ...result,
    alternatives: result.alternatives?.map((alt) => ({
      ...alt,
      words: alt.words?.map((word) => ({
        ...word,
        startOffset: word.startOffset
          ? {
              seconds: Number(word.startOffset.seconds ?? 0) + timeOffsetSec,
              nanos: word.startOffset.nanos ?? 0,
            }
          : word.startOffset,
        endOffset: word.endOffset
          ? {
              seconds: Number(word.endOffset.seconds ?? 0) + timeOffsetSec,
              nanos: word.endOffset.nanos ?? 0,
            }
          : word.endOffset,
      })),
    })),
  }));
}

// ── Public API ────────────────────────────────────────────

export async function transcribeAudio(
  audioBuffer: Buffer,
  fileName: string,
  language: string,
  passageText?: string,
): Promise<TranscriptResponse> {
  const languageCode = getGoogleLanguageCode(language);
  const recognizer = `projects/${PROJECT_ID}/locations/${LOCATION}/recognizers/_`;
  const config = buildConfig(languageCode, passageText);

  const estimatedDurationSec =
    (audioBuffer.length - WAV_HEADER_BYTES) / BYTES_PER_SECOND;

  const isLong = estimatedDurationSec > INLINE_DURATION_LIMIT_SEC;

  console.log(
    `[STT] Buffer: ${(audioBuffer.length / 1024).toFixed(1)}KB, ` +
      `duration: ~${estimatedDurationSec.toFixed(1)}s, ` +
      `strategy: ${isLong ? "chunked-parallel" : "inline"}`,
  );

  let allResults: protos.google.cloud.speech.v2.ISpeechRecognitionResult[];

  if (!isLong) {
    allResults = await transcribeChunk(audioBuffer, config, recognizer, 0);
  } else {
    const header = audioBuffer.subarray(0, WAV_HEADER_BYTES);
    const audioData = audioBuffer.subarray(WAV_HEADER_BYTES);

    const chunks: Buffer[] = [];
    const timeOffsets: number[] = [];

    for (let offset = 0; offset < audioData.length; offset += CHUNK_BYTE_SIZE) {
      chunks.push(
        Buffer.concat([
          header,
          audioData.subarray(offset, offset + CHUNK_BYTE_SIZE),
        ]),
      );
      timeOffsets.push(offset / BYTES_PER_SECOND);
    }

    console.log(
      `[STT] Splitting into ${chunks.length} parallel chunks (~${CHUNK_DURATION_SEC}s each)`,
    );
    const t0 = performance.now();

    const chunkResults = await Promise.all(
      chunks.map((chunk, i) =>
        transcribeChunk(chunk, config, recognizer, timeOffsets[i]),
      ),
    );

    console.log(
      `[STT] All chunks done in ${(performance.now() - t0).toFixed(0)}ms`,
    );
    allResults = chunkResults.flat();
  }

  const rawText = allResults
    .map((r) => r.alternatives?.[0]?.transcript ?? "")
    .join(" ")
    .trim();

  console.log(
    `[STT] Raw transcription (${allResults.length} results): "${rawText}"`,
  );

  if (passageText) {
    const passageWordCount = passageText.split(/\s+/).length;
    const transcribedWordCount = rawText
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    console.log(
      `[STT] Passage: ${passageWordCount} words, Transcribed: ${transcribedWordCount} words ` +
        `(${Math.round((transcribedWordCount / passageWordCount) * 100)}% coverage)`,
    );
  }

  return convertToTranscriptResponse(
    allResults,
    audioBuffer,
    true,
    passageText,
  );
}
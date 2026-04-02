import { v2, protos } from "@google-cloud/speech";
import { TranscriptResponse } from "@/types/oral-reading";
import convertToTranscriptResponse from "./convertToTranscriptResponse";
import fs from "fs";

const LOCATION = "asia-southeast1";

function createSpeechClient(): v2.SpeechClient {
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  // Option 1: Use mounted key file (Cloud Run)
  if (keyFile && fs.existsSync(keyFile)) {
    const keyData = JSON.parse(fs.readFileSync(keyFile, "utf8"));
    console.log(`[STT] Using key file: ${keyFile}, email: ${keyData.client_email}`);
    return new v2.SpeechClient({
      apiEndpoint: `${LOCATION}-speech.googleapis.com`,
      projectId: keyData.project_id,
      credentials: {
        client_email: keyData.client_email,
        private_key: keyData.private_key,
      },
    });
  }

  // Option 2: Use env vars (local dev)
  const client_email = process.env.GOOGLE_CLOUD_CLIENT_EMAIL ?? "";
  const private_key = (process.env.GOOGLE_CLOUD_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  console.log(`[STT] Using env var credentials, email: ${client_email}`);
  return new v2.SpeechClient({
    apiEndpoint: `${LOCATION}-speech.googleapis.com`,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: { client_email, private_key },
  });
}

const speechClient = createSpeechClient();
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID ?? "";

const WAV_HEADER_BYTES = 44;
const BYTES_PER_SECOND = 32000; // 16kHz, 16-bit, mono
const CHUNK_DURATION_SEC = 50;
const CHUNK_BYTE_SIZE = CHUNK_DURATION_SEC * BYTES_PER_SECOND;
const INLINE_DURATION_LIMIT_SEC = 55;

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

function buildConfig(
  languageCode: string,
  passageText?: string,
): protos.google.cloud.speech.v2.IRecognitionConfig {
  const config: protos.google.cloud.speech.v2.IRecognitionConfig = {
    model: "chirp_2",
    languageCodes: [languageCode],
    autoDecodingConfig: {},
    features: {
      enableWordTimeOffsets: true,
      enableAutomaticPunctuation: false,
      enableWordConfidence: true,
    },
  };

  if (passageText) {
    const uniqueWords = [
      ...new Set(passageText.split(/\s+/).filter((w) => w.length > 3)),
    ].slice(0, 200);

    config.adaptation = {
      phraseSets: [
        {
          inlinePhraseSet: {
            phrases: [
              ...uniqueWords.map((word) => ({ value: word, boost: 5 })),
              { value: passageText.slice(0, 500), boost: 20 },
            ],
          },
        },
      ],
    };
  }

  return config;
}

console.log(`[STT] GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
console.log(`[STT] Project ID: ${PROJECT_ID}`);

async function transcribeChunk(
  chunk: Buffer,
  config: protos.google.cloud.speech.v2.IRecognitionConfig,
  recognizer: string,
  timeOffsetSec: number,
): Promise<protos.google.cloud.speech.v2.ISpeechRecognitionResult[]> {
  const [response] = await speechClient.recognize({
    recognizer,
    config,
    content: chunk,
  });

  const results = (response.results ??
    []) as protos.google.cloud.speech.v2.ISpeechRecognitionResult[];

  if (timeOffsetSec === 0) return results;

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

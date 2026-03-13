import { v2, protos } from "@google-cloud/speech";
import { Storage } from "@google-cloud/storage";
import { TranscriptResponse} from "@/types/oral-reading";
import { randomUUID } from "crypto";
import convertToTranscriptResponse from "./convertToTranscriptResponse";

const LOCATION = "us-central1";

const credentials = {
  client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL ?? "",
  private_key: (process.env.GOOGLE_CLOUD_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
};

const speechClient = new v2.SpeechClient({
  apiEndpoint: `${LOCATION}-speech.googleapis.com`,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials,
});

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials,
});

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID ?? "";
const GCS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET ?? "cpuliterate";

/**
 * Maps passage language field to Google Speech BCP-47 language code.
 */
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
 * Upload audio buffer to GCS and return the gs:// URI.
 * Deletes automatically after transcription.
 */
async function uploadToGCS(
  audioBuffer: Buffer,
  fileName: string
): Promise<string> {
  const gcsFileName = `speech-temp/${randomUUID()}-${fileName}`;
  const bucket = storage.bucket(GCS_BUCKET);
  const file = bucket.file(gcsFileName);

  await file.save(audioBuffer, {
    resumable: false,
    contentType: fileName.endsWith(".wav") ? "audio/wav" : "audio/webm",
  });

  return `gs://${GCS_BUCKET}/${gcsFileName}`;
}

/**
 * Delete a temporary file from GCS.
 */
async function deleteFromGCS(gcsUri: string): Promise<void> {
  try {
    const path = gcsUri.replace(`gs://${GCS_BUCKET}/`, "");
    await storage.bucket(GCS_BUCKET).file(path).delete();
  } catch {
    // Ignore deletion errors — file may already be gone
  }
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  fileName: string,
  language: string,
  passageText?: string
): Promise<TranscriptResponse> {
  const languageCode = getGoogleLanguageCode(language);
  const isWav = fileName.toLowerCase().endsWith(".wav");

  const recognizer = `projects/${PROJECT_ID}/locations/${LOCATION}/recognizers/_`;

  const config: protos.google.cloud.speech.v2.IRecognitionConfig = {
    model: "chirp_2",
    languageCodes: [languageCode],
    features: {
      enableWordTimeOffsets: true,
      enableAutomaticPunctuation: false, // disable punctuation to avoid merging/dropping words
      enableWordConfidence: true, // helps debug which words are uncertain
    },
  };

  if (isWav) {
    config.autoDecodingConfig = {};
  } else {
    config.explicitDecodingConfig = {
      encoding: "WEBM_OPUS" as unknown as protos.google.cloud.speech.v2.ExplicitDecodingConfig.AudioEncoding,
      sampleRateHertz: 48000,
      audioChannelCount: 1,
    };
  }

    if (passageText) {
    const uniqueWords = [
      ...new Set(passageText.split(/\s+/).filter((w) => w.length > 0)),
    ];
    config.adaptation = {
      phraseSets: [
        {
          inlinePhraseSet: {
            phrases: uniqueWords.map((word) => ({ value: word, boost: 10 })),
          },
        },
      ],
    };
  }

  // Estimate audio duration
const estimatedDurationSec = isWav
  ? (audioBuffer.length - 44) / 32000  
  : audioBuffer.length / 6000;   

  let allResults: protos.google.cloud.speech.v2.ISpeechRecognitionResult[];

  if (estimatedDurationSec <= 55) {
    // Short audio: synchronous inline recognize
    const [response] = await speechClient.recognize({
      recognizer,
      config,
      content: audioBuffer,
    });
    allResults = (response.results ?? []) as protos.google.cloud.speech.v2.ISpeechRecognitionResult[];
  } else {
    // Long audio: upload to GCS → batchRecognize → clean up
    const gcsUri = await uploadToGCS(audioBuffer, fileName);

    try {
      const [operation] = await speechClient.batchRecognize({
        recognizer,
        config,
        files: [
          {
            uri: gcsUri,
          },
        ],
        recognitionOutputConfig: {
          inlineResponseConfig: {},
        },
       processingStrategy: "DYNAMIC_BATCHING" as unknown as protos.google.cloud.speech.v2.BatchRecognizeRequest.ProcessingStrategy,

      });

      const [response] = await operation.promise();

      // batchRecognize returns results keyed by GCS URI
      allResults = [];
      const batchResults = response.results ?? {};
      for (const key of Object.keys(batchResults)) {
        const fileResult = batchResults[key];
        if (fileResult?.transcript?.results) {
          allResults.push(
            ...(fileResult.transcript.results as protos.google.cloud.speech.v2.ISpeechRecognitionResult[])
          );
        }
      }
    } finally {
      await deleteFromGCS(gcsUri);
    }
  }

  // Log raw transcription for debugging omissions
  const rawText = allResults
    .map((r) => r.alternatives?.[0]?.transcript ?? "")
    .join(" ")
    .trim();
  console.log(`[STT] Raw transcription (${allResults.length} results, ~${Math.round(estimatedDurationSec)}s): "${rawText}"`);
  console.log(`[STT] Buffer size: ${(audioBuffer.length / 1024).toFixed(1)}KB, estimated duration: ${estimatedDurationSec.toFixed(1)}s, using: ${estimatedDurationSec <= 55 ? "inline" : "batch"}`);
  if (passageText) {
    const passageWordCount = passageText.split(/\s+/).length;
    const transcribedWordCount = rawText.split(/\s+/).filter(w => w.length > 0).length;
    console.log(`[STT] Passage words: ${passageWordCount}, Transcribed words: ${transcribedWordCount} (${Math.round(transcribedWordCount / passageWordCount * 100)}% coverage)`);
  }

  return convertToTranscriptResponse(allResults, audioBuffer, isWav, passageText);
}


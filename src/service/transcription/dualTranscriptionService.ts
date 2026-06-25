import type { TranscriptResponse } from "@/types/oral-reading";
import { transcribeAudio as transcribeWithGoogle } from "@/service/googleService/googleSTTService";
import { transcribeAudioWithOpenAI } from "./openAITranscriptionService";
import { reconcileTranscripts } from "./transcriptReconciliationService";

function fulfilledValue<T>(result: PromiseSettledResult<T>) {
  return result.status === "fulfilled" ? result.value : null;
}

function logRejectedProvider(provider: string, result: PromiseSettledResult<unknown>) {
  if (result.status === "fulfilled") return;
  console.warn(`[Transcription:${provider}] failed:`, result.reason);
}

export async function transcribeAudioWithConsensus(
  audioBuffer: Buffer,
  fileName: string,
  language: string,
  passageText?: string,
): Promise<TranscriptResponse> {
  const [googleResult, openAIResult] = await Promise.allSettled([
    transcribeWithGoogle(audioBuffer, fileName, language, passageText),
    transcribeAudioWithOpenAI(audioBuffer, fileName, language, passageText),
  ]);

  logRejectedProvider("google", googleResult);
  logRejectedProvider("openai", openAIResult);

  const google = fulfilledValue(googleResult);
  const openAI = fulfilledValue(openAIResult);

  if (google && openAI && passageText?.trim()) {
    console.log("[Transcription] Using reconciled Google + OpenAI transcript");
    return reconcileTranscripts(google, openAI, passageText);
  }

  if (google) {
    console.log("[Transcription] Using Google transcript");
    return google;
  }

  if (openAI) {
    console.log("[Transcription] Using OpenAI transcript");
    return openAI;
  }

  throw new Error("All transcription providers failed.");
}

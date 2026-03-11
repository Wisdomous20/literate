import { TranscriptWord, TranscriptResponse } from "@/types/oral-reading";
import { protos } from "@google-cloud/speech";
import correctWithPassage from "./correctWithPassage";

/**
 * Convert Google Speech-to-Text V2 results into the WhisperTranscriptResponse
 * format, applying passage-guided word correction for improved accuracy.
 */
export default function convertToTranscriptResponse(
  results: protos.google.cloud.speech.v2.ISpeechRecognitionResult[],
  audioBuffer: Buffer,
  isWav: boolean,
  passageText?: string
): TranscriptResponse {
  let allWords: TranscriptWord[] = [];
  let maxEndTime = 0;

  for (const result of results) {
    const alternative = result.alternatives?.[0];
    if (!alternative) continue;

    if (alternative.words) {
      for (const wordInfo of alternative.words) {
        const startSec = durationToSeconds(wordInfo.startOffset);
        const endSec = durationToSeconds(wordInfo.endOffset);

        allWords.push({
          word: wordInfo.word ?? "",
          start: startSec,
          end: endSec,
        });

        if (endSec > maxEndTime) {
          maxEndTime = endSec;
        }
      }
    }
  }

  // Apply passage-guided correction if passage text is available
  if (passageText && allWords.length > 0) {
    allWords = correctWithPassage(allWords, passageText);
  }

  const fullText = allWords.map((w) => w.word).join(" ").trim();

  let duration = maxEndTime;
  if (duration === 0 && isWav) {
    duration = Math.max(0, (audioBuffer.length - 44) / 32000);
  }

  // Build segments using time boundaries from original results
  // (word count may differ after merge/correction, so don't slice by count)
  const segments = [];
  let wordIdx = 0;

  for (let rIdx = 0; rIdx < results.length; rIdx++) {
    const alt = results[rIdx].alternatives?.[0];
    if (!alt?.words?.length) continue;

    const resultEndTime = durationToSeconds(
      alt.words[alt.words.length - 1].endOffset
    );

    const segmentWords: TranscriptWord[] = [];
    while (wordIdx < allWords.length && allWords[wordIdx].start <= resultEndTime) {
      segmentWords.push(allWords[wordIdx]);
      wordIdx++;
    }

    segments.push({
      id: rIdx,
      text: segmentWords.map((w) => w.word).join(" "),
      start: segmentWords.length > 0 ? segmentWords[0].start : 0,
      end: segmentWords.length > 0 ? segmentWords[segmentWords.length - 1].end : 0,
      words: segmentWords,
    });
  }

  // Assign any remaining words to the last segment
  if (wordIdx < allWords.length && segments.length > 0) {
    const remaining = allWords.slice(wordIdx);
    const lastSeg = segments[segments.length - 1];
    lastSeg.words.push(...remaining);
    lastSeg.text = lastSeg.words.map((w) => w.word).join(" ");
    lastSeg.end = remaining[remaining.length - 1].end;
  }

  return {
    text: fullText,
    segments,
    words: allWords,
    duration: Math.round(duration * 10) / 10,
  };
}

/**
 * Convert Google's protobuf Duration to seconds.
 */
function durationToSeconds(
  time: protos.google.protobuf.IDuration | string | null | undefined
): number {
  if (!time) return 0;

  if (typeof time === "string") {
    return parseFloat(time.replace("s", "")) || 0;
  }

  const seconds = Number(time.seconds ?? 0);
  const nanos = Number(time.nanos ?? 0);
  return seconds + nanos / 1e9;
}
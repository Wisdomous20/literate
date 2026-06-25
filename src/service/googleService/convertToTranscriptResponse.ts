import { TranscriptWord, TranscriptResponse } from "@/types/oral-reading";
import { protos } from "@google-cloud/speech";
import correctWithPassage from "./correctWithPassage";
import { areWordsEquivalent, normalizeWord, similarityRatio } from "@/utils/textUtils";
import { normalizeTranscriptionConfidence } from "@/utils/transcriptionConfidence";

const FALLBACK_WORD_DURATION_SECONDS = 0.2;

function hasUsableWordTiming(word: TranscriptWord) {
  return (
    Number.isFinite(word.start) &&
    Number.isFinite(word.end) &&
    word.start >= 0 &&
    word.end > word.start
  );
}

/**
 * Chirp can omit word offsets, which arrives in the REST response as a zero
 * start/end pair. Interpolate those gaps so downstream miscues can seek audio
 * instead of incorrectly pointing every affected word at the recording start.
 */
function repairMissingWordTimings(
  words: TranscriptWord[],
  audioDuration: number,
): TranscriptWord[] {
  const repaired = words.map((word) => ({ ...word }));
  const latestKnownEnd = repaired.reduce(
    (latest, word) =>
      hasUsableWordTiming(word) ? Math.max(latest, word.end) : latest,
    0,
  );
  const totalDuration = Math.max(audioDuration, latestKnownEnd);

  let index = 0;
  while (index < repaired.length) {
    if (hasUsableWordTiming(repaired[index])) {
      index += 1;
      continue;
    }

    const runStart = index;
    while (index < repaired.length && !hasUsableWordTiming(repaired[index])) {
      index += 1;
    }

    const runEnd = index;
    const priorEnd = runStart > 0 ? repaired[runStart - 1].end : 0;
    const nextStart = runEnd < repaired.length ? repaired[runEnd].start : null;
    const minimumEnd =
      priorEnd + (runEnd - runStart) * FALLBACK_WORD_DURATION_SECONDS;
    const availableEnd =
      nextStart !== null && nextStart > priorEnd
        ? nextStart
        : Math.max(totalDuration, minimumEnd);
    const wordDuration = (availableEnd - priorEnd) / (runEnd - runStart);

    for (let offset = 0; offset < runEnd - runStart; offset += 1) {
      const start = priorEnd + wordDuration * offset;
      repaired[runStart + offset] = {
        ...repaired[runStart + offset],
        start,
        end: start + wordDuration,
      };
    }
  }

  return repaired;
}

/**
 * Convert Google Speech-to-Text V2 results into our TranscriptResponse format.
 *
 * Key improvement: when maxAlternatives > 1, we now score each alternative
 * against the passage and pick the one that best matches what the student
 * was supposed to read. This catches cases where alternative[0] has a wrong
 * word but alternative[1] or [2] got it right.
 */
export default function convertToTranscriptResponse(
  results: protos.google.cloud.speech.v2.ISpeechRecognitionResult[],
  audioBuffer: Buffer,
  isWav: boolean,
  passageText?: string,
  language = "english",
): TranscriptResponse {
  const fallbackAudioDuration = isWav
    ? Math.max(0, (audioBuffer.length - 44) / 48000)
    : 0;
  const passageWords = passageText
    ? passageText.split(/\s+/).filter((w) => w.length > 0).map(normalizeWord)
    : [];

  let allWords: TranscriptWord[] = [];
  let maxEndTime = 0;

  for (const result of results) {
    // Pick the best alternative when we have passage context and multiple options
    const alternative = pickBestAlternative(result.alternatives ?? [], passageWords);
    if (!alternative) continue;

    if (alternative.words) {
      for (const wordInfo of alternative.words) {
        const startSec = durationToSeconds(wordInfo.startOffset);
        const endSec = durationToSeconds(wordInfo.endOffset);
        const confidence = normalizeTranscriptionConfidence(wordInfo.confidence);

        allWords.push({
          word: wordInfo.word ?? "",
          start: startSec,
          end: endSec,
          ...(confidence === undefined ? {} : { confidence }),
        });

        if (endSec > maxEndTime) {
          maxEndTime = endSec;
        }
      }
    }
  }

  // Apply passage-guided correction if passage text is available
  if (passageText && allWords.length > 0) {
    allWords = correctWithPassage(allWords, passageText, 0.55, language);
  }

  allWords = repairMissingWordTimings(allWords, fallbackAudioDuration);
  maxEndTime = allWords.reduce(
    (latest, word) => Math.max(latest, word.end),
    0,
  );

  const fullText = allWords.map((w) => w.word).join(" ").trim();

  let duration = maxEndTime;
  if (duration === 0 && isWav) {
    // 24kHz × 2 bytes = 48000 bytes per second
    duration = Math.max(0, (audioBuffer.length - 44) / 48000);
  }

  // Build segments using time boundaries from original results.
  // Word count may differ after merge/correction so we use time-based slicing.
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
 * Pick the best recognition alternative by scoring how well each one
 * matches the known passage words. If there's no passage context or only
 * one alternative, we just return the first one.
 *
 * The scoring works word-by-word: for each word in the alternative, we find
 * the best-matching passage word (by similarity ratio) and sum up the scores.
 * The alternative with the highest total score wins. This means an alternative
 * that got 8/10 words matching the passage beats one that got 6/10, even if
 * the 6/10 one had higher raw confidence from the STT model.
 */
function pickBestAlternative(
  alternatives: protos.google.cloud.speech.v2.ISpeechRecognitionAlternative[],
  passageWords: string[]
): protos.google.cloud.speech.v2.ISpeechRecognitionAlternative | null {
  if (!alternatives || alternatives.length === 0) return null;
  if (alternatives.length === 1 || passageWords.length === 0) {
    return alternatives[0];
  }

  let bestAlt = alternatives[0];
  let bestScore = -1;

  for (const alt of alternatives) {
    const words = alt.words ?? [];
    if (words.length === 0) continue;

    let score = 0;
    for (const wordInfo of words) {
      const spoken = normalizeWord(wordInfo.word ?? "");
      if (!spoken) continue;

      // Find the best matching passage word for this spoken word
      let bestMatch = 0;
      for (const pw of passageWords) {
        const sim = similarityRatio(spoken, pw);
        if (areWordsEquivalent(spoken, pw)) {
          bestMatch = 1;
          break;
        }

        if (sim > bestMatch) bestMatch = sim;
      }

      // Give a bonus for exact matches to strongly prefer alternatives
      // that nail the passage words
      score += bestMatch >= 1.0 ? 1.5 : bestMatch;
    }

    // Normalize by word count so we don't penalize shorter alternatives
    const normalized = words.length > 0 ? score / words.length : 0;

    if (normalized > bestScore) {
      bestScore = normalized;
      bestAlt = alt;
    }
  }

  return bestAlt;
}

function durationToSeconds(
  duration?: protos.google.protobuf.IDuration | string | null
): number {
  if (!duration) return 0;

  if (typeof duration === "string") {
    const match = duration.trim().match(/^(-?(?:\d+(?:\.\d+)?|\.\d+))s$/);
    if (!match) return 0;

    const seconds = Number(match[1]);
    return Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  }

  const seconds = Number(duration.seconds ?? 0);
  const nanos = Number(duration.nanos ?? 0);
  const totalSeconds = seconds + nanos / 1e9;

  return Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
}


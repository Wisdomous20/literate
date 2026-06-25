import type { AlignedWord, TranscriptResponse, TranscriptWord } from "@/types/oral-reading";
import { alignWords } from "@/service/oral-fluency/alignmentService";
import { areWordsEquivalent, normalizeWord, similarityRatio } from "@/utils/textUtils";

type Provider = "google" | "openai";

interface Candidate {
  provider: Provider;
  aligned: AlignedWord;
}

interface OrderedWord extends TranscriptWord {
  order: number;
}

function passageWordsFromText(passageText: string) {
  return passageText.split(/\s+/).filter((word) => word.length > 0).map(normalizeWord);
}

function toAlignmentWords(response: TranscriptResponse) {
  return response.words.map((word) => ({
    word: word.word,
    start: word.start,
    end: word.end,
    confidence: word.confidence,
  }));
}

function candidateScore(candidate: AlignedWord, expectedWord: string) {
  if (!candidate.spoken) return 0;
  if (areWordsEquivalent(candidate.spoken, expectedWord)) return 1;
  return similarityRatio(normalizeWord(candidate.spoken), normalizeWord(expectedWord));
}

function bestOpenAICandidates(alignedWords: AlignedWord[]) {
  const candidates = new Map<number, Candidate>();

  for (const aligned of alignedWords) {
    if (aligned.expectedIndex === null || !aligned.spoken || !aligned.expected) continue;

    const current = candidates.get(aligned.expectedIndex);
    if (
      !current ||
      candidateScore(aligned, aligned.expected) >
        candidateScore(current.aligned, current.aligned.expected ?? "")
    ) {
      candidates.set(aligned.expectedIndex, {
        provider: "openai",
        aligned,
      });
    }
  }

  return candidates;
}

function findPreviousTimedWord(
  expectedIndex: number,
  googleAlignedWords: AlignedWord[],
) {
  for (let index = googleAlignedWords.length - 1; index >= 0; index--) {
    const word = googleAlignedWords[index];
    if (
      word.expectedIndex !== null &&
      word.expectedIndex < expectedIndex &&
      word.spokenIndex !== null &&
      word.endTimestamp !== null
    ) {
      return word;
    }
  }

  return null;
}

function findNextTimedWord(
  expectedIndex: number,
  googleAlignedWords: AlignedWord[],
) {
  for (const word of googleAlignedWords) {
    if (
      word.expectedIndex !== null &&
      word.expectedIndex > expectedIndex &&
      word.spokenIndex !== null &&
      word.timestamp !== null
    ) {
      return word;
    }
  }

  return null;
}

function estimateRecoveredTiming(
  expectedIndex: number,
  googleAlignedWords: AlignedWord[],
  fallback: AlignedWord,
) {
  const previous = findPreviousTimedWord(expectedIndex, googleAlignedWords);
  const next = findNextTimedWord(expectedIndex, googleAlignedWords);

  if (
    previous?.endTimestamp !== null &&
    previous?.endTimestamp !== undefined &&
    next?.timestamp !== null &&
    next?.timestamp !== undefined &&
    next.timestamp > previous.endTimestamp
  ) {
    const gap = next.timestamp - previous.endTimestamp;
    const duration = Math.min(0.3, gap);
    return {
      start: previous.endTimestamp,
      end: previous.endTimestamp + duration,
    };
  }

  if (fallback.timestamp !== null && fallback.endTimestamp !== null) {
    return {
      start: fallback.timestamp,
      end: fallback.endTimestamp,
    };
  }

  const start = previous?.endTimestamp ?? next?.timestamp ?? 0;
  return {
    start,
    end: start + 0.2,
  };
}

function orderForRecoveredWord(
  expectedIndex: number,
  googleAlignedWords: AlignedWord[],
) {
  const previous = findPreviousTimedWord(expectedIndex, googleAlignedWords);
  if (previous?.spokenIndex !== null && previous?.spokenIndex !== undefined) {
    return previous.spokenIndex * 10 + 5;
  }

  const next = findNextTimedWord(expectedIndex, googleAlignedWords);
  if (next?.spokenIndex !== null && next?.spokenIndex !== undefined) {
    return next.spokenIndex * 10 - 5;
  }

  return expectedIndex * 10;
}

function shouldRecoverOmission(openAIAligned: AlignedWord, expectedWord: string) {
  return candidateScore(openAIAligned, expectedWord) >= 0.9;
}

function shouldReplaceGoogleWord(
  googleAligned: AlignedWord,
  openAIAligned: AlignedWord,
  expectedWord: string,
) {
  if (!googleAligned.spoken || !openAIAligned.spoken) return false;

  const googleScore = candidateScore(googleAligned, expectedWord);
  const openAIScore = candidateScore(openAIAligned, expectedWord);

  return openAIScore >= 0.95 && openAIScore - googleScore >= 0.25;
}

function buildResponse(
  words: TranscriptWord[],
  duration: number,
): TranscriptResponse {
  const text = words.map((word) => word.word).join(" ").trim();

  return {
    text,
    words,
    duration: Math.round(duration * 10) / 10,
    segments:
      words.length === 0
        ? []
        : [
            {
              id: 0,
              text,
              start: words[0].start,
              end: words[words.length - 1].end,
              words,
            },
          ],
  };
}

export function reconcileTranscripts(
  google: TranscriptResponse,
  openAI: TranscriptResponse,
  passageText: string,
): TranscriptResponse {
  const passageWords = passageWordsFromText(passageText);
  if (passageWords.length === 0 || openAI.words.length === 0) return google;
  if (google.words.length === 0) return openAI;

  const googleAligned = alignWords(passageWords, toAlignmentWords(google));
  const openAIAligned = alignWords(passageWords, toAlignmentWords(openAI));
  const openAICandidates = bestOpenAICandidates(openAIAligned);

  const orderedWords: OrderedWord[] = google.words.map((word, index) => ({
    ...word,
    order: index * 10,
  }));

  for (const googleWord of googleAligned) {
    if (googleWord.expectedIndex === null || !googleWord.expected) continue;

    const openAICandidate = openAICandidates.get(googleWord.expectedIndex)?.aligned;
    if (!openAICandidate?.spoken) continue;

    if (
      googleWord.match === "OMISSION" &&
      shouldRecoverOmission(openAICandidate, googleWord.expected)
    ) {
      const timing = estimateRecoveredTiming(
        googleWord.expectedIndex,
        googleAligned,
        openAICandidate,
      );

      orderedWords.push({
        word: openAICandidate.spoken,
        start: timing.start,
        end: timing.end,
        confidence: openAICandidate.confidence ?? undefined,
        order: orderForRecoveredWord(googleWord.expectedIndex, googleAligned),
      });
      continue;
    }

    if (
      googleWord.match === "MISMATCH" &&
      googleWord.spokenIndex !== null &&
      shouldReplaceGoogleWord(googleWord, openAICandidate, googleWord.expected)
    ) {
      const target = orderedWords.find(
        (word) => word.order === googleWord.spokenIndex! * 10,
      );

      if (target) {
        target.word = openAICandidate.spoken;
        target.confidence = googleWord.confidence ?? openAICandidate.confidence ?? undefined;
      }
    }
  }

  const words = orderedWords
    .sort((left, right) => left.order - right.order)
    .map(({ order: _order, ...word }) => word);

  return buildResponse(words, Math.max(google.duration, openAI.duration));
}

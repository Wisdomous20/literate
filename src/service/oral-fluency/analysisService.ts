import { OralFluencyAnalysis } from "@/types/oral-reading";
import { transcribeAudio } from "../googleService/googleSTTService";
import { alignWords } from "./alignmentService";
import { detectMiscues } from "./miscueDetectionService";
import { detectBehaviors } from "./behaviorDetectionService";
import { postCorrectTranscription } from "@/utils/postCorrectTranscription";
import { normalizeWordStrict as normalizeWord } from "@/utils/textUtils";

function computeOralFluencyScore(totalWords: number, totalMiscues: number): number {
  if (totalWords <= 0) return 0;
  const score = ((totalWords - totalMiscues) / totalWords) * 100;
  return Math.round(score * 10) / 10;
}

function classifyReadingLevel(oralFluencyScore: number): "INDEPENDENT" | "INSTRUCTIONAL" | "FRUSTRATION" {
  if (oralFluencyScore >= 97) return "INDEPENDENT";
  if (oralFluencyScore >= 90) return "INSTRUCTIONAL";
  return "FRUSTRATION";
}

export async function analyzeOralFluency(
  audioBuffer: Buffer,
  fileName: string,
  passageText: string,
  language: string
): Promise<OralFluencyAnalysis> {
  // 1. Transcribe
  const sttResult = await transcribeAudio(audioBuffer, fileName, language, passageText);

  // 2. Tokenize passage — keep BOTH original (with punctuation) and normalized forms
  const originalPassageWords = passageText
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const normalizedPassageWords = originalPassageWords.map(normalizeWord);

  const spokenWords = sttResult.words.map((w) => ({
    word: normalizeWord(w.word),
    originalWord: w.word,
    start: w.start,
    end: w.end,
  }));

  const correctedWords = postCorrectTranscription(
    spokenWords.map((w) => ({ word: w.word, start: w.start, end: w.end })),
    normalizedPassageWords
  );

  // 3. Align
  const alignedWords = alignWords(
    normalizedPassageWords,
    correctedWords.map((w) => ({ word: w.word, start: w.start, end: w.end }))
  );

  // 4. Detect miscues
  const miscues = detectMiscues(alignedWords, language);

  // 5. Detect behaviors — pass originalPassageWords so punctuation is accessible
  const behaviors = detectBehaviors(alignedWords, originalPassageWords);

  // 6. Metrics
  const duration = sttResult.duration;
  const totalWords = originalPassageWords.length;
  const exactMatches = alignedWords.filter((w) => w.match === "EXACT").length;
  const countedMiscues = miscues.filter((m) => !m.isSelfCorrected).length;
  const accuracy = totalWords > 0 ? (exactMatches / totalWords) * 100 : 0;
  const wordsPerMinute = duration > 0 ? (totalWords / duration) * 60 : 0;

  return {
    transcript: sttResult.text,
    wordsPerMinute: Math.round(wordsPerMinute * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
    totalWords,
    totalMiscues: countedMiscues,
    duration: Math.round(duration * 10) / 10,
    miscues,
    behaviors,
    alignedWords,
    oralFluencyScore: computeOralFluencyScore(totalWords, countedMiscues),
    classificationLevel: classifyReadingLevel(computeOralFluencyScore(totalWords, countedMiscues)),
  };
}
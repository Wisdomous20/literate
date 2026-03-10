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
  // 1. Transcribe with Whisper (language-aware)
  const whisperResult = await transcribeAudio(audioBuffer, fileName, language, passageText);

  //add layer to normalize passage words and transcribed words for better comparison (e.g. ignore punctuation, case, etc.)
  // 2. Tokenize passage

  const passageWords = passageText.split(/\s+/).filter((w) => w.length > 0);
  const normalizedPassageWords = passageWords.map(normalizeWord);

  const spokenWords = whisperResult.words.map((w) => ({
    word: normalizeWord(w.word),
    originalWord: w.word,
    start: w.start,
    end: w.end,
  }));

  const correctedWords = postCorrectTranscription(
    spokenWords.map((w) => ({ word: w.word, start: w.start, end: w.end })),
    normalizedPassageWords
  );

  // 3. Align passage ↔ spoken words
  const alignedWords = alignWords(
    normalizedPassageWords,
    correctedWords.map((w) => ({ word: w.word, start: w.start, end: w.end }))
  );
  
  // 4. Detect miscues (language-aware for edit distance)
  const miscues = detectMiscues(alignedWords, language);

  // 5. Detect behaviors (timing-based, language-independent)
  const behaviors = detectBehaviors(alignedWords);

  // 6. Calculate metrics
  const duration = whisperResult.duration;
  const totalWords = passageWords.length;
  const exactMatches = alignedWords.filter((w) => w.match === "EXACT").length;
  const countedMiscues = miscues.filter((m) => !m.isSelfCorrected).length;
  const accuracy = totalWords > 0 ? (exactMatches / totalWords) * 100 : 0;
  const wordsPerMinute = duration > 0 ? (totalWords / duration) * 60 : 0;

  return {
    transcript: whisperResult.text,
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
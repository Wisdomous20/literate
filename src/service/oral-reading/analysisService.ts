import { OralReadingAnalysis } from "@/types/oral-reading";
import { transcribeAudio } from "./whisperService";
import { alignWords } from "./alignmentService";
import { detectMiscues } from "./miscueDetectionService";
import { detectBehaviors } from "./behaviorDetectionService";

export async function analyzeOralReading(
  audioBuffer: Buffer,
  fileName: string,
  passageText: string,
  language: string
): Promise<OralReadingAnalysis> {
  // 1. Transcribe with Whisper (language-aware)
  const whisperResult = await transcribeAudio(audioBuffer, fileName, language);

  // 2. Tokenize passage
  const passageWords = passageText.split(/\s+/).filter((w) => w.length > 0);
  const spokenWords = whisperResult.words.map((w) => ({
    word: w.word,
    start: w.start,
    end: w.end,
  }));

  // 3. Align passage ↔ spoken words
  const alignedWords = alignWords(passageWords, spokenWords);

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
  };
}
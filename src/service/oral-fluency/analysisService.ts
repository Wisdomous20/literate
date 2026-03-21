import { OralFluencyAnalysis } from "@/types/oral-reading"
import { transcribeAudio } from "../googleService/googleSTTService"
import { alignWords } from "./alignmentService"
import { detectMiscues } from "./miscueDetectionService"
import { detectBehaviors } from "./behaviorDetectionService"
import { analyzePitch } from "./pitchAnalysisService"
import { postCorrectTranscription } from "@/utils/postCorrectTranscription"
import { normalizeWordStrict as normalizeWord } from "@/utils/textUtils"

function computeOralFluencyScore(totalWords: number, totalMiscues: number): number {
  if (totalWords <= 0) return 0
  return Math.round(((totalWords - totalMiscues) / totalWords) * 100 * 10) / 10
}

function classifyReadingLevel(score: number): "INDEPENDENT" | "INSTRUCTIONAL" | "FRUSTRATION" {
  if (score >= 97) return "INDEPENDENT"
  if (score >= 90) return "INSTRUCTIONAL"
  return "FRUSTRATION"
}

export async function analyzeOralFluency(
  audioBuffer: Buffer,
  fileName:    string,
  passageText: string,
  language:    string,
): Promise<OralFluencyAnalysis> {
  // 1. Run STT and pitch analysis — pitch is sync (~90ms) so start it first,
  //    then await STT which takes several seconds.
  const pitchAnalysis = analyzePitch(audioBuffer)
  const sttResult     = await transcribeAudio(audioBuffer, fileName, language, passageText)

  console.log(
    `[Pitch] coV:${pitchAnalysis.pitchCoV.toFixed(4)}`,
    `meanF0:${pitchAnalysis.meanF0}Hz`,
    `voiced:${pitchAnalysis.voicedFrames}/${pitchAnalysis.totalFrames}`,
  )

  // 2. Tokenize — keep originals (with punctuation) for behavior detection
  const originalPassageWords   = passageText.split(/\s+/).filter(w => w.length > 0)
  const normalizedPassageWords = originalPassageWords.map(normalizeWord)

  // 3. Normalize and post-correct spoken words
  const corrected = postCorrectTranscription(
    sttResult.words.map(w => ({ word: normalizeWord(w.word), start: w.start, end: w.end })),
    normalizedPassageWords,
  )

  // 4. Align
  const alignedWords = alignWords(
    normalizedPassageWords,
    corrected.map(w => ({ word: w.word, start: w.start, end: w.end })),
  )

  // 5. Detect miscues
  const miscues = detectMiscues(alignedWords, language)

  // 6. Detect behaviors — pass audioBuffer so ! and ? can use per-word pitch
  const behaviors = detectBehaviors(
    alignedWords,
    originalPassageWords,
    pitchAnalysis,
    audioBuffer,      // ← needed for ! and ? intonation check
  )

  // 7. Metrics
  const duration        = sttResult.duration
  const totalWords      = originalPassageWords.length
  const exactMatches    = alignedWords.filter(w => w.match === "EXACT").length
  const countedMiscues  = miscues.filter(m => !m.isSelfCorrected).length
  const accuracy        = totalWords > 0 ? (exactMatches / totalWords) * 100 : 0
  const wordsPerMinute  = duration > 0 ? (totalWords / duration) * 60 : 0
  const oralFluencyScore = computeOralFluencyScore(totalWords, countedMiscues)

  return {
    transcript:          sttResult.text,
    wordsPerMinute:      Math.round(wordsPerMinute * 10) / 10,
    accuracy:            Math.round(accuracy * 10) / 10,
    totalWords,
    totalMiscues:        countedMiscues,
    duration:            Math.round(duration * 10) / 10,
    miscues,
    behaviors,
    alignedWords,
    oralFluencyScore,
    classificationLevel: classifyReadingLevel(oralFluencyScore),
  }
}
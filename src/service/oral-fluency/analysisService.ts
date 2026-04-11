import { OralFluencyAnalysis } from "@/types/oral-reading"
import { transcribeAudio } from "../googleService/googleSTTService"
import { alignWords } from "./alignmentService"
import { phoneticPostCorrection } from "./phoneticPostCorrection"
import { detectMiscues } from "./miscueDetectionService"
import { detectBehaviors } from "./behaviorDetectionService"
import { analyzePitch } from "./pitchAnalysisService"
import { postCorrectTranscription } from "@/utils/postCorrectTranscription"
import { initPhoneticDict } from "@/utils/phoneticUtils"
import { normalizeWordStrict as normalizeWord } from "@/utils/textUtils"

// Load CMU dict once on first use
let dictLoaded = false;

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
  // Load the CMU pronunciation dictionary on first call.
  // Takes ~1s the first time, then cached in memory.
  if (!dictLoaded) {
    await initPhoneticDict()
    dictLoaded = true
  }

  // 1. Run STT and pitch analysis in parallel.
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

  // ── CORRECTION PIPELINE ──────────────────────────────────────────────────
  //
  //   Layer 0 (already ran): correctWithPassage inside convertToTranscriptResponse
  //     Catches: high-similarity spelling noise via alignment
  //
  //   Layer 1: postCorrectTranscription — edit-distance-1 corrections
  //     Catches: garbled tokens, single-char typos
  //
  //   Layer 2 (after alignment): phoneticPostCorrection
  //     Catches: STT contextual confusions that SOUND similar to the passage
  //     word. "these"→"this", "our"→"are", homophones like "their"→"there".
  //     Uses CMU Pronouncing Dictionary to compare actual phoneme sequences
  //     with relaxed similarity scoring. No hardcoded word list needed.
  //

  // 3. Normalize and correct edit-distance noise
  const normalized = sttResult.words.map(w => ({
    word: normalizeWord(w.word),
    start: w.start,
    end: w.end,
  }))

  const corrected = postCorrectTranscription(
    normalized,
    normalizedPassageWords,
  )

  // 4. Align spoken words against passage
  const rawAlignedWords = alignWords(
    normalizedPassageWords,
    corrected.map(w => ({ word: w.word, start: w.start, end: w.end })),
  )

  // 5. Phonetic post-correction: check each MISMATCH — if the spoken word
  //    sounds similar to the passage word (per CMU dict), the STT just picked
  //    the wrong spelling. Correct the word and flip to EXACT.
  const alignedWords = phoneticPostCorrection(rawAlignedWords)

  // 6. Detect miscues
  const miscues = detectMiscues(alignedWords, language)

  // 7. Detect behaviors
  const behaviors = await detectBehaviors(
    alignedWords,
    originalPassageWords,
    pitchAnalysis,
    audioBuffer,
  )

  // 8. Metrics
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
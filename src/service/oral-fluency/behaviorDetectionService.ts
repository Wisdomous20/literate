import { AlignedWord, BehaviorResult } from "@/types/oral-reading";
import { PitchAnalysis, isMonotonousPitch } from "./pitchAnalysisService";
import { FUNCTION_WORDS } from "./functionWords";

function getTimedWords(alignedWords: AlignedWord[]) {
  return alignedWords.filter(
    (w) =>
      w.timestamp !== null && w.endTimestamp !== null && w.match !== "OMISSION",
  );
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function coV(arr: number[]): number {
  if (arr.length < 2) return 0;
  const avg = mean(arr);
  if (avg === 0) return 0;
  const stdDev = Math.sqrt(
    arr.reduce((s, x) => s + (x - avg) ** 2, 0) / arr.length,
  );
  return stdDev / avg;
}

// ─── Word-by-word reading ─────────────────────────────────────────────────────

function detectWordByWordReading(
  alignedWords: AlignedWord[],
): BehaviorResult[] {
  const timedWords = getTimedWords(alignedWords);
  if (timedWords.length < 5) return [];

  const gaps: number[] = [];
  for (let i = 1; i < timedWords.length; i++) {
    const gap = timedWords[i].timestamp! - timedWords[i - 1].endTimestamp!;
    if (gap >= 0) gaps.push(gap);
  }
  if (gaps.length < 4) return [];

  const avgGap = mean(gaps);
  const gapCov = coV(gaps);
  const longRatio = gaps.filter((g) => g > 0.35).length / gaps.length;

  if (avgGap >= 0.4 && gapCov < 0.45 && longRatio > 0.6) {
    return [
      {
        behaviorType: "WORD_BY_WORD_READING",
        startIndex: timedWords[0].expectedIndex ?? 0,
        endIndex:
          timedWords[timedWords.length - 1].expectedIndex ??
          timedWords.length - 1,
        startTime: timedWords[0].timestamp,
        endTime: timedWords[timedWords.length - 1].endTimestamp,
        notes: `avgGap:${avgGap.toFixed(3)}s gapCoV:${gapCov.toFixed(3)} longRatio:${(longRatio * 100).toFixed(0)}%`,
      },
    ];
  }
  return [];
}



const SENTENCE_ENDING_RE = /[.!?]["'\u2019\u201D\)\]]*$/;

function detectMonotonousReading(
  alignedWords: AlignedWord[],
  originalPassageWords: string[],
  pitchAnalysis: PitchAnalysis | null,
): BehaviorResult[] {
  const timedWords = getTimedWords(alignedWords);
  if (timedWords.length < 6) return [];

  let votes = 0;
  const details: string[] = [];

  // Signal A: Pitch CoV from pitchfinder (2 votes — strongest signal)
  if (
    pitchAnalysis &&
    !pitchAnalysis.error &&
    pitchAnalysis.voicedFrames >= 5
  ) {
    details.push(`pitchCoV:${pitchAnalysis.pitchCoV.toFixed(4)}`);
    if (isMonotonousPitch(pitchAnalysis)) {
      votes += 2;
      details.push("signal:flat-pitch(+2)");
    }
  }

  // Signal B: Content/function word duration ratio
  const contentDurs: number[] = [];
  const funcDurs: number[] = [];
  for (const w of timedWords) {
    if (w.expectedIndex == null) continue;
    const raw = originalPassageWords[w.expectedIndex] ?? w.expected ?? "";
    const norm = raw.toLowerCase().replace(/[^a-z]/g, "");
    const dur = w.endTimestamp! - w.timestamp!;
    if (dur <= 0) continue;
    (FUNCTION_WORDS.has(norm) ? funcDurs : contentDurs).push(dur);
  }
  if (contentDurs.length >= 2 && funcDurs.length >= 2) {
    const ratio = mean(contentDurs) / mean(funcDurs);
    details.push(`contentFuncRatio:${ratio.toFixed(3)}`);
    if (ratio < 1.15) {
      votes++;
      details.push("signal:no-word-stress(+1)");
    }
  }

  // Signal C: Sentence-final lengthening
  const sentFinalDurs: number[] = [];
  const otherDurs: number[] = [];
  for (const w of timedWords) {
    if (w.expectedIndex == null) continue;
    const raw = originalPassageWords[w.expectedIndex] ?? w.expected ?? "";
    const dur = w.endTimestamp! - w.timestamp!;
    if (dur <= 0) continue;
    (SENTENCE_ENDING_RE.test(raw) ? sentFinalDurs : otherDurs).push(dur);
  }
  if (sentFinalDurs.length >= 2 && otherDurs.length > 0) {
    const ratio = mean(sentFinalDurs) / mean(otherDurs);
    details.push(`sentFinalRatio:${ratio.toFixed(3)}`);
    if (ratio < 1.3) {
      votes++;
      details.push("signal:no-sent-final-lengthening(+1)");
    }
  }

  // Signal D: Duration CoV
  const allDurs = timedWords
    .map((w) => w.endTimestamp! - w.timestamp!)
    .filter((d) => d > 0);
  if (allDurs.length >= 6) {
    const durCov = coV(allDurs);
    details.push(`durCoV:${durCov.toFixed(3)}`);
    if (durCov < 0.28) {
      votes++;
      details.push("signal:flat-word-durations(+1)");
    }
  }

  // Signal E: Gap CoV
  const gaps: number[] = [];
  for (let i = 1; i < timedWords.length; i++) {
    const gap = timedWords[i].timestamp! - timedWords[i - 1].endTimestamp!;
    if (gap >= 0) gaps.push(gap);
  }
  if (gaps.length >= 5) {
    const gapCov = coV(gaps);
    details.push(`gapCoV:${gapCov.toFixed(3)}`);
    if (gapCov < 0.45) {
      votes++;
      details.push("signal:flat-gap-durations(+1)");
    }
  }

  if (votes < 3) return [];

  return [
    {
      behaviorType: "MONOTONOUS_READING",
      startIndex: timedWords[0].expectedIndex ?? 0,
      endIndex:
        timedWords[timedWords.length - 1].expectedIndex ??
        timedWords.length - 1,
      startTime: timedWords[0].timestamp,
      endTime: timedWords[timedWords.length - 1].endTimestamp,
      notes: [`votes:${votes}/5`, ...details].join(" | "),
    },
  ];
}

// ─── Dismissal of punctuation ─────────────────────────────────────────────────
//
// Detection strategy split by punctuation type:
//
//   . ; :  → Timing-based: fluent readers pause after these marks.
//             Measurable as inter-word gap from Google STT timestamps.
//
//   ,      → Timing-based (shorter threshold): brief pause expected.
//
//   ! ?    → Pitch-based: these marks require intonation change, NOT just a pause.
//             A reader can "disregard" ! or ? by reading with flat pitch even
//             if they happen to pause. Detected by checking whether pitch rises
//             (for ?) or peaks (for !) around those words compared to the
//             overall mean F0. Requires pitchfinder per-word analysis.
//             Falls back gracefully if no pitch data or no word timestamps.

// Pause-based marks only — ! and ? removed from here
const PAUSE_THRESHOLDS: Record<string, number> = {
  ".": 0.35,
  ",": 0.2,
  ";": 0.3,
  ":": 0.3,
};

// Regex for marks that need only a pause check
const PAUSE_PUNCT_RE = /([.,;:])["'\u2019\u201D\)\]]*$/;
// Regex for marks that need a pitch check
const PITCH_PUNCT_RE = /([!?])["'\u2019\u201D\)\]]*$/;

// How much the pitch must change (relative to overall mean) to count as intonation
// > 0.05 = 5% rise/change → reader acknowledged the mark
const INTONATION_CHANGE_THRESHOLD = 0.05;
const MIN_PITCH_PUNCT_OPPORTUNITIES = 2;

async function detectPunctuationDismissal(
  alignedWords: AlignedWord[],
  originalPassageWords: string[],
  pitchAnalysis: PitchAnalysis | null,
  audioBuffer?: Buffer,
): Promise<BehaviorResult[]> {
  // ── Part 1: Pause-based detection for . , ; : ──────────────────────────
  let pauseDismissed = 0;
  let pauseTotal = 0;
  const dismissedPauseDetails: string[] = [];
  const dismissedPitchDetails: string[] = [];

  for (let i = 0; i < alignedWords.length - 1; i++) {
    const curr = alignedWords[i];
    const next = alignedWords[i + 1];

    if (curr.endTimestamp == null || next.timestamp == null) continue;
    if (curr.match === "OMISSION" || curr.expectedIndex == null) continue;

    const raw = originalPassageWords[curr.expectedIndex] ?? "";
    const m = raw.match(PAUSE_PUNCT_RE);
    if (!m) continue;

    const threshold = PAUSE_THRESHOLDS[m[1]];
    if (threshold == null) continue;

    pauseTotal++;

    if (next.timestamp - curr.endTimestamp < threshold) {
      pauseDismissed++;

      dismissedPauseDetails.push(
        `${raw} (gap=${(next.timestamp - curr.endTimestamp).toFixed(3)}s < ${threshold}s)`,
      );
    }
  }

  const pauseDismissed_ratio = pauseTotal > 0 ? pauseDismissed / pauseTotal : 0;

  // ── Part 2: Pitch-based detection for ! and ? 
  let pitchDismissed = 0;
  let pitchTotal = 0;

  // Only attempt if we have pitch data AND word-level timestamps AND audio
  const canCheckPitch =
    pitchAnalysis != null &&
    !pitchAnalysis.error &&
    pitchAnalysis.meanF0 > 0 &&
    audioBuffer != null;

  if (canCheckPitch) {
    const SAMPLE_RATE = 16_000;
    const FRAME_SIZE = 512;
    const HOP_SIZE = 128;
    const MIN_F0 = 60,
      MAX_F0 = 600;

    // Lazy-load pitchfinder — only when needed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { YIN } = await import("pitchfinder");

    // Convert WAV buffer to float32 once
    const PCM_OFFSET = 44;
    const numSamples = (audioBuffer!.length - PCM_OFFSET) / 2;
    const signal = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      signal[i] = audioBuffer!.readInt16LE(PCM_OFFSET + i * 2) / 32_768;
    }

    const overallMeanF0 = pitchAnalysis!.meanF0;

    for (let i = 0; i < alignedWords.length; i++) {
      const curr = alignedWords[i];
      if (curr.match === "OMISSION" || curr.expectedIndex == null) continue;
      if (curr.timestamp == null || curr.endTimestamp == null) continue;

      const raw = originalPassageWords[curr.expectedIndex] ?? "";
      if (!PITCH_PUNCT_RE.test(raw)) continue;

      pitchTotal++;

      // Extract signal window: word + 300ms after (pitch tail)
      const startSample = Math.max(0, Math.floor(curr.timestamp * SAMPLE_RATE));
      const endSample = Math.min(
        signal.length,
        Math.floor((curr.endTimestamp + 0.3) * SAMPLE_RATE),
      );

      if (endSample - startSample < FRAME_SIZE) {
        // Window too short — skip, don't count as dismissed
        pitchTotal--;
        continue;
      }

      const window = signal.slice(startSample, endSample);
      const detect = YIN({ sampleRate: SAMPLE_RATE, threshold: 0.15 });
      const pitches: number[] = [];

      for (let j = 0; j + FRAME_SIZE <= window.length; j += HOP_SIZE) {
        const p = detect(window.slice(j, j + FRAME_SIZE));
        if (p && p > MIN_F0 && p < MAX_F0) pitches.push(p);
      }

      if (pitches.length < 4) {
        // Not enough voiced frames in this window
        pitchTotal--;
        continue;
      }

      // Compare first half vs second half pitch:
      // A rising or changing pitch = reader acknowledged the mark
      const half = Math.floor(pitches.length / 2);
      const firstMean = mean(pitches.slice(0, half));
      const lastMean = mean(pitches.slice(half));
      const relChange = Math.abs(lastMean - firstMean) / overallMeanF0;

      if (relChange <= INTONATION_CHANGE_THRESHOLD) {
        pitchDismissed++;

        dismissedPitchDetails.push(
          `${raw} (Δpitch=${relChange.toFixed(3)} ≤ ${INTONATION_CHANGE_THRESHOLD})`,
        );
      }
    }
  }

  const pauseFired = pauseTotal >= 3 && pauseDismissed_ratio > 0.5;
  const pitchFired =
    pitchTotal >= MIN_PITCH_PUNCT_OPPORTUNITIES &&
    pitchDismissed / pitchTotal > 0.5;

  if (!pauseFired && !pitchFired) return [];

  const details: string[] = [];
  if (pauseTotal > 0) {
    details.push(
      `pause:${pauseDismissed}/${pauseTotal}(${Math.round(pauseDismissed_ratio * 100)}%)`,
    );
  }
  if (pitchTotal > 0) {
    details.push(`intonation:${pitchDismissed}/${pitchTotal}`);
  }
  if (!canCheckPitch && pitchTotal === 0) {
    details.push("intonation:not-checked(no-pitch-data)");
  }

  if (pauseDismissed > 0) {
    console.log(" Pause-based dismissed punctuation:");
    dismissedPauseDetails.forEach((d) => console.log("  -", d));
  }

  if (pitchDismissed > 0) {
    console.log(" Pitch-based dismissed punctuation (! ?):");
    dismissedPitchDetails.forEach((d) => console.log("  -", d));
  }

  return [
    {
      behaviorType: "DISMISSAL_OF_PUNCTUATION",
      startIndex: null,
      endIndex: null,
      startTime: null,
      endTime: null,
      notes: details.join(" | "),
    },
  ];
}


export async function detectBehaviors(
  alignedWords: AlignedWord[],
  originalPassageWords: string[] = [],
  pitchAnalysis: PitchAnalysis | null = null,
  audioBuffer?: Buffer,
): Promise<BehaviorResult[]> {
  const punctDismissal = await detectPunctuationDismissal(
    alignedWords,
    originalPassageWords,
    pitchAnalysis,
    audioBuffer,
  );

  return [
    ...detectWordByWordReading(alignedWords),
    ...detectMonotonousReading(
      alignedWords,
      originalPassageWords,
      pitchAnalysis,
    ),
    ...punctDismissal,
  ];
}

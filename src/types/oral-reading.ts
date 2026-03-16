export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptSegment {
  id: number;
  text: string;
  start: number;
  end: number;
  words: TranscriptWord[];
}

export interface TranscriptResponse {
  text: string;
  segments: TranscriptSegment[];
  words: TranscriptWord[];
  duration: number;
}

export interface MiscueResult {
  miscueType:
    | "OMISSION"
    | "MISPRONUNCIATION"
    | "SUBSTITUTION"
    | "REVERSAL"
    | "TRANSPOSITION"
    | "INSERTION"
    | "SELF_CORRECTION"
    | "REPETITION";
  expectedWord: string;
  spokenWord: string | null;
  wordIndex: number;
  wordIndexB?: number | null; 
  timestamp: number | null;
  isSelfCorrected: boolean;
}

export interface BehaviorResult {
  behaviorType:
    | "WORD_BY_WORD_READING"
    | "MONOTONOUS_READING"
    | "DISMISSAL_OF_PUNCTUATION";
  startIndex: number | null;
  endIndex: number | null;
  startTime: number | null;
  endTime: number | null;
  notes: string | null;
}

export interface AlignedWord {
  expected: string | null;
  spoken: string | null;
  expectedIndex: number | null;
  spokenIndex: number | null;
  timestamp: number | null;
  endTimestamp: number | null;
  confidence: number | null;
  match: "EXACT" | "MISMATCH" | "OMISSION" | "INSERTION";
}

export interface OralFluencyAnalysis {
  transcript: string;
  wordsPerMinute: number;
  accuracy: number;
  totalWords: number;
  totalMiscues: number;
  duration: number;
  classificationLevel: "INDEPENDENT" | "INSTRUCTIONAL" | "FRUSTRATION";
  oralFluencyScore: number;

  miscues: MiscueResult[];
  behaviors: BehaviorResult[];
  alignedWords: AlignedWord[];
}

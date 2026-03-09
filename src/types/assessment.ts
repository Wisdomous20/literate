export type LevelClassification = "INDEPENDENT" | "INSTRUCTIONAL" | "FRUSTRATION";
export type AssessmentType = "ORAL_READING" | "COMPREHENSION" | "READING_FLUENCY";
export type MiscueType =
  | "OMISSION"
  | "MISPRONUNCIATION"
  | "SUBSTITUTION"
  | "REVERSAL"
  | "TRANSPOSITION"
  | "INSERTION"
  | "SELF_CORRECTION"
  | "REPETITION";
export type BehaviorType =
  | "WORD_BY_WORD_READING"
  | "MONOTONOUS_READING"
  | "DISMISSAL_OF_PUNCTUATION";

export interface AssessmentQuestion {
  id: string;
  tags: "Literal" | "Inferential" | "Critical";
  questionText: string;
  type: string;
}

export interface ComprehensionAnswer {
  id: string;
  questionId: string;
  question: AssessmentQuestion;
  isCorrect: boolean | null;
}

export interface ComprehensionData {
  id: string;
  score: number;
  totalItems: number;
  classificationLevel: LevelClassification;
  quiz?: { id: string; totalScore: number; totalNumber: number };
  answers: ComprehensionAnswer[];
}

export interface OralFluencyMiscue {
  id: string;
  miscueType: MiscueType;
  expectedWord: string;
  spokenWord?: string | null;
  wordIndex: number;
  isSelfCorrected: boolean;
}

export interface OralFluencyBehaviorData {
  id: string;
  behaviorType: BehaviorType;
}

export interface OralFluencyData {
  id: string;
  audioUrl: string;
  transcript?: string | null;
  wordsPerMinute?: number | null;
  accuracy?: number | null;
  totalWords?: number | null;
  totalMiscues?: number | null;
  duration?: number | null;
  oralFluencyScore?: number | null;
  classificationLevel?: LevelClassification | null;
  miscues: OralFluencyMiscue[];
  behaviors: OralFluencyBehaviorData[];
}

export interface OralReadingResultData {
  id: string;
  fluencyLevel: LevelClassification;
  comprehensionLevel: LevelClassification;
  classificationLevel: LevelClassification;
}

export interface PassageData {
  id: string;
  title: string;
  language: string;
  level: number;
  content?: string;
  testType?: string;
}

export interface AssessmentStudentData {
  id: string;
  name: string;
  level?: number;
}

export interface AssessmentData {
  id: string;
  studentId: string;
  passageId: string;
  dateTaken: string;
  type: AssessmentType;
  student: AssessmentStudentData;
  passage: PassageData;
  oralFluency?: OralFluencyData | null;
  comprehension?: ComprehensionData | null;
  oralReadingResult?: OralReadingResultData | null;
}

export interface AssessmentTableRow {
  attempt: number;
  assessmentType: string;
  testType: string;
  assessmentDate: string;
  schoolYear: string;
  id: string;
  type: AssessmentType;
}

export interface StudentTableItem {
  id: string;
  name: string;
  gradeLevel: string;
  lastAssessment: string | null;
  assessmentType: string;
}

export interface AssessmentCard {
  id: string;
  title: string;
  percentage: number;
  level: string;
}

/** Determine overall level: the lowest of fluency and comprehension */
export function computeFinalClassification(
  fluencyLevel?: LevelClassification | null,
  comprehensionLevel?: LevelClassification | null,
): string {
  if (!fluencyLevel && !comprehensionLevel) return "";
  if (!fluencyLevel) return comprehensionLevel ?? "";
  if (!comprehensionLevel) return fluencyLevel;

  const rank: Record<LevelClassification, number> = {
    FRUSTRATION: 0,
    INSTRUCTIONAL: 1,
    INDEPENDENT: 2,
  };

  return rank[fluencyLevel] <= rank[comprehensionLevel]
    ? fluencyLevel
    : comprehensionLevel;
}
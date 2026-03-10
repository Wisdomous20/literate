import { LevelClassification } from "@/generated/prisma/enums";

export interface OralReadingStudent {
  id: string;
  name: string;
}

export interface OralReadingPassage {
  id: string;
  title: string;
  language: string;
  level: number;
}

export interface OralReadingFluency {
  id: string;
  wordsPerMinute: number;
  accuracy: number;
  totalWords: number;
  totalMiscues: number;
  oralFluencyScore: number;
  classificationLevel: LevelClassification | null;
  duration: number;
}

export interface OralReadingComprehension {
  id: string;
  score: number;
  totalItems: number;
  classificationLevel: LevelClassification;
}

export interface OralReadingAssessment {
  id: string;
  student: OralReadingStudent;
  passage: OralReadingPassage;
  oralFluency: OralReadingFluency | null;
  comprehension: OralReadingComprehension | null;
}

export interface OralReadingResultData {
  id: string;
  assessmentId: string;
  fluencyLevel: LevelClassification;
  comprehensionLevel: LevelClassification;
  classificationLevel: LevelClassification;
  createdAt: Date;
  updatedAt: Date;
  assessment: OralReadingAssessment;
  success: boolean;
  error?: string;
  code?: "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR";
}

export type OralReadingSuccess = {
  success: true;
  oralReadingResult: OralReadingResultData;
};

export type OralReadingListSuccess = {
  success: true;
  oralReadingResults: OralReadingResultData[];
};

export type OralReadingError = {
  success: false;
  error: string;
  code: string;
};

export type OralReadingList = OralReadingListSuccess | OralReadingError;

export type OralReading =
  | { success: true; oralReadingResult: OralReadingResultData }
  | { success: false; error: string; code: string };
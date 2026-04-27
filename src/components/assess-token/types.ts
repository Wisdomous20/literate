"use client";

export interface AssessmentLinkData {
  assessmentId: string;
  type: "ORAL_READING" | "COMPREHENSION" | "READING_FLUENCY";
  expiresAt: string;
  student: { id: string; name: string; level?: number };
  passage: {
    id: string;
    title: string;
    content: string;
    language: string;
    level: number;
    testType: string;
    quiz?: {
      id: string;
      questions: {
        id: string;
        questionText: string;
        tags: string;
        type: string;
        options?: string[];
      }[];
    };
  };
}

export interface TagBreakdown {
  literal: { correct: number; total: number };
  inferential: { correct: number; total: number };
  critical: { correct: number; total: number };
}

export interface ComprehensionResult {
  score: number;
  totalItems: number;
  level: string;
  comprehensionTestId: string;
  tagBreakdown?: TagBreakdown;
}

export interface FluencyResult {
  wcpm: number;
  readingTimeSeconds: number;
  classificationLevel: string;
  totalWords: number;
  totalMiscues: number;
  oralFluencyScore: number;
  miscueBreakdown: Record<string, number>;
  behaviors: string[];
}

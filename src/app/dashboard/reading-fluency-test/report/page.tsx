"use client";

import { useState, useEffect } from "react";
import ReportHeader from "@/components/reading-fluency-test/report/reportHeader";
import StudentInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/studentInfoCard";
import PassageInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/passageInfoCard";
import MetricCards from "@/components/reports/oral-reading-test/reading-fluency-report/metricCards";
import MiscueAnalysisReport from "@/components/reports/oral-reading-test/reading-fluency-report/miscueAnalysis";
import AudioPlaybackCard from "@/components/reports/oral-reading-test/reading-fluency-report/audioPlaybackCard";
import BehaviorChecklist from "@/components/reports/oral-reading-test/reading-fluency-report/readingBehaviorChecklist";
import type { MiscueData } from "@/components/reports/oral-reading-test/reading-fluency-report/miscueAnalysis";
import type { BehaviorItem } from "@/components/reports/oral-reading-test/reading-fluency-report/readingBehaviorChecklist";
import type {
  OralFluencyAnalysis,
  MiscueResult,
  BehaviorResult,
} from "@/types/oral-reading";

const STORAGE_KEY = "reading-fluency-session";
const AUDIO_STORAGE_KEY = "reading-fluency-audio";

function base64ToBlob(base64: string): Blob {
  const [meta, data] = base64.split(",");
  const mimeMatch = meta.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "audio/webm";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

interface SessionState {
  studentName: string;
  gradeLevel: string;
  selectedClassName: string;
  passageContent: string;
  selectedLanguage?: string;
  selectedLevel?: string;
  selectedTestType?: string;
  selectedTitle?: string;
  recordedSeconds: number;
  analysisResult?: OralFluencyAnalysis | null;
  sessionId?: string;
}

function loadSession(): Partial<SessionState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load session:", err);
  }
  return {};
}

function countMiscuesByType(miscues: MiscueResult[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of miscues) {
    counts[m.miscueType] = (counts[m.miscueType] || 0) + 1;
  }
  return counts;
}

function buildMiscueData(
  analysis: OralFluencyAnalysis | null | undefined,
): MiscueData {
  if (!analysis) {
    return {
      mispronunciation: 0,
      omission: 0,
      substitution: 0,
      transposition: 0,
      reversal: 0,
      insertion: 0,
      repetition: 0,
      selfCorrection: 0,
      totalMiscue: 0,
      oralFluencyScore: "—",
      classificationLevel: "—",
    };
  }

  const counts = countMiscuesByType(analysis.miscues);

  return {
    mispronunciation: counts["MISPRONUNCIATION"] || 0,
    omission: counts["OMISSION"] || 0,
    substitution: counts["SUBSTITUTION"] || 0,
    transposition: counts["TRANSPOSITION"] || 0,
    reversal: counts["REVERSAL"] || 0,
    insertion: counts["INSERTION"] || 0,
    repetition: counts["REPETITION"] || 0,
    selfCorrection: counts["SELF_CORRECTION"] || 0,
    totalMiscue: analysis.totalMiscues,
    oralFluencyScore: `${analysis.oralFluencyScore}%`,
    classificationLevel: analysis.classificationLevel,
  };
}

function buildBehaviorItems(
  analysis: OralFluencyAnalysis | null | undefined,
): BehaviorItem[] {
  const detectedTypes = new Set(
    (analysis?.behaviors || []).map((b: BehaviorResult) => b.behaviorType),
  );

  return [
    {
      label: "Does word-by-word reading",
      description: "(Nagbabasa nang pa-isa isang salita)",
      checked: detectedTypes.has("WORD_BY_WORD_READING"),
    },
    {
      label: "Lacks expression: reads in a monotonous tone",
      description: "(Walang damdamin; walang pagbabago ang tono)",
      checked: detectedTypes.has("MONOTONOUS_READING"),
    },
    {
      label: "Disregards Punctuation",
      description: "(Hindi pinapansin ang mga bantas)",
      checked: detectedTypes.has("DISMISSAL_OF_PUNCTUATION"),
    },
    {
      label: "Employs little or no method of analysis",
      description: "(Bahagya o walang paraan ng pagsusuri)",
    },
  ];
}

export default function OralReadingReportPage() {
  const session = loadSession();
  const analysis = session.analysisResult;

  const [audioSrc] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const audioBase64 = sessionStorage.getItem(AUDIO_STORAGE_KEY);
      if (!audioBase64) return null;
      const blob = base64ToBlob(audioBase64);
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error("Failed to load audio from sessionStorage:", err);
      return null;
    }
  });

  useEffect(() => {
    return () => {
      if (audioSrc) URL.revokeObjectURL(audioSrc);
    };
  }, [audioSrc]);

  const studentName = session.studentName || "—";
  const gradeLevel = session.gradeLevel ? `Grade ${session.gradeLevel}` : "—";
  const studentClass = session.selectedClassName || "—";
  const passageTitle = session.selectedTitle || "—";
  const passageLevel = session.selectedLevel || "—";
  const testType = session.selectedTestType || "—";
  const totalWords = session.passageContent
    ? session.passageContent.split(/\s+/).filter(Boolean).length
    : 0;
  const readingTimeSeconds = Math.round(
    analysis?.duration ?? session.recordedSeconds ?? 0,
  );

  const totalMiscues = analysis?.totalMiscues ?? 0;
  const wordsCorrect = Math.max(0, totalWords - totalMiscues);
  const wcpm =
    readingTimeSeconds > 0
      ? Math.round((wordsCorrect / readingTimeSeconds) * 60)
      : 0;

  const classification = analysis?.classificationLevel || "—";
  const miscueData = buildMiscueData(analysis);
  const behaviorItems = buildBehaviorItems(analysis);

  return (
    <div className="flex min-h-full flex-col overflow-y-auto">
      <ReportHeader />

      <main className="flex-1 min-h-0 scroll-smooth max-w-300 mx-auto px-6 py-6 md:px-8 lg:px-12 space-y-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <StudentInfoCard
            studentName={studentName}
            gradeLevel={gradeLevel}
            className={studentClass}
          />
          <MetricCards
            wcpm={wcpm}
            readingTimeSeconds={readingTimeSeconds}
            classificationLevel={classification}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6">
            <PassageInfoCard
              passageTitle={passageTitle}
              passageLevel={passageLevel}
              numberOfWords={totalWords}
              testType={testType}
              assessmentType="Oral Reading"
            />
            <AudioPlaybackCard audioSrc={audioSrc} />
          </div>

          <BehaviorChecklist behaviors={behaviorItems} />

          <MiscueAnalysisReport miscueData={miscueData} />
        </div>
      </main>
    </div>
  );
}
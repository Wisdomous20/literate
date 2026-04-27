"use client";

import type { ReactNode } from "react";
import { CheckCircle, ClipboardCheck, Clock, FileText } from "lucide-react";
import { ComprehensionBreakdown } from "@/components/oral-reading-test/comprehensionBreakdown";
import type {
  AssessmentLinkData,
  ComprehensionResult,
  FluencyResult,
} from "./types";
import {
  formatReadingTime,
  pageShellClass,
  panelClass,
  SharedAssessmentHeaderByType,
  surfaceClass,
} from "./ui";

const miscueLabels: { key: string; label: string }[] = [
  { key: "MISPRONUNCIATION", label: "Mispronunciation" },
  { key: "OMISSION", label: "Omission" },
  { key: "SUBSTITUTION", label: "Substitution" },
  { key: "TRANSPOSITION", label: "Transposition" },
  { key: "REVERSAL", label: "Reversal" },
  { key: "INSERTION", label: "Insertion" },
  { key: "REPETITION", label: "Repetition" },
  { key: "SELF_CORRECTION", label: "Self-Correction" },
];

const behaviorLabels: { key: string; label: string; description: string }[] = [
  {
    key: "WORD_BY_WORD_READING",
    label: "Does word-by-word reading",
    description: "(Nagbabasa nang pa-isa isang salita)",
  },
  {
    key: "MONOTONOUS_READING",
    label: "Lacks expression: reads in a monotonous tone",
    description: "(Walang damdamin; walang pagbabago ang tono)",
  },
  {
    key: "DISMISSAL_OF_PUNCTUATION",
    label: "Disregards punctuation",
    description: "(Hindi pinapansin ang mga bantas)",
  },
];

function getLevelColor(level: string) {
  const upper = level.toUpperCase();
  if (upper === "INDEPENDENT") return "text-[#16A34A]";
  if (upper === "INSTRUCTIONAL") return "text-[#CA8A04]";
  if (upper === "FRUSTRATION") return "text-[#CE330C]";
  return "text-[#263168]";
}

function MetricCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  value: string | number | undefined;
  subtitle: string;
}) {
  return (
    <div className={`${surfaceClass} flex flex-col items-center justify-center gap-3 px-6 py-6 text-center`}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D9DEFF] bg-[#EEF1FF]">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-[#263168]">{title}</p>
        <p className="mt-2 text-4xl font-semibold text-[#3441B5]">{value}</p>
        <p className="mt-1 text-sm text-[#66739B]">{subtitle}</p>
      </div>
    </div>
  );
}

export function ResultsStep({
  data,
  fluencyResult,
  comprehensionResult,
  highlightedTag,
  onTagClick,
}: {
  data: AssessmentLinkData;
  fluencyResult: FluencyResult | null;
  comprehensionResult: ComprehensionResult | null;
  highlightedTag: "literal" | "inferential" | "critical" | null;
  onTagClick: (tag: "literal" | "inferential" | "critical") => void;
}) {
  const passageWords = data.passage.content.split(/\s+/).filter(Boolean).length;
  const readingTime = fluencyResult
    ? formatReadingTime(fluencyResult.readingTimeSeconds)
    : null;

  return (
    <div className={`${pageShellClass} flex min-h-screen flex-col`}>
      <SharedAssessmentHeaderByType
        type={data.type}
        subtitle={`${data.student.name} - ${data.passage.title}`}
        badge="Results"
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 px-4 py-6 md:px-6 lg:px-8">
        <div className="w-full space-y-6">
          <div className={`${surfaceClass} flex items-center gap-3 px-6 py-5`}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-base font-semibold text-[#21623C]">
                Assessment complete
              </p>
              <p className="text-sm text-[#66739B]">
                Results are shown below and can also be reviewed by the teacher.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className={`${surfaceClass} px-6 py-6`}>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7C84C4]">
                Student information
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className={panelClass + " px-4 py-4"}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7C84C4]">
                    Name
                  </p>
                  <p className="mt-2 text-base font-semibold text-[#263168]">
                    {data.student.name}
                  </p>
                </div>
                <div className={panelClass + " px-4 py-4"}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7C84C4]">
                    Grade
                  </p>
                  <p className="mt-2 text-base font-semibold text-[#263168]">
                    {data.student.level ? `Grade ${data.student.level}` : "Not set"}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${surfaceClass} px-6 py-6`}>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7C84C4]">
                Passage information
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className={panelClass + " px-4 py-4 sm:col-span-3"}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7C84C4]">
                    Title
                  </p>
                  <p className="mt-2 text-base font-semibold text-[#263168]">
                    {data.passage.title}
                  </p>
                </div>
                <div className={panelClass + " px-4 py-4"}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7C84C4]">
                    Level
                  </p>
                  <p className="mt-2 text-base font-semibold text-[#263168]">
                    Grade {data.passage.level}
                  </p>
                </div>
                <div className={panelClass + " px-4 py-4"}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7C84C4]">
                    Words
                  </p>
                  <p className="mt-2 text-base font-semibold text-[#263168]">
                    {passageWords}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {fluencyResult && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard
                  icon={<FileText className="h-5 w-5 text-[#3441B5]" />}
                  title="Reading Rate"
                  value={fluencyResult.wcpm}
                  subtitle="Words correct per minute"
                />
                <MetricCard
                  icon={<Clock className="h-5 w-5 text-[#3441B5]" />}
                  title="Reading Time"
                  value={readingTime?.value}
                  subtitle={readingTime?.subtitle ?? "Time"}
                />
                <MetricCard
                  icon={<ClipboardCheck className="h-5 w-5 text-[#3441B5]" />}
                  title="Classification"
                  value={fluencyResult.classificationLevel}
                  subtitle="Fluency level"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className={`${surfaceClass} px-6 py-6`}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7C84C4]">
                    Miscue analysis
                  </p>
                  <div className="mt-4 space-y-2">
                    {miscueLabels.map(({ key, label }) => {
                      const count = fluencyResult.miscueBreakdown[key] ?? 0;
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-[#263168]">{label}</span>
                          <span className="text-sm font-semibold text-[#263168]">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 space-y-2 border-t border-[#E3E8FF] pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#263168]">
                        Total miscues
                      </span>
                      <span className="text-sm font-semibold text-[#CE330C]">
                        {fluencyResult.totalMiscues}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#263168]">
                        Oral fluency score
                      </span>
                      <span className="text-sm font-semibold text-[#3441B5]">
                        {fluencyResult.oralFluencyScore}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#263168]">
                        Classification level
                      </span>
                      <span
                        className={`text-sm font-semibold italic ${getLevelColor(
                          fluencyResult.classificationLevel,
                        )}`}
                      >
                        {fluencyResult.classificationLevel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`${surfaceClass} px-6 py-6`}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7C84C4]">
                    Reading behavior observations
                  </p>
                  <div className="mt-4 space-y-3">
                    {behaviorLabels.map(({ key, label, description }) => {
                      const detected = fluencyResult.behaviors.includes(key);
                      return (
                        <div key={key} className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                              detected
                                ? "border-[#5D5DFB] bg-[#5D5DFB]"
                                : "border-[#C4C4FF] bg-white"
                            }`}
                          >
                            {detected && (
                              <CheckCircle className="h-3.5 w-3.5 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#263168]">
                              {label}
                            </p>
                            <p className="text-xs text-[#66739B]">
                              {description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {comprehensionResult && (
            <div className="mx-auto max-w-sm">
              <ComprehensionBreakdown
                score={comprehensionResult.score}
                totalItems={comprehensionResult.totalItems}
                level={comprehensionResult.level}
                tagBreakdown={comprehensionResult.tagBreakdown}
                disabled={false}
                highlightedTag={highlightedTag}
                onTagClick={onTagClick}
                showReportButton={false}
              />
            </div>
          )}

          {!fluencyResult && !comprehensionResult && (
            <div className={`${surfaceClass} flex flex-col items-center gap-3 px-6 py-8 text-center`}>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-sm text-[#66739B]">
                Your assessment has been submitted. Your teacher will review the
                results.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

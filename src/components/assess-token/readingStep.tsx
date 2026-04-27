"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import type { CSSProperties } from "react";
import { ComprehensionBreakdown } from "@/components/oral-reading-test/comprehensionBreakdown";
import { ComprehensionSubmitArea } from "@/components/reading-comprehension-test/comprehensionSubmitArea";
import { QuestionCard } from "@/components/reading-comprehension-test/questionCard";
import type { QuestionData } from "@/components/reading-comprehension-test/questionCard";
import type { AssessmentLinkData, ComprehensionResult } from "./types";
import {
  formatTime,
  pageShellClass,
  primaryButtonClass,
  secondaryButtonClass,
  SharedAssessmentHeaderByType,
  StatPill,
  surfaceClass,
} from "./ui";

export function PassageStep({
  data,
  wordCount,
  passageExpanded,
  onToggleExpanded,
  questionsCount,
  onContinue,
  passageTextStyle,
}: {
  data: AssessmentLinkData;
  wordCount: number;
  passageExpanded: boolean;
  onToggleExpanded: () => void;
  questionsCount: number;
  onContinue: () => void;
  passageTextStyle: CSSProperties;
}) {
  return (
    <div className={`${pageShellClass} flex min-h-screen flex-col`}>
      <SharedAssessmentHeaderByType
        type={data.type}
        subtitle={`${data.student.name} - ${data.passage.title}`}
        badge="Reading view"
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 md:px-6 lg:px-8">
        <div className={`${surfaceClass} flex flex-col gap-5 px-5 py-5 md:px-8 md:py-7`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7C84C4]">
                Passage
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#263168]">
                {data.passage.title}
              </h2>
            </div>
            {!passageExpanded && <StatPill>{wordCount} words</StatPill>}
          </div>

          <div
            className={`relative rounded-[28px] border border-[#E3E8FF] bg-[#FBFCFF] ${
              passageExpanded
                ? "fixed inset-0 z-50 rounded-none border-0 bg-white"
                : "shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
            }`}
          >
            <button
              type="button"
              onClick={onToggleExpanded}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#D7DEFF] bg-white text-[#5D5DFB] transition-colors hover:bg-[#F6F7FF] md:right-5 md:top-5"
              title={passageExpanded ? "Collapse passage" : "Expand passage"}
            >
              {passageExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            <div
              className={`overflow-auto px-6 py-14 md:px-10 md:py-16 ${
                passageExpanded ? "h-full" : "max-h-[68vh]"
              }`}
            >
              <p
                className="whitespace-pre-wrap text-center leading-relaxed text-[#24305F]"
                style={passageTextStyle}
              >
                {data.passage.content}
              </p>
            </div>
          </div>

          {!passageExpanded && questionsCount > 0 && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={onContinue}
                className={`${primaryButtonClass} min-w-64`}
              >
                Continue to Comprehension
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export function QuestionsStep({
  data,
  questions,
  answers,
  elapsedSeconds,
  isPaused,
  isSubmitted,
  submitError,
  isSubmitting,
  comprehensionResult,
  highlightedTag,
  onTogglePause,
  onViewPassage,
  onSelectOption,
  onEssayChange,
  onSubmit,
  onFinish,
  onTagClick,
}: {
  data: AssessmentLinkData;
  questions: QuestionData[];
  answers: Record<string, string>;
  elapsedSeconds: number;
  isPaused: boolean;
  isSubmitted: boolean;
  submitError: string | null;
  isSubmitting: boolean;
  comprehensionResult: ComprehensionResult | null;
  highlightedTag: "literal" | "inferential" | "critical" | null;
  onTogglePause: () => void;
  onViewPassage: () => void;
  onSelectOption: (questionId: string, option: string) => void;
  onEssayChange: (questionId: string, value: string) => void;
  onSubmit: () => void;
  onFinish: () => void;
  onTagClick: (tag: "literal" | "inferential" | "critical") => void;
}) {
  return (
    <div className={`${pageShellClass} flex min-h-screen flex-col`}>
      <SharedAssessmentHeaderByType
        type={data.type}
        subtitle={`${data.student.name} - ${data.passage.title}`}
        badge="Question set"
      />

      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-6 md:px-6 lg:px-8">
        <div className="flex w-full gap-6">
          <div className="min-w-0 flex-1 space-y-4">
            <div className={`${surfaceClass} px-5 py-4 md:px-6`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <StatPill icon={null}>{questions.length} Questions</StatPill>
                  <StatPill>{formatTime(elapsedSeconds)}</StatPill>
                </div>
                {!isSubmitted && (
                  <button
                    type="button"
                    onClick={onTogglePause}
                    className={secondaryButtonClass}
                  >
                    {isPaused ? "Resume timer" : "Pause timer"}
                  </button>
                )}
              </div>
            </div>

            {data.type === "COMPREHENSION" && (
              <button
                type="button"
                onClick={onViewPassage}
                className="inline-flex w-fit items-center rounded-full border border-[#D4DBFF] bg-white px-4 py-2 text-xs font-semibold text-[#4B50E6] transition-colors hover:bg-[#F6F7FF]"
              >
                View Passage
              </button>
            )}

            <div className="space-y-6">
              {questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  answer={answers[question.id]}
                  isSubmitted={isSubmitted}
                  highlightedTag={highlightedTag}
                  onSelectOption={onSelectOption}
                  onEssayChange={onEssayChange}
                />
              ))}
            </div>

            <ComprehensionSubmitArea
              isSubmitting={isSubmitting}
              isSubmitted={isSubmitted}
              submitError={submitError}
              onSubmit={onSubmit}
            />

            {isSubmitted && (
              <div className="flex justify-center pb-8">
                <button
                  type="button"
                  onClick={onFinish}
                  className={`${primaryButtonClass} min-w-44`}
                >
                  Finish
                </button>
              </div>
            )}
          </div>

          <div className="hidden w-60 shrink-0 md:block lg:w-72 xl:w-80">
            <ComprehensionBreakdown
              score={comprehensionResult?.score}
              totalItems={comprehensionResult?.totalItems}
              level={comprehensionResult?.level}
              tagBreakdown={comprehensionResult?.tagBreakdown}
              disabled={!isSubmitted}
              highlightedTag={highlightedTag}
              onTagClick={onTagClick}
              showReportButton={false}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

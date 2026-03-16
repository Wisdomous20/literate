"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import { ComprehensionBreakdown } from "@/components/oral-reading-test/comprehensionBreakdown";
import { ComprehensionInfoBar } from "@/components/oral-reading-test/comprehensionInfoBar";
import { ComprehensionNavRow } from "@/components/oral-reading-test/comprehensionNavRow";
import { ComprehensionSubmitArea } from "@/components/oral-reading-test/comprehensionSubmitArea";
import { QuestionCard } from "@/components/oral-reading-test/questionCard";
import type { QuestionData } from "@/components/oral-reading-test/questionCard";
import { getQuizByPassageAction } from "@/app/actions/comprehension-Test/getQuizByPassage";
import { getAssessmentComprehension } from "@/app/actions/assessment/getAssessmentComprehension";
import { exportComprehensionReportPdf } from "@/lib/exportComprehensionReportPdf";

const COMP_STORAGE_KEY = "oral-reading-comprehension-state";

interface TagBreakdown {
  literal: { correct: number; total: number };
  inferential: { correct: number; total: number };
  critical: { correct: number; total: number };
}

interface ComprehensionResult {
  score: number;
  totalItems: number;
  level: string;
  comprehensionTestId: string;
  tagBreakdown?: TagBreakdown;
}

interface ComprehensionState {
  assessmentId: string;
  answers: Record<string, string>;
  elapsedSeconds: number;
  isSubmitted: boolean;
  comprehensionResult: ComprehensionResult | null;
}

function loadComprehensionState(): ComprehensionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(COMP_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* empty */
  }
  return null;
}

function saveComprehensionState(state: ComprehensionState) {
  try {
    sessionStorage.setItem(COMP_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* empty */
  }
}

function computeTagBreakdown(
  answers: { isCorrect: boolean | null; tag: string }[],
): TagBreakdown {
  const breakdown: TagBreakdown = {
    literal: { correct: 0, total: 0 },
    inferential: { correct: 0, total: 0 },
    critical: { correct: 0, total: 0 },
  };
  for (const a of answers) {
    const tag = a.tag;
    if (tag === "Literal") {
      breakdown.literal.total++;
      if (a.isCorrect) breakdown.literal.correct++;
    } else if (tag === "Inferential") {
      breakdown.inferential.total++;
      if (a.isCorrect) breakdown.inferential.correct++;
    } else if (tag === "Critical") {
      breakdown.critical.total++;
      if (a.isCorrect) breakdown.critical.correct++;
    }
  }
  return breakdown;
}

function buildResultFromAssessment(assessment: {
  comprehension: {
    id: string;
    score: number;
    totalItems: number;
    classificationLevel: string | null;
    answers: {
      question: string;
      tag: string;
      answer: string;
      isCorrect: boolean | null;
    }[];
  };
}): { result: ComprehensionResult; restoredAnswers: Record<string, string> } {
  const comp = assessment.comprehension;
  const tagBreakdown = computeTagBreakdown(comp.answers);
  const result: ComprehensionResult = {
    score: comp.score,
    totalItems: comp.totalItems,
    level: comp.classificationLevel ?? "",
    comprehensionTestId: comp.id,
    tagBreakdown,
  };
  const restoredAnswers: Record<string, string> = {};
  for (const a of comp.answers) {
    restoredAnswers[a.question] = a.answer;
  }
  return { result, restoredAnswers };
}

/** Sync comprehension + fluency into the main oral-reading-session for the report page */
function syncMainSession(
  compResult: ComprehensionResult,
  fluencyClassification?: string | null,
) {
  try {
    const mainRaw = sessionStorage.getItem("oral-reading-session");
    if (!mainRaw) return;
    const mainSession = JSON.parse(mainRaw);
    mainSession.comprehensionResult = {
      score: compResult.score,
      totalItems: compResult.totalItems,
      percentage: compResult.totalItems
        ? Math.round((compResult.score / compResult.totalItems) * 100)
        : 0,
      level: compResult.level,
    };
    if (fluencyClassification && compResult.level) {
      const ranks: Record<string, number> = {
        INDEPENDENT: 0,
        INSTRUCTIONAL: 1,
        FRUSTRATION: 2,
      };
      const labels = ["INDEPENDENT", "INSTRUCTIONAL", "FRUSTRATION"];
      const overall = Math.max(
        ranks[fluencyClassification] ?? 0,
        ranks[compResult.level] ?? 0,
      );
      mainSession.oralReadingLevel = labels[overall];
    }
    sessionStorage.setItem("oral-reading-session", JSON.stringify(mainSession));
  } catch {
    /* non-critical */
  }
}

export default function OralReadingComprehensionPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [comprehensionResult, setComprehensionResult] =
    useState<ComprehensionResult | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(true);
  const [highlightedTag, setHighlightedTag] = useState<
    "literal" | "inferential" | "critical" | null
  >(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleTagClick = (tag: "literal" | "inferential" | "critical") => {
    setHighlightedTag((prev) => (prev === tag ? null : tag));
  };

  // Fetch questions on mount + restore saved state
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const currentAssessmentId = sessionStorage.getItem(
          "oral-reading-assessmentId",
        );
        const raw = sessionStorage.getItem("oral-reading-session");

        if (!raw) {
          setLoadError("Session not found. Please go back and start again.");
          setIsLoading(false);
          return;
        }

        const session = JSON.parse(raw);
        const passageId = session.selectedPassage;

        if (!passageId) {
          setLoadError(
            "No passage selected. Please go back and select a passage.",
          );
          setIsLoading(false);
          return;
        }

        // Restore saved comprehension progress only if it belongs to the current assessment
        const saved = loadComprehensionState();
        if (saved && saved.assessmentId === currentAssessmentId) {
          setAnswers(saved.answers);
          setElapsedSeconds(saved.elapsedSeconds);
          if (saved.isSubmitted && saved.comprehensionResult) {
            setIsSubmitted(true);
            setComprehensionResult(saved.comprehensionResult);
          }
        } else if (saved && saved.assessmentId !== currentAssessmentId) {
          sessionStorage.removeItem(COMP_STORAGE_KEY);
        }

        const isRestoredSubmitted =
          saved?.assessmentId === currentAssessmentId && saved?.isSubmitted;

        const [existingRes, quizResult] = await Promise.all([
          !isRestoredSubmitted && currentAssessmentId
            ? getAssessmentComprehension(currentAssessmentId)
            : Promise.resolve(null),
          getQuizByPassageAction(passageId),
        ]);

        // Handle existing comprehension result from DB
        if (
          existingRes &&
          existingRes.success &&
          "assessment" in existingRes &&
          existingRes.assessment?.comprehension
        ) {
          const { result: restoredResult, restoredAnswers } =
            buildResultFromAssessment(
              existingRes.assessment as Parameters<
                typeof buildResultFromAssessment
              >[0],
            );

          setComprehensionResult(restoredResult);
          setIsSubmitted(true);
          setAnswers(restoredAnswers);

          if (restoredResult.comprehensionTestId) {
            sessionStorage.setItem(
              "oral-reading-comprehensionTestId",
              restoredResult.comprehensionTestId,
            );
          }

          saveComprehensionState({
            assessmentId: currentAssessmentId!,
            answers: restoredAnswers,
            elapsedSeconds: saved?.elapsedSeconds ?? 0,
            isSubmitted: true,
            comprehensionResult: restoredResult,
          });

          const fluencyClassification =
            existingRes.assessment?.oralFluency?.classificationLevel;
          syncMainSession(restoredResult, fluencyClassification);
        }

        // Handle quiz questions result
        if (
          !quizResult.success ||
          !("quiz" in quizResult) ||
          !quizResult.quiz
        ) {
          setLoadError(
            ("error" in quizResult && quizResult.error) ||
              "Failed to load quiz questions.",
          );
          setIsLoading(false);
          return;
        }

        const { quiz } = quizResult;

        const mapped: QuestionData[] = quiz.questions.map(
          (
            q: {
              id: string;
              questionText: string;
              tags: string | null;
              type: string;
              options: unknown;
            },
            idx: number,
          ) => ({
            id: q.id,
            questionNumber: idx + 1,
            questionText: q.questionText,
            type: q.type as "MULTIPLE_CHOICE" | "ESSAY",
            tags: q.tags ?? undefined,
            options: Array.isArray(q.options)
              ? (q.options as string[])
              : undefined,
          }),
        );

        setQuestions(mapped);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        setLoadError("Something went wrong while loading questions.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestions();
  }, []);

  // Timer — stops when submitted, submitting, or paused
  useEffect(() => {
    if (isSubmitted || isSubmitting || isPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, isSubmitting, isPaused]);

  // Persist comprehension state to sessionStorage on every change
  useEffect(() => {
    if (isLoading) return;
    const currentAssessmentId =
      sessionStorage.getItem("oral-reading-assessmentId") || "";
    saveComprehensionState({
      assessmentId: currentAssessmentId,
      answers,
      elapsedSeconds,
      isSubmitted,
      comprehensionResult,
    });
  }, [answers, elapsedSeconds, isSubmitted, comprehensionResult, isLoading]);

  const togglePause = () => {
    if (!isSubmitted) setIsPaused((prev) => !prev);
  };

  // Track scroll position to show/hide scroll-down button
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll(); // initial check
    return () => container.removeEventListener("scroll", handleScroll);
  }, [questions]);

  const scrollDown = () => {
    contentRef.current?.scrollBy({ top: 300, behavior: "smooth" });
  };

  const formattedTime = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  const handleSelectOption = useCallback((question: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [question]: option }));
  }, []);

  const handleEssayChange = useCallback((question: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [question]: value }));
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const assessmentId = sessionStorage.getItem("oral-reading-assessmentId");
      if (!assessmentId) {
        setSubmitError(
          "Assessment ID not found. Please go back and record first.",
        );
        setIsSubmitting(false);
        return;
      }

      // Check if a comprehension test already exists for this assessment
      try {
        const res = await getAssessmentComprehension(assessmentId);
        if (
          res.success &&
          "assessment" in res &&
          res.assessment?.comprehension
        ) {
          const { result: existingResult } = buildResultFromAssessment(
            res.assessment as Parameters<typeof buildResultFromAssessment>[0],
          );

          setComprehensionResult(existingResult);
          if (existingResult.comprehensionTestId) {
            sessionStorage.setItem(
              "oral-reading-comprehensionTestId",
              existingResult.comprehensionTestId,
            );
          }

          const fluencyClassification =
            res.assessment?.oralFluency?.classificationLevel;
          syncMainSession(existingResult, fluencyClassification);

          setIsSubmitted(true);
          return;
        }
      } catch {
        // Assessment fetch failed — continue with submission
      }

      // Build answers array — { question, answer }
      const formattedAnswers = questions
        .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
        .map((q) => ({
          questionId: q.id,
          answer: answers[q.id],
        }));

      console.log("answers state:", answers);
      console.log("formattedAnswers:", formattedAnswers);
      console.log("questions ids:", questions.map(q => q.id));

      if (formattedAnswers.length === 0) {
        setSubmitError("Please answer at least one question before submitting.");
        setIsSubmitting(false);
        return;  // ← is this actually returning?
      }

      const response = await fetch("/api/oral-reading/comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId, answers: formattedAnswers }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setSubmitError(
          result.error || "Failed to submit comprehension answers.",
        );
        setIsSubmitting(false);
        return;
      }

      let tagBreakdown: TagBreakdown | undefined;
      if (result.answers && Array.isArray(result.answers)) {
        tagBreakdown = {
          literal: { correct: 0, total: 0 },
          inferential: { correct: 0, total: 0 },
          critical: { correct: 0, total: 0 },
        };
        for (const a of result.answers) {
          const tag = a.tag as string;
          if (tag === "Literal") {
            tagBreakdown.literal.total++;
            if (a.isCorrect) tagBreakdown.literal.correct++;
          } else if (tag === "Inferential") {
            tagBreakdown.inferential.total++;
            if (a.isCorrect) tagBreakdown.inferential.correct++;
          } else if (tag === "Critical") {
            tagBreakdown.critical.total++;
            if (a.isCorrect) tagBreakdown.critical.correct++;
          }
        }
      }

      const comprehensionData = {
        score: result.score,
        totalItems: result.totalItems,
        level: result.level,
        comprehensionTestId: result.comprehensionTestId,
        tagBreakdown,
      };

      setComprehensionResult(comprehensionData);

      // Store comprehensionTestId for the report page
      if (result.comprehensionTestId) {
        sessionStorage.setItem(
          "oral-reading-comprehensionTestId",
          result.comprehensionTestId,
        );
      }

      // Write comprehensionResult and oralReadingLevel back into the main session
      // so the reading-level-report page can display them
      try {
        const mainRaw = sessionStorage.getItem("oral-reading-session");
        if (mainRaw) {
          const mainSession = JSON.parse(mainRaw);
          mainSession.comprehensionResult = {
            score: comprehensionData.score,
            totalItems: comprehensionData.totalItems,
            percentage: comprehensionData.totalItems
              ? Math.round(
                  (comprehensionData.score / comprehensionData.totalItems) *
                    100,
                )
              : 0,
            level: comprehensionData.level,
          };
          mainSession.oralReadingLevel =
            result.oralReadingResult?.oralReadingLevel ?? null;
          sessionStorage.setItem(
            "oral-reading-session",
            JSON.stringify(mainSession),
          );
        }
      } catch {
        /* failed to update main session — non-critical */
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error("Comprehension submit error:", err);
      setSubmitError("Something went wrong while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = useCallback(() => {
    setAnswers({});
    setElapsedSeconds(0);
    setIsSubmitted(false);
    setIsSubmitting(false);
    setSubmitError(null);
    setComprehensionResult(null);
    setHighlightedTag(null);
    sessionStorage.removeItem(COMP_STORAGE_KEY);
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  const totalQuestions = questions.length;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <DashboardHeader title="Oral Reading Test" />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#6666FF]" />
            <span className="text-[#00306E] font-medium">
              Loading questions...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <DashboardHeader title="Oral Reading Test" />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <p className="text-red-600 font-medium">{loadError}</p>
            <button
              onClick={() => router.back()}
              className="rounded-lg bg-[#6666FF] px-6 py-2 text-sm font-semibold text-white hover:bg-[#5555EE] transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <DashboardHeader title="Oral Reading Test" />

      {/* Two-column layout */}
      <div className="flex flex-1 min-h-0 flex-col gap-4 px-4 py-4 md:px-6 lg:px-8">
        {/* Navigation Buttons — above both columns */}
        <ComprehensionNavRow
          onGoBack={handleGoBack}
          onContinue={() =>
            router.push("/dashboard/oral-reading-test/reading-level-report")
          }
          continueEnabled={isSubmitted}
        />

        {/* Two columns: left (info bar + scrollable questions) | right (breakdown aligned with timer top) */}
        <div className="flex flex-1 min-h-0 gap-4">
          {/* Left column */}
          <div className="flex flex-1 min-h-0 flex-col gap-4">
            <ComprehensionInfoBar
              totalQuestions={totalQuestions}
              formattedTime={formattedTime}
              isPaused={isPaused}
              onTogglePause={togglePause}
            />

            {/* Scrollable questions */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto scroll-smooth pr-2"
            >
              <div className="space-y-6">
                {questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    answer={answers[question.id]}
                    highlightedTag={highlightedTag}
                    isSubmitted={isSubmitted}
                    onSelectOption={handleSelectOption}
                    onEssayChange={handleEssayChange}
                  />
                ))}
              </div>

              <ComprehensionSubmitArea
                submitError={submitError}
                isSubmitting={isSubmitting}
                isSubmitted={isSubmitted}
                onSubmit={handleSubmit}
                onTryAgain={handleTryAgain}
              />
            </div>
          </div>

          {/* Right column: Comprehension Breakdown — top aligned with timer */}
          <div className="w-70 shrink-0 md:w-75 lg:w-[320px]">
            <ComprehensionBreakdown
              score={comprehensionResult?.score}
              totalItems={comprehensionResult?.totalItems}
              level={comprehensionResult?.level}
              tagBreakdown={comprehensionResult?.tagBreakdown}
              disabled={!isSubmitted}
              highlightedTag={highlightedTag}
              onTagClick={handleTagClick}
              onExportPdf={() => {
                if (!comprehensionResult || !comprehensionResult.tagBreakdown)
                  return;
                const raw = sessionStorage.getItem("oral-reading-session");
                const session = raw ? JSON.parse(raw) : {};
                const totalItems = comprehensionResult.totalItems;
                const score = comprehensionResult.score;
                exportComprehensionReportPdf(
                  {
                    studentName: session.studentName || "\u2014",
                    gradeLevel: session.gradeLevel
                      ? `Grade ${session.gradeLevel}`
                      : "\u2014",
                    className: session.selectedClassName || "\u2014",
                    passageTitle: session.selectedTitle || "\u2014",
                    passageLevel: session.selectedLevel || "\u2014",
                    numberOfWords: session.passageContent
                      ? session.passageContent.split(/\s+/).filter(Boolean)
                          .length
                      : 0,
                    testType: session.selectedTestType || "\u2014",
                    assessmentType: "Oral Reading Test",
                    score,
                    totalItems,
                    percentage:
                      totalItems > 0
                        ? Math.round((score / totalItems) * 100)
                        : 0,
                    classificationLevel: comprehensionResult.level,
                    literal: comprehensionResult.tagBreakdown.literal,
                    inferential: comprehensionResult.tagBreakdown.inferential,
                    critical: comprehensionResult.tagBreakdown.critical,
                  },
                  `Comprehension_Report_${(session.studentName || "report").replace(/[^a-zA-Z0-9]/g, "_")}`,
                );
              }}
            />
          </div>
        </div>
      </div>

      {/* Scroll Down Button */}
      {showScrollButton && (
        <button
          onClick={scrollDown}
          className="absolute bottom-6 right-10 z-10 flex h-10 w-10 animate-bounce items-center justify-center rounded-full bg-[#6666FF] text-white transition-all hover:bg-[#5555EE] shadow-[0_0_16px_rgba(102,102,255,0.5)]"
          aria-label="Scroll down"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

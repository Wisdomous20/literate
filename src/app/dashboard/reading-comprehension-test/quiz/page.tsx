"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  CheckCircle,
  X,
} from "lucide-react";
import { DashboardHeader } from "@/components/auth/dashboard/dashboardHeader";
import { ComprehensionBreakdown } from "@/components/oral-reading-test/comprehensionBreakdown";
import { ComprehensionInfoBar } from "@/components/reading-comprehension-test/comprehensionInfoBar";
import { QuestionCard, type QuestionData } from "@/components/reading-comprehension-test/questionCard";
import { ComprehensionSubmitArea } from "@/components/reading-comprehension-test/comprehensionSubmitArea";
import { getQuizByPassageAction } from "@/app/actions/comprehension-Test/getQuizByPassage";
import { createStudent } from "@/app/actions/student/createStudent";

const SESSION_KEY = "reading-comprehension-session";
const COMP_STATE_KEY = "reading-comprehension-comp-state";

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
  assessmentId?: string;
}

interface ComprehensionState {
  passageId: string;
  answers: Record<string, string>;
  elapsedSeconds: number;
  isSubmitted: boolean;
  comprehensionResult: ComprehensionResult | null;
}

function loadComprehensionState(): ComprehensionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(COMP_STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* empty */
  }
  return null;
}

function saveComprehensionState(state: ComprehensionState) {
  try {
    sessionStorage.setItem(COMP_STATE_KEY, JSON.stringify(state));
  } catch {
    /* empty */
  }
}

export default function ReadingComprehensionQuestionsPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [quizId, setQuizId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);
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

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const raw = sessionStorage.getItem(SESSION_KEY);
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

        // Restore saved comprehension progress only if it belongs to the same passage
        const saved = loadComprehensionState();
        if (saved && saved.passageId === passageId) {
          setAnswers(saved.answers);
          setElapsedSeconds(saved.elapsedSeconds);
          if (saved.isSubmitted && saved.comprehensionResult) {
            setIsSubmitted(true);
            setComprehensionResult(saved.comprehensionResult);
            if (saved.comprehensionResult.assessmentId) {
              sessionStorage.setItem(
                "reading-comprehension-assessmentId",
                saved.comprehensionResult.assessmentId,
              );
            }
          }
        } else if (saved && saved.passageId !== passageId) {
          // Stale state from a different passage — clear it
          sessionStorage.removeItem(COMP_STATE_KEY);
        }

        const result = await getQuizByPassageAction(passageId);
        if (!result.success || !("quiz" in result) || !result.quiz) {
          setLoadError(
            ("error" in result && result.error) ||
              "Failed to load quiz questions.",
          );
          setIsLoading(false);
          return;
        }

        const { quiz } = result;
        setQuizId(quiz.id as string);

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

  useEffect(() => {
    if (isSubmitted || isPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, isPaused]);

  useEffect(() => {
    if (isLoading) return;
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const session = JSON.parse(raw);
    const passageId = session.selectedPassage;
    if (!passageId) return;

    saveComprehensionState({
      passageId,
      answers,
      elapsedSeconds,
      isSubmitted,
      comprehensionResult,
    });
  }, [answers, elapsedSeconds, isSubmitted, comprehensionResult, isLoading]);

  const togglePause = () => {
    if (!isSubmitted) setIsPaused((prev) => !prev);
  };

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => container.removeEventListener("scroll", handleScroll);
  }, [questions]);

  const scrollDown = () => {
    contentRef.current?.scrollBy({ top: 300, behavior: "smooth" });
  };

  const formattedTime = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  const handleSelectOption = useCallback(
    (questionId: string, option: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: option }));
    },
    [],
  );

  const handleEssayChange = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) {
        setSubmitError("Session not found. Please go back and start again.");
        setIsSubmitting(false);
        return;
      }
      const session = JSON.parse(raw);
      const passageId = session.selectedPassage;
      let studentId = session.selectedStudentId;

      if (!passageId) {
        setSubmitError("No passage selected. Please go back and start again.");
        setIsSubmitting(false);
        return;
      }

      // If no existing student, create one
      if (!studentId) {
        const studentName = session.studentName?.trim();
        const gradeLevel = session.gradeLevel;
        const className = session.selectedClassName;

        if (!studentName || !gradeLevel || !className) {
          setSubmitError(
            "Please go back and enter student name, grade level, and class.",
          );
          setIsSubmitting(false);
          return;
        }

        try {
          const result = await createStudent(
            studentName,
            Number(gradeLevel),
            className,
          );
          if (!result.success || !("student" in result) || !result.student) {
            setSubmitError(result.error || "Failed to create student.");
            setIsSubmitting(false);
            return;
          }
          studentId = result.student.id;
          session.selectedStudentId = studentId;
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } catch (err) {
          console.error("Failed to create student:", err);
          setSubmitError("Something went wrong creating the student.");
          setIsSubmitting(false);
          return;
        }
      }

      if (!quizId) {
        setSubmitError("Quiz not found. Please go back and select a passage.");
        setIsSubmitting(false);
        return;
      }

      const formattedAnswers = questions
        .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
        .map((q) => ({
          questionId: q.id,
          answer: answers[q.id],
        }));

      if (formattedAnswers.length === 0) {
        setSubmitError(
          "Please answer at least one question before submitting.",
        );
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/comprehension/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          passageId,
          quizId,
          answers: formattedAnswers,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setSubmitError(
          result.error || "Failed to submit comprehension answers.",
        );
        setIsSubmitting(false);
        return;
      }

      // Compute tag breakdown from graded answers
      let tagBreakdown: TagBreakdown | undefined;
      if (result.answers && Array.isArray(result.answers)) {
        tagBreakdown = {
          literal: { correct: 0, total: 0 },
          inferential: { correct: 0, total: 0 },
          critical: { correct: 0, total: 0 },
        };
        for (const a of result.answers) {
          const tag = a.question?.tags;
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

      const comprehensionData: ComprehensionResult = {
        score: result.score,
        totalItems: result.totalItems,
        level: result.level,
        comprehensionTestId: result.comprehensionTestId,
        tagBreakdown,
        assessmentId: result.assessmentId,
      };

      setComprehensionResult(comprehensionData);

      if (result.assessmentId) {
        sessionStorage.setItem(
          "reading-comprehension-assessmentId",
          result.assessmentId,
        );
      }

      setIsSubmitted(true);
      setSuccessToast(true);
    } catch (err) {
      console.error("Comprehension submit error:", err);
      setSubmitError("Something went wrong while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const totalQuestions = questions.length;

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <DashboardHeader title="Reading Comprehension Test" />
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

  if (loadError) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <DashboardHeader title="Reading Comprehension Test" />
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
      {successToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 shadow-lg">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">
            Answers submitted successfully!
          </span>
          <button
            onClick={() => setSuccessToast(false)}
            className="ml-2 text-green-400 hover:text-green-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <DashboardHeader title="Reading Comprehension Test" />

      <div className="flex flex-1 min-h-0 flex-col gap-4 px-4 py-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1.5 rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#5555EE] md:text-base shadow-[0_0_20px_rgba(102,102,255,0.4),0_4px_12px_rgba(102,102,255,0.3)]"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            <span>Previous</span>
          </button>
          <button
            onClick={() =>
              router.push("/dashboard/reading-comprehension-test/report")
            }
            disabled={!isSubmitted}
            className="flex items-center gap-1.5 rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#5555EE] md:text-base disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_20px_rgba(102,102,255,0.4),0_4px_12px_rgba(102,102,255,0.3)]"
          >
            <span>View Report</span>
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 gap-4">
          <div className="flex flex-1 min-h-0 flex-col gap-4">
            <ComprehensionInfoBar
              totalQuestions={totalQuestions}
              formattedTime={formattedTime}
              isPaused={isPaused}
              isSubmitted={isSubmitted}
              onTogglePause={togglePause}
            />

            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto scroll-smooth pr-2"
            >
              <div className="space-y-6">
                {questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    answers={answers}
                    isSubmitted={isSubmitted}
                    highlightedTag={highlightedTag}
                    onSelectOption={handleSelectOption}
                    onEssayChange={handleEssayChange}
                  />
                ))}
              </div>

              <ComprehensionSubmitArea
                isSubmitting={isSubmitting}
                isSubmitted={isSubmitted}
                submitError={submitError}
                onSubmit={handleSubmit}
              />
            </div>
          </div>

          <div className="w-70 shrink-0 md:w-75 lg:w-[320px]">
            <ComprehensionBreakdown
              score={comprehensionResult?.score}
              totalItems={comprehensionResult?.totalItems}
              level={comprehensionResult?.level}
              tagBreakdown={comprehensionResult?.tagBreakdown}
              disabled={!isSubmitted}
              highlightedTag={highlightedTag}
              onTagClick={handleTagClick}
              showReportButton={false}
            />
          </div>
        </div>
      </div>

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

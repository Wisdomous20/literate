"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  X,
  Clock,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import { NavButton } from "@/components/ui/navButton";
import StudentInfoBar from "@/components/oral-reading-test/studentInfoBar";
import { PassageFilters } from "@/components/oral-reading-test/passageFilters";
import { PassageDisplay } from "@/components/oral-reading-test/passageDisplay";
import { AddPassageModal } from "@/components/oral-reading-test/addPassageModal";
import { ComprehensionBreakdown } from "@/components/oral-reading-test/comprehensionBreakdown";
import { ComprehensionInfoBar } from "@/components/reading-comprehension-test/comprehensionInfoBar";
import {
  QuestionCard,
  type QuestionData,
} from "@/components/reading-comprehension-test/questionCard";
import { ComprehensionSubmitArea } from "@/components/reading-comprehension-test/comprehensionSubmitArea";
import { useClassList } from "@/lib/hooks/useClassList";
import { useQueryClient } from "@tanstack/react-query";
import { getQuizByPassageAction } from "@/app/actions/comprehension-Test/getQuizByPassage";
import { createStudent } from "@/app/actions/student/createStudent";

function getCurrentSchoolYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  if (currentMonth >= 7) {
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
}

const STORAGE_KEY = "reading-comprehension-session";
const COMP_STATE_KEY = "reading-comprehension-comp-state";

interface SessionState {
  studentName: string;
  gradeLevel: string;
  selectedStudentId: string;
  selectedClassName: string;
  passageContent: string;
  selectedLanguage?: string;
  selectedLevel?: string;
  selectedTestType?: string;
  selectedTitle?: string;
  selectedPassage?: string;
}

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

function loadSession(): Partial<SessionState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* empty */
  }
  return {};
}

function saveSession(state: SessionState) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* empty */
  }
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

export default function ReadingComprehensionTestPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ── TanStack-cached class list ──
  const schoolYear = getCurrentSchoolYear();
  const { data: classListData = [], isLoading: isLoadingClasses } =
    useClassList(schoolYear);

  const classes = useMemo(
    () => classListData.map((c) => ({ id: c.id, name: c.name })),
    [classListData],
  );

  // ── Student & passage state ──
  const [studentName, setStudentName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedClassName, setSelectedClassName] = useState<string>("");

  const [passageContent, setPassageContent] = useState("");
  const [isPassageModalOpen, setIsPassageModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>();
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>();
  const [selectedTestType, setSelectedTestType] = useState<string | undefined>();
  const [selectedTitle, setSelectedTitle] = useState<string | undefined>();
  const [selectedPassage, setSelectedPassage] = useState<string | undefined>();
  const [passageExpanded, setPassageExpanded] = useState(false);

  // ── Comprehension quiz state ──
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [quizId, setQuizId] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionsLoadError, setQuestionsLoadError] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [comprehensionResult, setComprehensionResult] =
    useState<ComprehensionResult | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [highlightedTag, setHighlightedTag] = useState<
    "literal" | "inferential" | "critical" | null
  >(null);

  // ── General UI state ──
  const [isHydrated, setIsHydrated] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const questionsRef = useRef<HTMLDivElement>(null);

  // ── Session restore ──
  useEffect(() => {
    const loaded = loadSession();

    if (loaded.studentName !== undefined) setStudentName(loaded.studentName);
    if (loaded.gradeLevel !== undefined) setGradeLevel(loaded.gradeLevel);
    if (loaded.selectedStudentId !== undefined)
      setSelectedStudentId(loaded.selectedStudentId);
    if (loaded.selectedClassName !== undefined)
      setSelectedClassName(loaded.selectedClassName);
    if (loaded.passageContent !== undefined)
      setPassageContent(loaded.passageContent);
    if (loaded.selectedLanguage !== undefined)
      setSelectedLanguage(loaded.selectedLanguage);
    if (loaded.selectedLevel !== undefined)
      setSelectedLevel(loaded.selectedLevel);
    if (loaded.selectedTestType !== undefined)
      setSelectedTestType(loaded.selectedTestType);
    if (loaded.selectedTitle !== undefined)
      setSelectedTitle(loaded.selectedTitle);
    if (loaded.selectedPassage !== undefined)
      setSelectedPassage(loaded.selectedPassage);

    // Restore comprehension progress
    if (loaded.selectedPassage) {
      const saved = loadComprehensionState();
      if (saved && saved.passageId === loaded.selectedPassage) {
        setAnswers(saved.answers);
        setElapsedSeconds(saved.elapsedSeconds);
        setShowQuestions(true);
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
      }
    }

    setIsHydrated(true);
  }, []);

  // ── Persist session ──
  useEffect(() => {
    if (!isHydrated) return;
    saveSession({
      studentName,
      gradeLevel,
      selectedStudentId,
      selectedClassName,
      passageContent,
      selectedLanguage,
      selectedLevel,
      selectedTestType,
      selectedTitle,
      selectedPassage,
    });
  }, [
    isHydrated,
    studentName,
    gradeLevel,
    selectedStudentId,
    selectedClassName,
    passageContent,
    selectedLanguage,
    selectedLevel,
    selectedTestType,
    selectedTitle,
    selectedPassage,
  ]);

  // ── Persist comprehension state ──
  useEffect(() => {
    if (!showQuestions || !selectedPassage) return;
    saveComprehensionState({
      passageId: selectedPassage,
      answers,
      elapsedSeconds,
      isSubmitted,
      comprehensionResult,
    });
  }, [
    showQuestions,
    selectedPassage,
    answers,
    elapsedSeconds,
    isSubmitted,
    comprehensionResult,
  ]);

  // ── Fetch questions when showQuestions becomes true ──
  useEffect(() => {
    if (!showQuestions || !selectedPassage || questions.length > 0) return;

    async function fetchQuestions() {
      setIsLoadingQuestions(true);
      try {
        const result = await getQuizByPassageAction(selectedPassage!);
        if (!result.success || !("quiz" in result) || !result.quiz) {
          setQuestionsLoadError(
            ("error" in result && result.error) ||
              "Failed to load quiz questions.",
          );
          return;
        }
        const { quiz } = result;
        setQuizId(quiz.id as string);
        setQuestions(
          quiz.questions.map(
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
          ),
        );
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        setQuestionsLoadError("Something went wrong while loading questions.");
      } finally {
        setIsLoadingQuestions(false);
      }
    }
    fetchQuestions();
  }, [showQuestions, selectedPassage, questions.length]);

  // ── Timer ──
  const timerActive = showQuestions && !isSubmitted && !isSubmitting && !isPaused && !isLoadingQuestions && questions.length > 0;
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // ── Toast auto-dismiss ──
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ── Derived values ──
  const hasPassage = passageContent.length > 0;
  const wordCount = hasPassage
    ? passageContent.split(/\s+/).filter(Boolean).length
    : 0;
  const estimatedReadingTime =
    wordCount > 0
      ? (() => {
          const totalSec = Math.ceil((wordCount / 150) * 60);
          const mins = Math.floor(totalSec / 60);
          const secs = totalSec % 60;
          return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        })()
      : null;

  const formattedTime = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  // ── Handlers ──
  const handleSelectPassage = useCallback(
    (passage: {
      id: string;
      title: string;
      content: string;
      language: string;
      level: number;
      tags: string;
      testType: string;
    }) => {
      setPassageContent(passage.content);
      setSelectedLanguage(passage.language);
      setSelectedLevel(`Grade ${passage.level}`);
      setSelectedTestType(
        passage.testType === "PRE_TEST" ? "Pre-Test" : "Post-Test",
      );
      setSelectedTitle(passage.title);
      setSelectedPassage(passage.id);
      // Reset comprehension state for new passage
      setShowQuestions(false);
      setQuestions([]);
      setQuizId("");
      setAnswers({});
      setElapsedSeconds(0);
      setIsSubmitted(false);
      setComprehensionResult(null);
      setQuestionsLoadError(null);
      sessionStorage.removeItem(COMP_STATE_KEY);
    },
    [],
  );

  const handleStartNew = useCallback(() => {
    setStudentName("");
    setGradeLevel("");
    setSelectedStudentId("");
    setSelectedClassName("");
    setPassageContent("");
    setSelectedLanguage(undefined);
    setSelectedLevel(undefined);
    setSelectedTestType(undefined);
    setSelectedTitle(undefined);
    setSelectedPassage(undefined);
    setShowQuestions(false);
    setQuestions([]);
    setQuizId("");
    setAnswers({});
    setElapsedSeconds(0);
    setIsSubmitted(false);
    setComprehensionResult(null);
    setQuestionsLoadError(null);
    setHighlightedTag(null);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(COMP_STATE_KEY);
    sessionStorage.removeItem("reading-comprehension-assessmentId");
    sessionStorage.removeItem("reading-comprehension-state");
  }, []);

  const handleContinueToComprehension = useCallback(() => {
    if (!hasPassage || !studentName.trim() || !gradeLevel || !selectedClassName) return;
    setShowQuestions(true);
    setTimeout(() => {
      questionsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [hasPassage, studentName, gradeLevel, selectedClassName]);

  const handleSelectOption = useCallback(
    (questionId: string, option: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: option }));
    },
    [],
  );

  const handleEssayChange = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleTagClick = (tag: "literal" | "inferential" | "critical") => {
    setHighlightedTag((prev) => (prev === tag ? null : tag));
  };

  const handleTryAgain = useCallback(() => {
    setAnswers({});
    setElapsedSeconds(0);
    setIsSubmitted(false);
    setIsSubmitting(false);
    setSubmitError(null);
    setComprehensionResult(null);
    setHighlightedTag(null);
    sessionStorage.removeItem(COMP_STATE_KEY);
    sessionStorage.removeItem("reading-comprehension-assessmentId");
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let studentId = selectedStudentId;

      // Auto-create student if needed
      if (!studentId) {
        const trimmedName = studentName.trim();
        if (!trimmedName || !gradeLevel || !selectedClassName) {
          setSubmitError(
            "Please enter a student name, select a grade level, and select a class.",
          );
          setIsSubmitting(false);
          return;
        }
        try {
          const result = await createStudent(
            trimmedName,
            Number(gradeLevel),
            selectedClassName,
          );
          if (!result.success || !("student" in result) || !result.student) {
            setSubmitError(result.error || "Failed to create student.");
            setIsSubmitting(false);
            return;
          }
          studentId = result.student.id;
          setSelectedStudentId(studentId);
          setToast({
            message: `Student "${trimmedName}" created successfully!`,
            type: "success",
          });
        } catch (err) {
          console.error("Failed to create student:", err);
          setSubmitError("Something went wrong creating the student.");
          setIsSubmitting(false);
          return;
        }
      }

      if (!quizId || !selectedPassage) {
        setSubmitError("Quiz not found. Please select a passage first.");
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
          passageId: selectedPassage,
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

      // Compute tag breakdown
      let tagBreakdown: TagBreakdown | undefined;
      if (result.answers && Array.isArray(result.answers)) {
        tagBreakdown = {
          literal: { correct: 0, total: 0 },
          inferential: { correct: 0, total: 0 },
          critical: { correct: 0, total: 0 },
        };
        for (const a of result.answers) {
          const tag = a.tag;
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
      setToast({ message: "Answers submitted successfully!", type: "success" });
    } catch (err) {
      console.error("Comprehension submit error:", err);
      setSubmitError("Something went wrong while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const classNames = classes.map((c) => c.name);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DashboardHeader title="Reading Comprehension Test" />

      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg transition-all duration-300 ${
            toast.type === "success"
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0 text-red-500" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Close notification"
            title="Close notification"
            className={`ml-1 rounded-full p-0.5 transition-colors ${
              toast.type === "success"
                ? "hover:bg-green-200"
                : "hover:bg-red-200"
            }`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <main
        className={`flex min-h-0 flex-1 flex-col px-4 py-4 md:px-6 lg:px-8 ${
          passageExpanded ? "gap-0 py-2" : "gap-3"
        }`}
      >
        {/* Nav row */}
        {!passageExpanded && (
          <div className="flex items-center justify-between">
            <NavButton onClick={() => router.back()}>
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              <span>Previous</span>
            </NavButton>

            <NavButton variant="outlined" onClick={handleStartNew} disabled={!hasPassage}>
              <RotateCcw className="h-4 w-4" />
              <span>Start New</span>
            </NavButton>
          </div>
        )}

        {/* Two-column layout: left content + right ComprehensionBreakdown */}
        <div className="flex min-h-0 flex-1 gap-4">
          {/* Left column */}
          <div
            className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${
              passageExpanded ? "gap-0" : "gap-3 px-2"
            }`}
          >
            {!passageExpanded && isLoadingClasses && (
              <>
                <div className="h-18 animate-pulse rounded-4xl border border-[#54A4FF] bg-[#EFFDFF] shadow-[0px_1px_20px_rgba(108,164,239,0.37)]" />
                <div className="flex gap-3">
                  <div className="h-10.5 flex-1 animate-pulse rounded-[10px] border border-[#54A4FF] bg-[#D5E7FE]" />
                  <div className="h-10.5 flex-1 animate-pulse rounded-[10px] border border-[#54A4FF] bg-[#D5E7FE]" />
                  <div className="h-10.5 flex-1 animate-pulse rounded-[10px] border border-[#54A4FF] bg-[#D5E7FE]" />
                  <div className="h-10.5 w-35 shrink-0 animate-pulse rounded-lg bg-[#2E2E68]/30" />
                </div>
              </>
            )}

            {!passageExpanded && !isLoadingClasses && (
              <StudentInfoBar
                studentName={studentName}
                gradeLevel={gradeLevel}
                classes={classNames}
                selectedClassName={selectedClassName}
                onStudentNameChange={setStudentName}
                onGradeLevelChange={setGradeLevel}
                onClassCreated={() => {
                  queryClient.invalidateQueries({
                    queryKey: ["classes", schoolYear],
                  });
                }}
                onStudentSelected={(studentId: string) =>
                  setSelectedStudentId(studentId)
                }
                onClassChange={setSelectedClassName}
                onClear={handleStartNew}
              />
            )}

            {!passageExpanded && !isLoadingClasses && (
              <PassageFilters
                language={hasPassage ? selectedLanguage : undefined}
                passageLevel={hasPassage ? selectedLevel : undefined}
                testType={hasPassage ? selectedTestType : undefined}
                hasPassage={hasPassage}
                onOpenPassageModal={() => setIsPassageModalOpen(true)}
              />
            )}

            <PassageDisplay
              content={passageContent}
              expanded={passageExpanded}
              onToggleExpand={() => setPassageExpanded((prev) => !prev)}
              passageLevel={selectedLevel}
              resizable={true}
            />

            {!passageExpanded && hasPassage && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#00306E]">
                  {wordCount} words
                </span>
                {estimatedReadingTime && (
                  <span
                    className="flex items-center gap-1 text-xs font-medium text-[#6666FF]"
                    title={`Est. reading time: ${estimatedReadingTime}`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {estimatedReadingTime}
                  </span>
                )}
              </div>
            )}

            {!passageExpanded && hasPassage && (
              <div className="mb-4 flex items-center justify-center">
                <span className="text-lg font-bold text-[#31318A] md:text-xl">
                  {selectedTitle}
                </span>
              </div>
            )}

            {/* Continue to Comprehension button — centered like Start Reading */}
            {!passageExpanded && !showQuestions && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleContinueToComprehension}
                  disabled={!hasPassage || !studentName.trim() || !gradeLevel || !selectedClassName}
                  className={`rounded-lg px-10 py-2.5 text-sm font-semibold text-white transition-all duration-200 md:px-12 md:py-3 md:text-[15px] ${
                    !hasPassage || !studentName.trim() || !gradeLevel || !selectedClassName
                      ? "bg-[#2E2E68]/30 cursor-not-allowed opacity-60 shadow-none"
                      : "bg-[#2E2E68] shadow-[0px_1px_20px_rgba(108,164,239,0.37)] hover:brightness-110"
                  }`}
                  title={
                    !studentName.trim() || !gradeLevel || !selectedClassName
                      ? "Enter student information first"
                      : !hasPassage
                        ? "Add a passage first"
                        : undefined
                  }
                >
                  Continue to Comprehension
                </button>
              </div>
            )}

            {/* ── Comprehension Questions Section ── */}
            {!passageExpanded && showQuestions && (
              <div ref={questionsRef} className="flex flex-col gap-4 pt-6">
                <ComprehensionInfoBar
                  totalQuestions={questions.length}
                  formattedTime={formattedTime}
                  isPaused={isPaused}
                  isSubmitted={isSubmitted}
                  onTogglePause={() => {
                    if (!isSubmitted) setIsPaused((prev) => !prev);
                  }}
                />

                {isLoadingQuestions && (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[#6666FF]" />
                      <span className="text-sm font-medium text-[#00306E]">
                        Loading questions...
                      </span>
                    </div>
                  </div>
                )}

                {questionsLoadError && (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-sm font-medium text-red-600">
                      {questionsLoadError}
                    </p>
                  </div>
                )}

                {!isLoadingQuestions && !questionsLoadError && (
                  <>
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
                      onTryAgain={handleTryAgain}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right column: ComprehensionBreakdown */}
          {!passageExpanded && (
            <div className="w-60 shrink-0 self-stretch md:w-67.5 lg:w-75 xl:w-[320px]">
              <ComprehensionBreakdown
                score={comprehensionResult?.score}
                totalItems={comprehensionResult?.totalItems}
                level={comprehensionResult?.level}
                tagBreakdown={comprehensionResult?.tagBreakdown}
                disabled={!isSubmitted}
                highlightedTag={highlightedTag}
                onTagClick={handleTagClick}
                showReportButton={true}
                reportHref="/dashboard/reading-comprehension-test/report"
              />
            </div>
          )}
        </div>
      </main>

      <AddPassageModal
        isOpen={isPassageModalOpen}
        onClose={() => setIsPassageModalOpen(false)}
        onSelectPassage={handleSelectPassage}
      />
    </div>
  );
}
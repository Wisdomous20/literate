"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  Clock,
  BookOpen,
  ClipboardCheck,
  FileText,
  CheckCircle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { QuestionCard } from "@/components/reading-comprehension-test/questionCard";
import type { QuestionData } from "@/components/reading-comprehension-test/questionCard";
import { ComprehensionSubmitArea } from "@/components/reading-comprehension-test/comprehensionSubmitArea";
import { ComprehensionBreakdown } from "@/components/oral-reading-test/comprehensionBreakdown";
import { getPassageTextStyle } from "@/components/oral-reading-test/passageDisplay";
import { FullScreenPassage } from "@/components/oral-reading-test/fullScreenPassage";

/* ─────────────── Types ─────────────── */

interface AssessmentLinkData {
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

/* ─────────────── Helpers ─────────────── */

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getAssessmentTitle(type: string): string {
  switch (type) {
    case "ORAL_READING":
      return "Oral Reading Test";
    case "COMPREHENSION":
      return "Reading Comprehension Test";
    case "READING_FLUENCY":
      return "Reading Fluency Test";
    default:
      return "Assessment";
  }
}

function getAssessmentIcon(type: string) {
  switch (type) {
    case "ORAL_READING":
      return <FileText className="h-5 w-5 text-[#1A6673]" />;
    case "COMPREHENSION":
      return <ClipboardCheck className="h-5 w-5 text-[#1A6673]" />;
    case "READING_FLUENCY":
      return <BookOpen className="h-5 w-5 text-[#1A6673]" />;
    default:
      return <FileText className="h-5 w-5 text-[#1A6673]" />;
  }
}

/* ─────────────── Main Component ─────────────── */

export default function StudentAssessmentPage() {
  const params = useParams();
  const token = params.token as string;

  // Loading & error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AssessmentLinkData | null>(null);

  // Assessment flow states
  const [step, setStep] = useState<"intro" | "passage" | "recording" | "questions" | "done">("intro");
  const [passageExpanded, setPassageExpanded] = useState(false);

  // Comprehension states
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [comprehensionResult, setComprehensionResult] = useState<ComprehensionResult | null>(null);
  const [highlightedTag, setHighlightedTag] = useState<"literal" | "inferential" | "critical" | null>(null);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fluency states
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioURL, setRecordedAudioURL] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeComplete, setTranscribeComplete] = useState(false);

  // ── Load assessment data ──
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/assess/${token}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error || "Failed to load assessment.");
          return;
        }

        setData(json);
      } catch {
        setError("Failed to load assessment. Please check your link.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [token]);

  // ── Timer for comprehension ──
  useEffect(() => {
    if (
      step === "questions" &&
      !isSubmitted &&
      !isPaused &&
      (data?.type === "COMPREHENSION" || data?.type === "ORAL_READING")
    ) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, isSubmitted, isPaused, data?.type]);

  // ── Questions from passage quiz ──
  const questions: QuestionData[] = useMemo(() => {
    if (!data?.passage?.quiz?.questions) return [];
    return data.passage.quiz.questions.map((q, idx) => ({
      id: q.id,
      questionNumber: idx + 1,
      questionText: q.questionText,
      type: q.type as "MULTIPLE_CHOICE" | "ESSAY",
      tags: q.tags,
      options: q.options as string[] | undefined,
    }));
  }, [data]);

  const handleSelectOption = useCallback(
    (questionId: string, option: string) => {
      if (isSubmitted) return;
      setAnswers((prev) => ({ ...prev, [questionId]: option }));
    },
    [isSubmitted],
  );

  const handleEssayChange = useCallback(
    (questionId: string, value: string) => {
      if (isSubmitted) return;
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    [isSubmitted],
  );

  const handleTagClick = (tag: "literal" | "inferential" | "critical") => {
    setHighlightedTag((prev) => (prev === tag ? null : tag));
  };

  // ── Submit comprehension answers ──
  const handleSubmitComprehension = useCallback(async () => {
    if (!data) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formattedAnswers = questions
        .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
        .map((q) => ({
          questionId: q.id,
          answer: answers[q.id],
        }));

      if (formattedAnswers.length === 0) {
        setSubmitError("Please answer at least one question before submitting.");
        setIsSubmitting(false);
        return;
      }

      // Use the appropriate API endpoint based on assessment type
      const endpoint =
        data.type === "ORAL_READING"
          ? "/api/oral-reading/comprehension"
          : "/api/comprehension/submit";

      const body: Record<string, unknown> =
        data.type === "ORAL_READING"
          ? { assessmentId: data.assessmentId, answers: formattedAnswers }
          : {
              studentId: data.student.id,
              passageId: data.passage.id,
              answers: formattedAnswers,
              assessmentId: data.assessmentId,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setSubmitError(result.error || "Failed to submit answers.");
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

      setComprehensionResult({
        score: result.score,
        totalItems: result.totalItems,
        level: result.level,
        comprehensionTestId: result.comprehensionTestId,
        tagBreakdown,
      });

      setIsSubmitted(true);

      // Mark shareable link as used
      try {
        await fetch(`/api/assess/${token}/complete`, { method: "POST" });
      } catch {
        // Non-critical, assessment is already submitted
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [data, questions, answers, token]);

  // ── Fluency: handle recording done ──
  const handleFullScreenDone = useCallback(
    async (
      elapsedSecs: number,
      audioURL: string | null,
      audioBlob: Blob | null,
    ) => {
      setRecordedSeconds(elapsedSecs);
      setRecordedAudioURL(audioURL);
      setRecordedAudioBlob(audioBlob);
      setIsFullScreen(false);
      setHasRecording(true);

      if (!data || !audioBlob) return;

      // Submit fluency recording
      setIsTranscribing(true);
      try {
        const formData = new FormData();
        formData.append("studentId", data.student.id);
        formData.append("passageId", data.passage.id);
        formData.append("audio", audioBlob, "recording.wav");
        formData.append("audioUrl", "");

        const endpoint =
          data.type === "READING_FLUENCY"
            ? `/api/fluency-reading/${data.assessmentId}`
            : `/api/oral-reading/transcribe`;

        // For oral reading, we already have an assessment
        if (data.type === "ORAL_READING") {
          formData.append("assessmentId", data.assessmentId);
        }

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (response.ok && (result.success || result.assessmentId)) {
          setTranscribeComplete(true);

          // For oral reading, proceed to comprehension
          if (data.type === "ORAL_READING" && questions.length > 0) {
            setStep("questions");
          } else if (data.type === "READING_FLUENCY") {
            // Mark link as used
            try {
              await fetch(`/api/assess/${token}/complete`, { method: "POST" });
            } catch {
              // Non-critical
            }
            setStep("done");
          }
        }
      } catch {
        setSubmitError("Failed to submit recording. Please try again.");
      } finally {
        setIsTranscribing(false);
      }
    },
    [data, questions, token],
  );

  const handleFullScreenClose = useCallback(() => {
    setIsFullScreen(false);
  }, []);

  // ── Passage text style ──
  const passageTextStyle = useMemo(
    () => getPassageTextStyle(data ? `Grade ${data.passage.level}` : undefined),
    [data],
  );

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#E4F4FF]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#6666FF]" />
          <p className="text-[#00306E] font-medium">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#E4F4FF] px-4">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 border border-red-200">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-[#00306E]">
            Unable to Load Assessment
          </h1>
          <p className="text-sm text-[#6B7DB3]">
            {error || "Assessment not found."}
          </p>
        </div>
      </div>
    );
  }

  // ── Full screen reading (oral reading / fluency) ──
  if (isFullScreen) {
    return (
      <FullScreenPassage
        content={data.passage.content}
        passageTitle={data.passage.title}
        onDone={handleFullScreenDone}
        onClose={handleFullScreenClose}
        countdownEnabled={true}
        countdownSeconds={3}
        passageLevel={`Grade ${data.passage.level}`}
      />
    );
  }

  // ── Transcription in progress ──
  if (isTranscribing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#E4F4FF]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#6666FF]" />
          <p className="text-[#00306E] font-medium">
            Processing your recording...
          </p>
          <p className="text-xs text-[#6B7DB3]">
            This may take a moment. Please don&apos;t close this page.
          </p>
        </div>
      </div>
    );
  }

  // ── Done state ──
  if (step === "done") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#E4F4FF] px-4">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 border border-green-200">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-[#00306E]">
            Assessment Complete!
          </h1>
          <p className="text-sm text-[#6B7DB3]">
            Your assessment has been submitted successfully. Your teacher will
            review the results.
          </p>
          {comprehensionResult && (
            <div className="mt-4 w-full max-w-xs">
              <ComprehensionBreakdown
                score={comprehensionResult.score}
                totalItems={comprehensionResult.totalItems}
                level={comprehensionResult.level}
                tagBreakdown={comprehensionResult.tagBreakdown}
                disabled={false}
                highlightedTag={highlightedTag}
                onTagClick={handleTagClick}
                showReportButton={false}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Time remaining ──
  const expiresAt = new Date(data.expiresAt);
  const now = new Date();
  const minutesRemaining = Math.max(
    0,
    Math.round((expiresAt.getTime() - now.getTime()) / 60000),
  );
  const hoursRemaining = Math.floor(minutesRemaining / 60);
  const minsRemaining = minutesRemaining % 60;
  const timeRemainingText =
    hoursRemaining > 0
      ? `${hoursRemaining}h ${minsRemaining}m`
      : `${minsRemaining}m`;

  // ── Intro screen ──
  if (step === "intro") {
    const needsRecording =
      data.type === "ORAL_READING" || data.type === "READING_FLUENCY";
    const hasQuiz = questions.length > 0;

    return (
      <div className="flex min-h-screen flex-col bg-[#E4F4FF]">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#8D8DEC] bg-white/60 px-6 py-4 shadow-[0_4px_4px_#54A4FF]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(74,74,252,0.06)] border border-[#DAE6FF]">
            {getAssessmentIcon(data.type)}
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#00306E]">
              {getAssessmentTitle(data.type)}
            </h1>
            <p className="text-xs text-[#6B7DB3]">Shared Assessment</p>
          </div>
        </div>

        {/* Content */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg space-y-6">
            {/* Student info card */}
            <div className="rounded-4xl border border-[#54A4FF] bg-[#EFFDFF] p-6 shadow-[0px_1px_20px_rgba(108,164,239,0.37)]">
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-[#6B7DB3] uppercase tracking-wider">
                    Student
                  </span>
                  <p className="text-lg font-bold text-[#00306E]">
                    {data.student.name}
                  </p>
                </div>
                {data.student.level && (
                  <div>
                    <span className="text-xs font-semibold text-[#6B7DB3] uppercase tracking-wider">
                      Grade Level
                    </span>
                    <p className="text-sm font-semibold text-[#00306E]">
                      Grade {data.student.level}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-xs font-semibold text-[#6B7DB3] uppercase tracking-wider">
                    Passage
                  </span>
                  <p className="text-sm font-semibold text-[#00306E]">
                    {data.passage.title}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Clock className="h-3.5 w-3.5 text-[#6B7DB3]" />
                  <span className="text-xs font-medium text-[#6B7DB3]">
                    Link expires in {timeRemainingText}
                  </span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-4xl border border-[#54A4FF] bg-[#FEFFFD] p-6 shadow-[0_1px_20px_rgba(108,164,239,0.37)]">
              <h2 className="text-sm font-bold text-[#00306E] mb-3">
                Instructions
              </h2>
              <div className="space-y-2 text-xs text-[#6B7DB3]">
                {needsRecording && (
                  <p>
                    1. You will read the passage aloud while your voice is
                    recorded.
                  </p>
                )}
                {needsRecording && hasQuiz && (
                  <p>
                    2. After reading, you will answer comprehension questions
                    about the passage.
                  </p>
                )}
                {!needsRecording && hasQuiz && (
                  <>
                    <p>1. Read the passage carefully.</p>
                    <p>2. Answer the comprehension questions.</p>
                  </>
                )}
                <p className="pt-1 font-medium text-[#31318A]">
                  Make sure you are in a quiet environment
                  {needsRecording && " and your microphone is working"}.
                </p>
              </div>
            </div>

            {/* Start button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  if (needsRecording) {
                    setStep("recording");
                    setIsFullScreen(true);
                  } else {
                    setStep("passage");
                  }
                }}
                className="rounded-lg bg-[#2E2E68] px-12 py-3 text-sm font-semibold text-white shadow-[0px_1px_20px_rgba(108,164,239,0.37)] transition-all hover:brightness-110"
              >
                {needsRecording ? "Start Reading" : "Start Assessment"}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Passage reading (comprehension-only flow) ──
  if (step === "passage") {
    const wordCount = data.passage.content.split(/\s+/).filter(Boolean).length;

    return (
      <div className="flex min-h-screen flex-col bg-[#E4F4FF]">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#8D8DEC] bg-white/60 px-6 py-4 shadow-[0_4px_4px_#54A4FF]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(74,74,252,0.06)] border border-[#DAE6FF]">
            {getAssessmentIcon(data.type)}
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#00306E]">
              {getAssessmentTitle(data.type)}
            </h1>
            <p className="text-xs text-[#6B7DB3]">
              {data.student.name} — {data.passage.title}
            </p>
          </div>
        </div>

        <main className="flex flex-1 flex-col items-center px-4 py-6 md:px-8 lg:px-12">
          <div className="w-full max-w-4xl space-y-4">
            {/* Passage title */}
            <div className="flex items-center justify-center">
              <span className="text-lg font-bold text-[#31318A]">
                {data.passage.title}
              </span>
            </div>

            {/* Passage content */}
            <div
              className={`relative rounded-[10px] border border-[#54A4FF] bg-[#EFFDFF] shadow-[0px_1px_20px_rgba(108,164,239,0.37)] ${
                passageExpanded
                  ? "fixed inset-0 z-50 m-0 rounded-none"
                  : ""
              }`}
            >
              {/* Expand toggle */}
              <button
                type="button"
                onClick={() => setPassageExpanded((prev) => !prev)}
                className="absolute right-4 top-4 z-20 flex h-7 w-7 items-center justify-center rounded-md bg-[rgba(84,164,255,0.15)] transition-colors hover:opacity-80 md:right-5"
                title={
                  passageExpanded ? "Collapse passage" : "Expand passage"
                }
              >
                {passageExpanded ? (
                  <Minimize2 className="h-3.5 w-3.5 text-[#1A5FB4]" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5 text-[#1A5FB4]" />
                )}
              </button>

              <div
                className={`overflow-auto p-6 md:p-8 ${
                  passageExpanded ? "h-full" : "max-h-[60vh]"
                }`}
              >
                <p
                  className="whitespace-pre-wrap text-center leading-relaxed text-[#00306E]"
                  style={passageTextStyle}
                >
                  {data.passage.content}
                </p>
              </div>
            </div>

            {/* Word count */}
            {!passageExpanded && (
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-[#00306E]">
                  {wordCount} words
                </span>
              </div>
            )}

            {/* Continue to questions */}
            {!passageExpanded && questions.length > 0 && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep("questions")}
                  className="rounded-lg bg-[#2E2E68] px-10 py-2.5 text-sm font-semibold text-white shadow-[0px_1px_20px_rgba(108,164,239,0.37)] transition-all hover:brightness-110"
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

  // ── Questions view ──
  if (step === "questions") {
    return (
      <div className="flex min-h-screen flex-col bg-[#E4F4FF]">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#8D8DEC] bg-white/60 px-6 py-4 shadow-[0_4px_4px_#54A4FF]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(74,74,252,0.06)] border border-[#DAE6FF]">
            {getAssessmentIcon(data.type)}
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#00306E]">
              {getAssessmentTitle(data.type)}
            </h1>
            <p className="text-xs text-[#6B7DB3]">
              {data.student.name} — {data.passage.title}
            </p>
          </div>
        </div>

        <main className="flex flex-1 px-4 py-6 md:px-8 lg:px-12">
          <div className="flex w-full max-w-6xl mx-auto gap-6">
            {/* Main column */}
            <div className="flex-1 space-y-4 min-w-0">
              {/* Info bar */}
              <div className="flex items-center justify-between rounded-4xl border border-[#54A4FF] bg-[#EFFDFF] px-6 py-3 shadow-[0px_1px_20px_rgba(108,164,239,0.37)]">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-[#00306E]">
                    {questions.length} Questions
                  </span>
                  <div className="h-4 w-px bg-[#DAE6FF]" />
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#6666FF]" />
                    <span className="text-xs font-medium text-[#6666FF]">
                      {formatTime(elapsedSeconds)}
                    </span>
                  </div>
                </div>
                {!isSubmitted && (
                  <button
                    type="button"
                    onClick={() => setIsPaused((prev) => !prev)}
                    className="text-xs font-semibold text-[#6666FF] hover:text-[#5555EE]"
                  >
                    {isPaused ? "Resume" : "Pause"}
                  </button>
                )}
              </div>

              {/* Show passage toggle for comprehension */}
              {data.type === "COMPREHENSION" && (
                <button
                  type="button"
                  onClick={() => setStep("passage")}
                  className="text-xs font-semibold text-[#6666FF] hover:text-[#5555EE] transition-colors"
                >
                  ← View Passage
                </button>
              )}

              {/* Questions */}
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

              {/* Submit area */}
              <ComprehensionSubmitArea
                isSubmitting={isSubmitting}
                isSubmitted={isSubmitted}
                submitError={submitError}
                onSubmit={handleSubmitComprehension}
              />

              {/* Done button after submission */}
              {isSubmitted && (
                <div className="flex justify-center pb-8">
                  <button
                    type="button"
                    onClick={() => setStep("done")}
                    className="rounded-lg bg-[#6666FF] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#5555EE] transition-colors"
                  >
                    Finish
                  </button>
                </div>
              )}
            </div>

            {/* Comprehension breakdown sidebar */}
            <div className="hidden md:block w-60 shrink-0 lg:w-72 xl:w-80">
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
        </main>
      </div>
    );
  }

  return null;
}
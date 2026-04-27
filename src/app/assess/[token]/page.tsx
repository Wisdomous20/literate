"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { FullScreenPassage } from "@/components/oral-reading-test/fullScreenPassage";
import { getPassageTextStyle } from "@/components/oral-reading-test/passageDisplay";
import { IntroStep } from "@/components/assess-token/introStep";
import { PassageStep, QuestionsStep } from "@/components/assess-token/readingStep";
import { ResultsStep } from "@/components/assess-token/resultsStep";
import {
  CenteredPageState,
  PageStateCard,
} from "@/components/assess-token/ui";
import type {
  AssessmentLinkData,
  ComprehensionResult,
  FluencyResult,
} from "@/components/assess-token/types";
import type { QuestionData } from "@/components/reading-comprehension-test/questionCard";

type Step = "intro" | "passage" | "recording" | "questions" | "done";
type HighlightedTag = "literal" | "inferential" | "critical" | null;

function toQuestions(data: AssessmentLinkData | null): QuestionData[] {
  if (!data?.passage?.quiz?.questions) return [];

  return data.passage.quiz.questions.map((question, index) => ({
    id: question.id,
    questionNumber: index + 1,
    questionText: question.questionText,
    type: question.type as "MULTIPLE_CHOICE" | "ESSAY",
    tags: question.tags,
    options: question.options as string[] | undefined,
  }));
}

function buildTagBreakdown(
  answers: Array<{ tag: string; isCorrect: boolean }> | undefined,
) {
  if (!answers) return undefined;

  const breakdown = {
    literal: { correct: 0, total: 0 },
    inferential: { correct: 0, total: 0 },
    critical: { correct: 0, total: 0 },
  };

  for (const answer of answers) {
    if (answer.tag === "Literal") {
      breakdown.literal.total++;
      if (answer.isCorrect) breakdown.literal.correct++;
    } else if (answer.tag === "Inferential") {
      breakdown.inferential.total++;
      if (answer.isCorrect) breakdown.inferential.correct++;
    } else if (answer.tag === "Critical") {
      breakdown.critical.total++;
      if (answer.isCorrect) breakdown.critical.correct++;
    }
  }

  return breakdown;
}

function getTimeRemainingText(expiresAt: string) {
  const end = new Date(expiresAt);
  const now = new Date();
  const minutesRemaining = Math.max(
    0,
    Math.round((end.getTime() - now.getTime()) / 60000),
  );
  const hoursRemaining = Math.floor(minutesRemaining / 60);
  const minsRemaining = minutesRemaining % 60;

  return hoursRemaining > 0
    ? `${hoursRemaining}h ${minsRemaining}m`
    : `${minsRemaining}m`;
}

export default function StudentAssessmentPage() {
  const params = useParams();
  const token = params.token as string;

  const [step, setStep] = useState<Step>("intro");
  const [isLoading, setIsLoading] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [passageExpanded, setPassageExpanded] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [data, setData] = useState<AssessmentLinkData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fluencyResult, setFluencyResult] = useState<FluencyResult | null>(
    null,
  );
  const [comprehensionResult, setComprehensionResult] =
    useState<ComprehensionResult | null>(null);
  const [highlightedTag, setHighlightedTag] = useState<HighlightedTag>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function loadAssessment() {
      try {
        const response = await fetch(`/api/assess/${token}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(result.error || "Failed to load assessment.");
          return;
        }

        setData(result);
      } catch {
        setError("Failed to load assessment. Please check your link.");
      } finally {
        setIsLoading(false);
      }
    }

    loadAssessment();
  }, [token]);

  useEffect(() => {
    if (
      step === "questions" &&
      !isSubmitted &&
      !isPaused &&
      (data?.type === "COMPREHENSION" || data?.type === "ORAL_READING")
    ) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((previous) => previous + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [data?.type, isPaused, isSubmitted, step]);

  const questions = useMemo(() => toQuestions(data), [data]);

  const needsRecording =
    data?.type === "ORAL_READING" || data?.type === "READING_FLUENCY";
  const timeRemainingText = data ? getTimeRemainingText(data.expiresAt) : "";
  const passageTextStyle = useMemo(
    () => getPassageTextStyle(data ? `Grade ${data.passage.level}` : undefined),
    [data],
  );

  const markLinkAsUsed = useCallback(async () => {
    try {
      await fetch(`/api/assess/${token}/complete`, { method: "POST" });
    } catch {
      // Link completion is best-effort only.
    }
  }, [token]);

  const handleSelectOption = useCallback(
    (questionId: string, option: string) => {
      if (isSubmitted) return;
      setAnswers((previous) => ({ ...previous, [questionId]: option }));
    },
    [isSubmitted],
  );

  const handleEssayChange = useCallback(
    (questionId: string, value: string) => {
      if (isSubmitted) return;
      setAnswers((previous) => ({ ...previous, [questionId]: value }));
    },
    [isSubmitted],
  );

  const handleTagClick = useCallback((tag: NonNullable<HighlightedTag>) => {
    setHighlightedTag((previous) => (previous === tag ? null : tag));
  }, []);

  const handleSubmitComprehension = useCallback(async () => {
    if (!data) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formattedAnswers = questions
        .filter((question) => answers[question.id] !== undefined && answers[question.id] !== "")
        .map((question) => ({
          questionId: question.id,
          answer: answers[question.id],
        }));

      if (formattedAnswers.length === 0) {
        setSubmitError("Please answer at least one question before submitting.");
        setIsSubmitting(false);
        return;
      }

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

      setComprehensionResult({
        score: result.score,
        totalItems: result.totalItems,
        level: result.level,
        comprehensionTestId: result.comprehensionTestId,
        tagBreakdown: buildTagBreakdown(result.answers),
      });
      setIsSubmitted(true);
      await markLinkAsUsed();
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, data, markLinkAsUsed, questions]);

  const handleFullScreenDone = useCallback(
    async (
      elapsedSecs: number,
      _audioUrl: string | null,
      audioBlob: Blob | null,
    ) => {
      setIsFullScreen(false);
      if (!data || !audioBlob) return;

      setIsTranscribing(true);
      setSubmitError(null);

      try {
        const { convertToWav } = await import("@/utils/convertToWav");
        const { uploadAudio } = await import("@/utils/uploadAudio");

        const wavBlob = await convertToWav(audioBlob);
        const uploadedAudioUrl = await uploadAudio(
          wavBlob,
          data.student.id,
          data.passage.id,
        );

        if (!uploadedAudioUrl) {
          setSubmitError("Audio upload failed. Please try again.");
          setIsTranscribing(false);
          return;
        }

        const formData = new FormData();
        formData.append("studentId", data.student.id);
        formData.append("passageId", data.passage.id);
        formData.append("audio", wavBlob, "recording.wav");
        formData.append("audioUrl", uploadedAudioUrl);
        formData.append("assessmentId", data.assessmentId);

        const response = await fetch("/api/oral-reading/transcribe", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();

        if (!response.ok) {
          setSubmitError("Failed to submit recording. Please try again.");
          setIsTranscribing(false);
          return;
        }

        const targetAssessmentId = result.assessmentId || data.assessmentId;

        await new Promise<void>((resolve) => {
          const timeoutId = setTimeout(() => {
            clearInterval(interval);
            setSubmitError(
              "Analysis is taking longer than expected. Please try again.",
            );
            setIsTranscribing(false);
            resolve();
          }, 120000);

          const interval = setInterval(async () => {
            try {
              const statusResponse = await fetch(
                `/api/oral-reading/transcribe?assessmentId=${targetAssessmentId}`,
              );
              const status = await statusResponse.json();

              if (status.status === "COMPLETED" && status.analysis) {
                clearInterval(interval);
                clearTimeout(timeoutId);

                const analysis = status.analysis;
                const passageWords = data.passage.content
                  .split(/\s+/)
                  .filter(Boolean).length;
                const totalMiscues = analysis.totalMiscues ?? 0;
                const duration = analysis.duration ?? elapsedSecs;
                const wordsCorrect = Math.max(0, passageWords - totalMiscues);
                const wcpm =
                  duration > 0 ? Math.round((wordsCorrect / duration) * 60) : 0;

                const miscueBreakdown: Record<string, number> = {};
                for (const miscue of analysis.miscues ?? []) {
                  miscueBreakdown[miscue.miscueType] =
                    (miscueBreakdown[miscue.miscueType] || 0) + 1;
                }

                setFluencyResult({
                  wcpm,
                  readingTimeSeconds: Math.round(duration),
                  classificationLevel: analysis.classificationLevel ?? "--",
                  totalWords: passageWords,
                  totalMiscues,
                  oralFluencyScore: analysis.oralFluencyScore ?? 0,
                  miscueBreakdown,
                  behaviors: (analysis.behaviors ?? []).map(
                    (behavior: { behaviorType: string }) => behavior.behaviorType,
                  ),
                });

                if (data.type === "ORAL_READING" && questions.length > 0) {
                  setStep("questions");
                } else {
                  await markLinkAsUsed();
                  setStep("done");
                }

                setIsTranscribing(false);
                resolve();
                return;
              }

              if (status.status === "FAILED") {
                clearInterval(interval);
                clearTimeout(timeoutId);
                setSubmitError("Analysis failed. Please try recording again.");
                setIsTranscribing(false);
                resolve();
              }
            } catch {
              // Keep polling on transient failures.
            }
          }, 3000);
        });
      } catch {
        setSubmitError("Failed to submit recording. Please try again.");
        setIsTranscribing(false);
      }
    },
    [data, markLinkAsUsed, questions.length],
  );

  if (isLoading) {
    return (
      <CenteredPageState>
        <PageStateCard
          icon="loading"
          title="Loading assessment"
          message="Preparing the shared assessment workspace."
        />
      </CenteredPageState>
    );
  }

  if (error || !data) {
    return (
      <CenteredPageState>
        <PageStateCard
          icon="error"
          tone="danger"
          title="Unable to load assessment"
          message={error || "Assessment not found."}
        />
      </CenteredPageState>
    );
  }

  if (isFullScreen) {
    return (
      <FullScreenPassage
        content={data.passage.content}
        passageTitle={data.passage.title}
        onDone={handleFullScreenDone}
        onClose={() => setIsFullScreen(false)}
        countdownEnabled={true}
        countdownSeconds={3}
        passageLevel={`Grade ${data.passage.level}`}
      />
    );
  }

  if (isTranscribing) {
    return (
      <CenteredPageState>
        <PageStateCard
          icon="loading"
          title="Processing your recording"
          message="We're analyzing the reading sample now. Please keep this page open for a moment."
        />
      </CenteredPageState>
    );
  }

  if (step === "done") {
    return (
      <ResultsStep
        data={data}
        fluencyResult={fluencyResult}
        comprehensionResult={comprehensionResult}
        highlightedTag={highlightedTag}
        onTagClick={handleTagClick}
      />
    );
  }

  if (step === "intro") {
    return (
      <IntroStep
        data={data}
        timeRemainingText={timeRemainingText}
        needsRecording={Boolean(needsRecording)}
        hasQuiz={questions.length > 0}
        onStart={() => {
          if (needsRecording) {
            setStep("recording");
            setIsFullScreen(true);
          } else {
            setStep("passage");
          }
        }}
      />
    );
  }

  if (step === "passage") {
    return (
      <PassageStep
        data={data}
        wordCount={data.passage.content.split(/\s+/).filter(Boolean).length}
        passageExpanded={passageExpanded}
        onToggleExpanded={() => setPassageExpanded((previous) => !previous)}
        questionsCount={questions.length}
        onContinue={() => setStep("questions")}
        passageTextStyle={passageTextStyle}
      />
    );
  }

  if (step === "questions") {
    return (
      <QuestionsStep
        data={data}
        questions={questions}
        answers={answers}
        elapsedSeconds={elapsedSeconds}
        isPaused={isPaused}
        isSubmitted={isSubmitted}
        submitError={submitError}
        isSubmitting={isSubmitting}
        comprehensionResult={comprehensionResult}
        highlightedTag={highlightedTag}
        onTogglePause={() => setIsPaused((previous) => !previous)}
        onViewPassage={() => setStep("passage")}
        onSelectOption={handleSelectOption}
        onEssayChange={handleEssayChange}
        onSubmit={handleSubmitComprehension}
        onFinish={() => setStep("done")}
        onTagClick={handleTagClick}
      />
    );
  }

  return null;
}

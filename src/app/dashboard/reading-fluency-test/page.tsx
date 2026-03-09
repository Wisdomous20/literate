"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Timer,
  Minus,
  Plus,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import StudentInfoBar from "@/components/oral-reading-test/studentInfoBar";
import { PassageFilters } from "@/components/oral-reading-test/passageFilters";
import { PassageDisplay } from "@/components/oral-reading-test/passageDisplay";
import { ReadingTimer } from "@/components/oral-reading-test/readingTimer";
import { MiscueAnalysis } from "@/components/reading-fluency-test/miscueAnalysis";
import { FullScreenPassage } from "@/components/oral-reading-test/fullScreenPassage";
import { AddPassageModal } from "@/components/oral-reading-test/addPassageModal";
import { ReadinessCheckButton } from "@/components/oral-reading-test/readinessCheck";
import { useClassList } from "@/lib/hooks/useClassList";
import { useQueryClient } from "@tanstack/react-query";
import { createStudent } from "@/app/actions/student/createStudent";
import { convertToWav } from "@/utils/convertToWav";
import type { OralFluencyAnalysis } from "@/types/oral-reading";

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

const STORAGE_KEY = "reading-fluency-session";
const AUDIO_STORAGE_KEY = "reading-fluency-audio";

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
  countdownEnabled: boolean;
  countdownSeconds: number;
  hasRecording: boolean;
  recordedSeconds: number;
  analysisResult?: OralFluencyAnalysis | null;
  sessionId?: string;
  assessmentId?: string;
}

function loadSession(): Partial<SessionState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveSession(state: SessionState) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string): Blob {
  const [meta, data] = base64.split(",");
  const mimeMatch = meta.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "audio/wav";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export default function ReadingFluencyTestPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isRestoredRef = useRef(true);

  const [passageContent, setPassageContent] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [recordedAudioURL, setRecordedAudioURL] = useState<string | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [hasRecording, setHasRecording] = useState(false);
  const [countdownEnabled, setCountdownEnabled] = useState(true);
  const [countdownSeconds, setCountdownSeconds] = useState(3);
  const [isPassageModalOpen, setIsPassageModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<
    string | undefined
  >();
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>();
  const [selectedTestType, setSelectedTestType] = useState<
    string | undefined
  >();
  const [selectedTitle, setSelectedTitle] = useState<string | undefined>();
  const [selectedPassage, setSelectedPassage] = useState<string | undefined>();
  const [studentName, setStudentName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<OralFluencyAnalysis | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [highlightedTypes, setHighlightedTypes] = useState<Set<string>>(
    new Set(),
  );
  const [passageExpanded, setPassageExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // TanStack-cached class list
  const schoolYear = getCurrentSchoolYear();
  const { data: classListData = [], isLoading: isLoadingClasses } =
    useClassList(schoolYear);

  const classes = useMemo(
    () => classListData.map((c) => ({ id: c.id, name: c.name })),
    [classListData],
  );

  const handleJumpToTime = useCallback((timestamp: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = timestamp;
    audio.play().catch(() => {});
  }, []);

  const toggleHighlightType = useCallback((miscueType: string) => {
    setHighlightedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(miscueType)) {
        next.delete(miscueType);
      } else {
        next.add(miscueType);
      }
      return next;
    });
  }, []);

  const filteredMiscues = useMemo(() => {
    if (!analysisResult?.miscues) return undefined;
    if (highlightedTypes.size === 0) return analysisResult.miscues;
    return analysisResult.miscues.filter((m) =>
      highlightedTypes.has(m.miscueType),
    );
  }, [analysisResult?.miscues, highlightedTypes]);

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
    if (loaded.countdownEnabled !== undefined)
      setCountdownEnabled(loaded.countdownEnabled);
    if (loaded.countdownSeconds !== undefined)
      setCountdownSeconds(loaded.countdownSeconds);
    if (loaded.hasRecording !== undefined) setHasRecording(loaded.hasRecording);
    if (loaded.recordedSeconds !== undefined)
      setRecordedSeconds(loaded.recordedSeconds);
    if (loaded.analysisResult) setAnalysisResult(loaded.analysisResult);
    if (loaded.sessionId) setSessionId(loaded.sessionId);
    if (loaded.assessmentId) setAssessmentId(loaded.assessmentId);

    try {
      const audioBase64 = sessionStorage.getItem(AUDIO_STORAGE_KEY);
      if (audioBase64 && loaded.hasRecording) {
        const blob = base64ToBlob(audioBase64);
        const url = URL.createObjectURL(blob);
        setRecordedAudioBlob(blob);
        setRecordedAudioURL(url);
      }
    } catch (err) {
      console.error("Failed to restore audio:", err);
    }

    setIsHydrated(true);

    const timer = setTimeout(() => {
      isRestoredRef.current = false;
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (recordedAudioBlob) {
      blobToBase64(recordedAudioBlob).then((base64) => {
        try {
          sessionStorage.setItem(AUDIO_STORAGE_KEY, base64);
        } catch (err) {
          console.error("Failed to save audio to sessionStorage:", err);
        }
      });
    } else {
      sessionStorage.removeItem(AUDIO_STORAGE_KEY);
    }
  }, [recordedAudioBlob, isHydrated]);

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
      countdownEnabled,
      countdownSeconds,
      hasRecording,
      recordedSeconds,
      analysisResult,
      sessionId,
      assessmentId,
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
    countdownEnabled,
    countdownSeconds,
    hasRecording,
    recordedSeconds,
    analysisResult,
    sessionId,
    assessmentId,
  ]);

  const hasPassage = passageContent.length > 0;

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
      setHasRecording(false);
      setRecordedSeconds(0);
      setRecordedAudioBlob(null);
      setAnalysisResult(null);
      setSessionId("");
      setAssessmentId("");
      if (recordedAudioURL) {
        URL.revokeObjectURL(recordedAudioURL);
        setRecordedAudioURL(null);
      }
    },
    [recordedAudioURL],
  );

  const handleStartReading = useCallback(() => {
    if (!hasPassage) return;
    setIsFullScreen(true);
    setHasRecording(false);
    if (recordedAudioURL) {
      URL.revokeObjectURL(recordedAudioURL);
      setRecordedAudioURL(null);
    }
  }, [hasPassage, recordedAudioURL]);

  const handleFullScreenDone = useCallback(
    (
      elapsedSeconds: number,
      audioURL: string | null,
      audioBlob: Blob | null,
    ) => {
      isRestoredRef.current = false;
      setRecordedSeconds(elapsedSeconds);
      setRecordedAudioURL(audioURL);
      setRecordedAudioBlob(audioBlob);
      setIsFullScreen(false);
      setHasRecording(true);
    },
    [],
  );

  const handleFullScreenClose = useCallback(() => {
    setIsFullScreen(false);
  }, []);

  const handleTryAgain = useCallback(() => {
    setHasRecording(false);
    setRecordedSeconds(0);
    setAnalysisResult(null);
    setSessionId("");
    setAssessmentId("");
    if (recordedAudioURL) {
      URL.revokeObjectURL(recordedAudioURL);
      setRecordedAudioURL(null);
    }
  }, [recordedAudioURL]);

  const handleStartNew = useCallback(() => {
    if (recordedAudioURL) {
      URL.revokeObjectURL(recordedAudioURL);
    }
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
    setHasRecording(false);
    setRecordedSeconds(0);
    setRecordedAudioURL(null);
    setRecordedAudioBlob(null);
    setCountdownEnabled(true);
    setCountdownSeconds(3);
    setAnalysisResult(null);
    setSessionId("");
    setAssessmentId("");
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(AUDIO_STORAGE_KEY);
  }, [recordedAudioURL]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSubmitRecording = useCallback(async () => {
    if (!recordedAudioBlob || !selectedPassage) {
      return;
    }

    // Auto-create student if none selected
    let studentId = selectedStudentId;
    if (!studentId) {
      if (!studentName.trim() || !gradeLevel || !selectedClassName) {
        setToast({
          message:
            "Please enter a student name, select a grade level, and select a class.",
          type: "error",
        });
        return;
      }

      try {
        const result = await createStudent(
          studentName.trim(),
          Number(gradeLevel),
          selectedClassName,
        );
        if (!result.success || !("student" in result) || !result.student) {
          setToast({
            message: result.error || "Failed to create student.",
            type: "error",
          });
          return;
        }
        studentId = result.student.id;
        setSelectedStudentId(studentId);
        setToast({
          message: `Student "${studentName.trim()}" created successfully!`,
          type: "success",
        });
      } catch {
        setToast({
          message: "Something went wrong creating the student.",
          type: "error",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const { uploadAudioToSupabase } =
        await import("@/utils/uploadAudioToSupabase");
      const wavBlob = await convertToWav(recordedAudioBlob);

      const supabaseAudioUrl = await uploadAudioToSupabase(
        wavBlob,
        studentId,
        selectedPassage,
      );

      if (!supabaseAudioUrl) {
        return;
      }

      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("passageId", selectedPassage);
      formData.append("audioUrl", supabaseAudioUrl);
      formData.append("audio", wavBlob, "recording.wav");

      const response = await fetch(`/api/fluency-reading/${selectedPassage}`, {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        return;
      }

      if (!response.ok) {
        return;
      }

      if (result.analysis) {
        setAnalysisResult(result.analysis as OralFluencyAnalysis);
      }
      if (result.sessionId) {
        setSessionId(result.sessionId);
      }
      if (result.assessmentId) {
        setAssessmentId(result.assessmentId);
      }

      setToast({
        message: "Reading Fluency Session Successful!",
        type: "success",
      });
    } catch {
      setToast({
        message: "Failed to analyze reading fluency.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    recordedAudioBlob,
    selectedPassage,
    selectedStudentId,
    studentName,
    gradeLevel,
    selectedClassName,
  ]);

  const canSubmit =
    hasRecording &&
    recordedAudioBlob &&
    selectedPassage &&
    (selectedStudentId ||
      (studentName.trim() && gradeLevel && selectedClassName));

  useEffect(() => {
    if (isRestoredRef.current) return;
    if (canSubmit) {
      handleSubmitRecording();
    }
  }, [canSubmit, handleSubmitRecording]);

  if (isFullScreen) {
    return (
      <FullScreenPassage
        content={passageContent}
        passageTitle={selectedTitle}
        onDone={handleFullScreenDone}
        onClose={handleFullScreenClose}
        countdownEnabled={countdownEnabled}
        countdownSeconds={countdownSeconds}
      />
    );
  }

  const classNames = classes.map((c) => c.name);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DashboardHeader title="Reading Fluency Test" />

      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg transition-all duration-300 ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
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
        className={`flex min-h-0 flex-1 flex-col px-4 py-4 md:px-6 lg:px-8 ${passageExpanded ? "gap-0 py-2" : "gap-3"}`}
      >
        {/* Nav row */}
        {!passageExpanded && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-1.5 rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#5555EE] md:text-base shadow-[0_0_20px_rgba(102,102,255,0.4),0_4px_12px_rgba(102,102,255,0.3)]"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              <span>Previous</span>
            </button>
            <h2 className="flex-1 text-center text-base font-bold text-[#0C1A6D] md:text-lg lg:text-xl">
              Student Information
            </h2>
            <button
              type="button"
              onClick={() =>
                hasRecording &&
                router.push("/dashboard/reading-fluency-test/report")
              }
              aria-label="View reading fluency report"
              title="View reading fluency report"
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 md:text-base ${
                hasRecording
                  ? "animate-[pulseGlow_2s_ease-in-out_infinite] bg-[#6666FF] text-white shadow-[0_0_20px_rgba(102,102,255,0.4),0_4px_12px_rgba(102,102,255,0.3)] hover:bg-[#5555EE]"
                  : "cursor-not-allowed text-[#00306E]/40"
              }`}
              disabled={!hasRecording}
            >
              <span>View Report</span>
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </div>
        )}

        <div className="flex min-h-0 flex-1 gap-4">
          <div
            className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${passageExpanded ? "gap-0" : "gap-3"}`}
          >
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
                onStudentSelected={(id: string) => setSelectedStudentId(id)}
                onClassChange={setSelectedClassName}
              />
            )}

            {!passageExpanded && (
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
              miscues={filteredMiscues}
              onJumpToTime={handleJumpToTime}
              expanded={passageExpanded}
              onToggleExpand={() => setPassageExpanded((prev) => !prev)}
            />

            {!passageExpanded && hasPassage && (
              <div className="mt-2 flex items-center">
                <span className="text-xs font-semibold text-[#00306E]">
                  {passageContent.split(/\s+/).length} words
                </span>
              </div>
            )}

            {!passageExpanded && hasPassage && (
              <div className="mb-2 flex items-center justify-center">
                <span className="text-lg font-bold text-[#31318A] md:text-xl">
                  {selectedTitle}
                </span>
              </div>
            )}

            {!passageExpanded && (
              <ReadingTimer
                hasPassage={hasPassage}
                onStartReading={handleStartReading}
                hasRecording={hasRecording}
                recordedSeconds={recordedSeconds}
                recordedAudioURL={recordedAudioURL}
                onTryAgain={handleTryAgain}
                onStartNew={handleStartNew}
                audioRef={audioRef}
              />
            )}

            {!passageExpanded && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4" style={{ color: "#6666FF" }} />
                  <span className="text-xs font-medium text-[#31318A]">
                    Countdown
                  </span>
                  <button
                    type="button"
                    onClick={() => setCountdownEnabled(!countdownEnabled)}
                    aria-label={
                      countdownEnabled
                        ? "Disable countdown"
                        : "Enable countdown"
                    }
                    title={
                      countdownEnabled
                        ? "Disable countdown"
                        : "Enable countdown"
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                      countdownEnabled ? "bg-[#6666FF]" : "bg-[#C4C4FF]"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                        countdownEnabled
                          ? "translate-x-4.25"
                          : "translate-x-0.75"
                      }`}
                    />
                  </button>
                  {countdownEnabled && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCountdownSeconds(Math.max(1, countdownSeconds - 1))
                        }
                        aria-label="Decrease countdown seconds"
                        title="Decrease countdown seconds"
                        className="flex h-5 w-5 items-center justify-center rounded bg-[rgba(102,102,255,0.15)] transition-colors hover:opacity-70"
                      >
                        <Minus className="h-3 w-3 text-[#6666FF]" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold tabular-nums text-[#6666FF]">
                        {countdownSeconds}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCountdownSeconds(
                            Math.min(10, countdownSeconds + 1),
                          )
                        }
                        aria-label="Increase countdown seconds"
                        title="Increase countdown seconds"
                        className="flex h-5 w-5 items-center justify-center rounded bg-[rgba(102,102,255,0.15)] transition-colors hover:opacity-70"
                      >
                        <Plus className="h-3 w-3 text-[#6666FF]" />
                      </button>
                      <span className="text-[10px] font-medium text-[#31318A]">
                        sec
                      </span>
                    </div>
                  )}
                </div>

                <ReadinessCheckButton />
              </div>
            )}
          </div>

          <div className="w-60 shrink-0 self-stretch md:w-67.5 lg:w-75 xl:w-[320px]">
            <MiscueAnalysis
              disabled={!hasRecording}
              isAnalyzing={isSubmitting}
              miscues={analysisResult?.miscues}
              totalMiscue={analysisResult?.totalMiscues}
              oralFluencyScore={analysisResult?.oralFluencyScore}
              classificationLevel={analysisResult?.classificationLevel}
              highlightedTypes={highlightedTypes}
              onToggleHighlight={toggleHighlightType}
            />
          </div>
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

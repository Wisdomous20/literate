"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TestPageLayout } from "@/components/assessment/testPageLayout";
import { StudentSetupSection } from "@/components/assessment/studentSetupSection";
import { ClassificationPopup } from "@/components/oral-reading-test/classificationPopup";
import { PassageDisplay } from "@/components/oral-reading-test/passageDisplay";
import {
  ReadingTimer,
  AudioPlayer,
} from "@/components/oral-reading-test/readingTimer";
import { MiscueAnalysis } from "@/components/reading-fluency-test/miscueAnalysis";
import { FullScreenPassage } from "@/components/oral-reading-test/fullScreenPassage";
import { AddPassageModal } from "@/components/oral-reading-test/addPassageModal";
import { CountdownToggle } from "@/components/oral-reading-test/countdownToggle";
import { ReadinessCheckButton } from "@/components/oral-reading-test/readinessCheck";
import { useClassList } from "@/lib/hooks/useClassList";
import { useQueryClient } from "@tanstack/react-query";
import { createStudent } from "@/app/actions/student/createStudent";
import { convertToWav } from "@/utils/convertToWav";
import type { OralFluencyAnalysis } from "@/types/oral-reading";
import {
  exportFluencyReportPdf,
  buildFluencyReportData,
} from "@/lib/exportFluencyReportPdf";
import { ChevronLeft, RotateCcw } from "lucide-react";

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
  const [showMiscues, setShowMiscues] = useState(true);
  const [showClassificationPopup, setShowClassificationPopup] = useState(false);
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

  const resetHighlightTypes = useCallback(() => {
    setHighlightedTypes(new Set());
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

  // Show classification popup when analysis results first arrive
  useEffect(() => {
    if (analysisResult?.classificationLevel && !isRestoredRef.current) {
      setShowClassificationPopup(true);
    }
  }, [analysisResult?.classificationLevel]);

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
    if (!hasPassage || !studentName.trim() || !gradeLevel || !selectedClassName)
      return;
    setIsFullScreen(true);
    setHasRecording(false);
    if (recordedAudioURL) {
      URL.revokeObjectURL(recordedAudioURL);
      setRecordedAudioURL(null);
    }
  }, [
    hasPassage,
    studentName,
    gradeLevel,
    selectedClassName,
    recordedAudioURL,
  ]);

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
      const { uploadAudio } = await import("@/utils/uploadAudio");
      const wavBlob = await convertToWav(recordedAudioBlob);

      const AudioUrl = await uploadAudio(wavBlob, studentId, selectedPassage);

      if (!AudioUrl) {
        console.error("Audio upload failed");
        return;
      }

      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("passageId", selectedPassage);
      formData.append("audioUrl", AudioUrl);
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
        setToast({
          message: "Unexpected response from server.",
          type: "error",
        });
        return;
      }

      if (!response.ok) {
        setToast({
          message: result.error || "Failed to submit.",
          type: "error",
        });
        return;
      }

      // Store IDs immediately
      if (result.sessionId) setSessionId(result.sessionId);
      if (result.assessmentId) setAssessmentId(result.assessmentId);

      const targetAssessmentId = result.assessmentId;

      // If the response already has analysis (shouldn't with queue, but handle gracefully)
      if (result.analysis) {
        setAnalysisResult(result.analysis as OralFluencyAnalysis);
        setToast({
          message: "Reading Fluency Session Successful!",
          type: "success",
        });
      } else {
        // Poll for results
        setToast({
          message: "Analyzing recording... This may take a moment.",
          type: "success",
        });

        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(
              `/api/oral-reading/transcribe?assessmentId=${targetAssessmentId}`,
            );
            const statusData = await statusRes.json();

            if (statusData.status === "COMPLETED" && statusData.analysis) {
              clearInterval(pollInterval);
              setAnalysisResult(statusData.analysis as OralFluencyAnalysis);
              if (statusData.sessionId) setSessionId(statusData.sessionId);

              // Update session storage
              try {
                const sessionRaw = sessionStorage.getItem(STORAGE_KEY);
                if (sessionRaw) {
                  const session = JSON.parse(sessionRaw);
                  session.analysisResult = statusData.analysis;
                  session.sessionId = statusData.sessionId;
                  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
                }
              } catch {}

              setToast({
                message: "Reading Fluency Session Successful!",
                type: "success",
              });
            } else if (statusData.status === "FAILED") {
              clearInterval(pollInterval);
              setToast({
                message: "Analysis failed. Please try again.",
                type: "error",
              });
            }
          } catch (err) {
            console.error("Polling error:", err);
          }
        }, 3000);

        // Safety timeout
        setTimeout(() => clearInterval(pollInterval), 120000);
      }

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
        passageLevel={selectedLevel}
      />
    );
  }

  const classNames = classes.map((c) => c.name);

  return (
    <TestPageLayout
      title="Reading Fluency Test"
      toast={toast}
      onCloseToast={() => setToast(null)}
      passageExpanded={passageExpanded}
      overlay={
        showClassificationPopup && analysisResult?.classificationLevel ? (
          <ClassificationPopup
            classificationLevel={analysisResult.classificationLevel}
            studentName={studentName}
            onClose={() => setShowClassificationPopup(false)}
          />
        ) : undefined
      }
      sidebar={
        <MiscueAnalysis
          disabled={!hasRecording}
          isAnalyzing={isSubmitting}
          miscues={analysisResult?.miscues}
          totalMiscue={analysisResult?.totalMiscues}
          oralFluencyScore={analysisResult?.oralFluencyScore}
          classificationLevel={analysisResult?.classificationLevel}
          highlightedTypes={highlightedTypes}
          onToggleHighlight={toggleHighlightType}
          onResetHighlight={resetHighlightTypes}
          onExportPdf={() => {
            if (!analysisResult) return;
            const data = buildFluencyReportData({
              studentName,
              gradeLevel,
              selectedClassName,
              selectedTitle,
              selectedLevel,
              selectedTestType,
              assessmentType: "Oral Reading",
              passageContent,
              recordedSeconds,
              analysisResult,
            });
            exportFluencyReportPdf(
              data,
              `Oral_Fluency_Report_${studentName.replace(/[^a-zA-Z0-9]/g, "_")}`,
            );
          }}
        />
      }
      modal={
        <AddPassageModal
          isOpen={isPassageModalOpen}
          onClose={() => setIsPassageModalOpen(false)}
          onSelectPassage={handleSelectPassage}
        />
      }
    >
      {/* Nav row */}
      {!passageExpanded && (
        <div className="flex items-center justify-between rounded-2xl border border-[#D5E7FE] bg-white px-4 py-3 shadow-[0px_2px_16px_rgba(108,164,239,0.18)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              title="Go back"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6666FF] text-white shadow-[0_2px_8px_rgba(102,102,255,0.4)] transition-colors hover:bg-[#5555EE]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
                Details
              </p>
              <p className="text-sm font-semibold text-[#1E1B4B]">
                Student Information
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartNew}
            disabled={!hasPassage}
            className={`flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition-all ${
              hasPassage
                ? "border-[#6666FF] bg-[#6666FF] text-white shadow-[0_2px_12px_rgba(102,102,255,0.35)] hover:bg-[#5555EE]"
                : "cursor-not-allowed border-[#C4C4FF] bg-white text-[#A5A5D6]"
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Start New</span>
          </button>
        </div>
      )}

      {/* Student info + passage filters + shareable link */}
      {!passageExpanded && (
        <StudentSetupSection
          isLoading={isLoadingClasses}
          studentName={studentName}
          gradeLevel={gradeLevel}
          classes={classNames}
          selectedClassName={selectedClassName}
          onStudentNameChange={setStudentName}
          onGradeLevelChange={setGradeLevel}
          onClassCreated={() =>
            queryClient.invalidateQueries({
              queryKey: ["classes", schoolYear],
            })
          }
          onStudentSelected={(studentId: string) =>
            setSelectedStudentId(studentId)
          }
          onClassChange={setSelectedClassName}
          onClear={handleStartNew}
          hasPassage={hasPassage}
          selectedLanguage={selectedLanguage}
          selectedLevel={selectedLevel}
          selectedTestType={selectedTestType}
          onOpenPassageModal={() => setIsPassageModalOpen(true)}
          shareableLink={
            selectedStudentId && selectedPassage
              ? {
                  studentId: selectedStudentId,
                  passageId: selectedPassage,
                  assessmentType: "READING_FLUENCY",
                }
              : undefined
          }
        />
      )}

      {/* Passage display */}
      <PassageDisplay
        content={passageContent}
        miscues={showMiscues ? filteredMiscues : undefined}
        alignedWords={showMiscues ? analysisResult?.alignedWords : undefined}
        onJumpToTime={handleJumpToTime}
        expanded={passageExpanded}
        onToggleExpand={() => setPassageExpanded((prev) => !prev)}
        passageLevel={selectedLevel}
      />

      {/* Audio player when passage is expanded */}
      {passageExpanded && hasRecording && recordedAudioURL && (
        <div className="mt-2">
          <AudioPlayer src={recordedAudioURL} externalAudioRef={audioRef} />
        </div>
      )}

      {/* Word count + miscue toggle */}
      {!passageExpanded && hasPassage && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#00306E]">
            {passageContent.split(/\s+/).length} words
          </span>
          {analysisResult && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#31318A]">
                {showMiscues ? "Miscues" : "Original"}
              </span>
              <button
                type="button"
                onClick={() => setShowMiscues((prev) => !prev)}
                aria-label={
                  showMiscues
                    ? "Show original passage"
                    : "Show miscue highlights"
                }
                title={
                  showMiscues
                    ? "Show original passage"
                    : "Show miscue highlights"
                }
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  showMiscues ? "bg-[#6666FF]" : "bg-[#C4C4FF]"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                    showMiscues ? "translate-x-4.25" : "translate-x-0.75"
                  }`}
                />
              </button>
            </div>
          )}
          {!analysisResult && (
            <div className="flex items-center gap-2 opacity-40 pointer-events-none">
              <span className="text-xs font-medium text-[#31318A]">
                Miscues
              </span>
              <div className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-[#C4C4FF]">
                <span className="inline-block h-3.5 w-3.5 translate-x-0.75 rounded-full bg-white shadow" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Passage title */}
      {!passageExpanded && hasPassage && (
        <div className="mb-2 flex items-center justify-center">
          <span className="text-lg font-bold text-[#31318A] md:text-xl">
            {selectedTitle}
          </span>
        </div>
      )}

      {/* Reading timer + audio player */}
      {!passageExpanded && (
        <ReadingTimer
          hasPassage={hasPassage}
          hasStudentInfo={
            !!(studentName.trim() && gradeLevel && selectedClassName)
          }
          onStartReading={handleStartReading}
          hasRecording={hasRecording}
          recordedSeconds={recordedSeconds}
          recordedAudioURL={recordedAudioURL}
          onTryAgain={handleTryAgain}
          audioRef={audioRef}
        />
      )}

      {/* Countdown toggle + readiness check */}
      {!passageExpanded && (
        <div className="flex items-center justify-between">
          <CountdownToggle
            countdownEnabled={countdownEnabled}
            countdownSeconds={countdownSeconds}
            onToggle={() => setCountdownEnabled(!countdownEnabled)}
            onDecrease={() =>
              setCountdownSeconds(Math.max(1, countdownSeconds - 1))
            }
            onIncrease={() =>
              setCountdownSeconds(Math.min(10, countdownSeconds + 1))
            }
          />

          <ReadinessCheckButton />
        </div>
      )}
    </TestPageLayout>
  );
}

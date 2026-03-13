"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import StudentInfoBar from "@/components/oral-reading-test/studentInfoBar";
import { PassageFilters } from "@/components/oral-reading-test/passageFilters";
import { PassageDisplay } from "@/components/oral-reading-test/passageDisplay";
import { ReadingTimer, AudioPlayer } from "@/components/oral-reading-test/readingTimer";
import { MiscueAnalysis } from "@/components/oral-reading-test/miscueAnalysis";
import { FullScreenPassage } from "@/components/oral-reading-test/fullScreenPassage";
import { AddPassageModal } from "@/components/oral-reading-test/addPassageModal";
import { ToastNotification } from "@/components/oral-reading-test/toastNotification";
import { CountdownToggle } from "@/components/oral-reading-test/countdownToggle";
import { OralReadingNavRow } from "@/components/oral-reading-test/oralReadingNavRow";
import { ReadinessCheckButton } from "@/components/oral-reading-test/readinessCheck";
import { useClassList } from "@/lib/hooks/useClassList";
import { useQueryClient } from "@tanstack/react-query";
import { createStudent } from "@/app/actions/student/createStudent";
import type { OralFluencyAnalysis } from "@/types/oral-reading";
import { convertToWav } from "@/utils/convertToWav"
import { exportFluencyReportPdf, buildFluencyReportData } from "@/lib/exportFluencyReportPdf"

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

const STORAGE_KEY = "oral-reading-session";
const AUDIO_STORAGE_KEY = "oral-reading-audio";

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
    const existing = sessionStorage.getItem(STORAGE_KEY);
    const merged = existing ? { ...JSON.parse(existing), ...state } : state;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
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

export default function OralReadingTestPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isRestoredRef = useRef(true);

  const schoolYear = getCurrentSchoolYear();
  const { data: classListData = [], isLoading: isLoadingClasses } =
    useClassList(schoolYear);

  const classes = useMemo(
    () => classListData.map((c) => ({ id: c.id, name: c.name })),
    [classListData],
  );

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
  const audioRef = useRef<HTMLAudioElement>(null);

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
      if (recordedAudioURL) {
        URL.revokeObjectURL(recordedAudioURL);
        setRecordedAudioURL(null);
      }
    },
    [recordedAudioURL],
  );

  const handleStartReading = useCallback(() => {
    if (!hasPassage || !studentName.trim() || !gradeLevel || !selectedClassName) return;
    setIsFullScreen(true);
    setHasRecording(false);
    if (recordedAudioURL) {
      URL.revokeObjectURL(recordedAudioURL);
      setRecordedAudioURL(null);
    }
  }, [hasPassage, studentName, gradeLevel, selectedClassName, recordedAudioURL]);

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
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(AUDIO_STORAGE_KEY);
    sessionStorage.removeItem("oral-reading-assessmentId");
    sessionStorage.removeItem("oral-reading-comprehension-state");
    sessionStorage.removeItem("oral-reading-comprehensionTestId");
  }, [recordedAudioURL]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSubmitRecording = useCallback(async () => {
    if (!recordedAudioBlob || !selectedPassage) {
      console.log("Submit blocked - missing:", {
        hasBlob: !!recordedAudioBlob,
        selectedPassage,
        selectedStudentId,
      });
      return;
    }
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
      } catch (err) {
        console.error("Failed to create student:", err);
        setToast({
          message: "Something went wrong creating the student.",
          type: "error",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const { uploadAudioToSupabase } = await import("@/utils/uploadAudioToSupabase")
      const wavBlob = await convertToWav(recordedAudioBlob)

      const supabaseAudioUrl = await uploadAudioToSupabase(
        wavBlob,
        studentId,
        selectedPassage,
      );

      if (!supabaseAudioUrl) {
        console.error("Audio upload failed");
        return;
      }

      console.log("Audio uploaded to:", supabaseAudioUrl);

      const formData = new FormData()
      formData.append("studentId", studentId)
      formData.append("passageId", selectedPassage)
      formData.append("audioUrl", supabaseAudioUrl)
      formData.append("audio", wavBlob, "recording.wav")

      console.log("Sending to API:", `/api/oral-reading/${selectedPassage}`);

      const response = await fetch(`/api/oral-reading/${selectedPassage}`, {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      console.log("Raw API response:", response.status, responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        console.error(
          "Analysis API non-JSON response:",
          response.status,
          responseText,
        );
        return;
      }

      if (!response.ok) {
        console.error("Analysis API error:", response.status, result);
        return;
      }

      console.log("Session created:", result.sessionId);
      console.log("Assessment created:", result.assessmentId);

      // Store assessmentId for the comprehension page
      if (result.assessmentId) {
        try {
          sessionStorage.setItem(
            "oral-reading-assessmentId",
            result.assessmentId,
          );
        } catch {}
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
    } catch (err) {
      console.error("Submit error:", err);
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
      console.log("Submitting recording...");
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
    <div className="flex h-screen flex-col overflow-hidden">
      <DashboardHeader title="Oral Reading Test" />

      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main
        className={`flex min-h-0 flex-1 flex-col px-4 py-4 md:px-6 lg:px-8 ${
          passageExpanded ? "gap-0 py-2" : "gap-3"
        }`}
      >
        {/* Nav row */}
        {!passageExpanded && (
          <OralReadingNavRow
            onGoBack={() => router.back()}
            onContinue={() =>
              hasRecording &&
              studentName.trim() && gradeLevel && selectedClassName &&
              router.push("/dashboard/oral-reading-test/comprehension")
            }
            continueEnabled={hasRecording && !!(studentName.trim() && gradeLevel && selectedClassName)}
          />
        )}

        <div className="flex min-h-0 flex-1 gap-4">
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
              miscues={showMiscues ? filteredMiscues : undefined}
              alignedWords={showMiscues ? analysisResult?.alignedWords : undefined}
              onJumpToTime={handleJumpToTime}
              expanded={passageExpanded}
              onToggleExpand={() => setPassageExpanded((prev) => !prev)}
              passageLevel={selectedLevel}
            />

            {passageExpanded && hasRecording && recordedAudioURL && (
              <div className="mt-2">
                <AudioPlayer src={recordedAudioURL} externalAudioRef={audioRef} />
              </div>
            )}

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
                      aria-label={showMiscues ? "Show original passage" : "Show miscue highlights"}
                      title={showMiscues ? "Show original passage" : "Show miscue highlights"}
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
                hasStudentInfo={!!(studentName.trim() && gradeLevel && selectedClassName)}
                onStartReading={handleStartReading}
                hasRecording={hasRecording}
                recordedSeconds={recordedSeconds}
                recordedAudioURL={recordedAudioURL}
                onTryAgain={handleTryAgain}
                audioRef={audioRef}
              />
            )}

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
          </div>

          {/* Right column: MiscueAnalysis — responsive width */}
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
                exportFluencyReportPdf(data, `Oral_Fluency_Report_${studentName.replace(/[^a-zA-Z0-9]/g, "_")}`);
              }}
            />
          </div>
        </div>
      </main>

      {/* Add Passage Modal */}
      <AddPassageModal
        isOpen={isPassageModalOpen}
        onClose={() => setIsPassageModalOpen(false)}
        onSelectPassage={handleSelectPassage}
      />
    </div>
  );
}
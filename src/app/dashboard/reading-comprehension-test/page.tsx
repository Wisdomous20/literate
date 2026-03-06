"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { DashboardHeader } from "@/components/auth/dashboard/dashboardHeader";
import StudentInfoBar from "@/components/oral-reading-test/studentInfoBar";
import { PassageFilters } from "@/components/oral-reading-test/passageFilters";
import { PassageDisplay } from "@/components/oral-reading-test/passageDisplay";
import { AddPassageModal } from "@/components/oral-reading-test/addPassageModal";
import {
  ReadingModePanel,
  type VoiceOption,
} from "@/components/reading-comprehension-test/readingModePanel";
import { getClassListBySchoolYear } from "@/app/actions/class/getClassList";

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

interface ClassItem {
  id: string;
  name: string;
}

const STORAGE_KEY = "reading-comprehension-session";

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
  selectedVoiceName?: string;
  quizId?: string;
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

export default function ReadingComprehensionTestPage() {
  const router = useRouter();

  const [studentName, setStudentName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
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

  const [selectedVoiceName, setSelectedVoiceName] = useState("");
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPausedTTS, setIsPausedTTS] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [isHydrated, setIsHydrated] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const loaded = loadSession();

    /* eslint-disable react-hooks/set-state-in-effect -- Intentional mount-time restoration from sessionStorage for SSR hydration */
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
    if (loaded.selectedVoiceName !== undefined)
      setSelectedVoiceName(loaded.selectedVoiceName);

    setIsHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

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
      selectedVoiceName,
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
    selectedVoiceName,
  ]);

  // Fetch classes on mount
  useEffect(() => {
    async function fetchClasses() {
      setIsLoadingClasses(true);
      const schoolYear = getCurrentSchoolYear();
      const result = await getClassListBySchoolYear(schoolYear);

      if (result.success && result.classes) {
        const mappedClasses: ClassItem[] = result.classes.map((c) => ({
          id: c.id,
          name: c.name,
        }));
        setClasses(mappedClasses);
      } else {
        setClasses([]);
      }
      setIsLoadingClasses(false);
    }

    fetchClasses();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    function buildVoiceList() {
      const raw = window.speechSynthesis.getVoices();
      if (raw.length === 0) return; // voices not ready yet — wait for onvoiceschanged

      const ALLOWED = /^(fil|tl-|en-US|en-GB)/i;
      const filtered = raw.filter((v) => {
        if (!v.lang) return false;
        if (ALLOWED.test(v.lang)) return true;
        // Catch voices whose name explicitly says Filipino/Tagalog but have odd lang codes
        const n = v.name.toLowerCase();
        return n.includes("filipino") || n.includes("tagalog");
      });

      function friendlyLabel(name: string, lang: string): string {
        const clean = name
          .replace(/^Microsoft\s+/i, "")
          .replace(/\s+Desktop$/i, "")
          .trim();
        if (/^(fil|tl-)/i.test(lang)) return `${clean} · Filipino`;
        if (/^en-US/i.test(lang)) return `${clean} · American English`;
        if (/^en-GB/i.test(lang)) return `${clean} · British English`;
        return clean;
      }

      const mapped: VoiceOption[] = filtered.map((v) => ({
        name: v.name,
        label: friendlyLabel(v.name, v.lang),
        lang: v.lang,
      }));

      const filipinoVoice = filtered.find(
        (v) =>
          /^(fil|tl-)/i.test(v.lang) ||
          v.name.toLowerCase().includes("filipino") ||
          v.name.toLowerCase().includes("tagalog"),
      );

      if (mapped.length > 0) {
        setAvailableVoices(mapped);
        setSelectedVoiceName((prev) => {
          if (prev && mapped.some((v) => v.name === prev)) return prev;
          return filipinoVoice?.name ?? mapped[0].name;
        });
      }
    }

    buildVoiceList();
    window.speechSynthesis.onvoiceschanged = buildVoiceList;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const hasPassage = passageContent.length > 0;
  const wordCount = hasPassage
    ? passageContent.split(/\s+/).filter(Boolean).length
    : 0;

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
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setIsPausedTTS(false);
    },
    [],
  );

  const handlePlayTTS = useCallback(() => {
    if (!passageContent || typeof window === "undefined") return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(passageContent);
    utterance.rate = speechRate;

    const voices = window.speechSynthesis.getVoices();
    const chosen = voices.find((v) => v.name === selectedVoiceName);
    if (chosen) {
      utterance.voice = chosen;
      utterance.lang = chosen.lang;
    } else if (selectedLanguage?.toLowerCase() === "filipino") {
      utterance.lang = "fil-PH";
    } else {
      utterance.lang = "en-US";
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPausedTTS(false);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPausedTTS(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPausedTTS(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [passageContent, speechRate, selectedLanguage, selectedVoiceName]);

  const handlePauseTTS = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsPausedTTS(true);
    }
  }, []);

  const handleResumeTTS = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setIsPausedTTS(false);
    }
  }, []);

  const handleStopTTS = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPausedTTS(false);
  }, []);

  const handleStartNew = useCallback(() => {
    handleStopTTS();
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
    setSelectedVoiceName("");
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("reading-comprehension-assessmentId");
    sessionStorage.removeItem("reading-comprehension-state");
  }, [handleStopTTS]);

  const canProceed = hasPassage;

  const handleProceedToComprehension = useCallback(() => {
    if (!canProceed) return;
    router.push("/dashboard/reading-comprehension-test/comprehension");
  }, [canProceed, router]);

  const classNames = classes.map((c) => c.name);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DashboardHeader title="Reading Comprehension Test" />

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
        className={`flex min-h-0 flex-1 flex-col px-4 py-4 md:px-6 lg:px-8 ${
          passageExpanded ? "gap-0 py-2" : "gap-3"
        }`}
      >
        {!passageExpanded && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-1.5 rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(102,102,255,0.4),0_4px_12px_rgba(102,102,255,0.3)] transition-all duration-300 hover:bg-[#5555EE] md:text-base"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              <span>Previous</span>
            </button>

            <h2 className="flex-1 text-center text-base font-bold text-[#0C1A6D] md:text-lg lg:text-xl">
              Student Information
            </h2>

            <button
              type="button"
              onClick={handleProceedToComprehension}
              aria-label="Continue to comprehension"
              title="Continue to comprehension"
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 md:text-base ${
                canProceed
                  ? "animate-[pulseGlow_2s_ease-in-out_infinite] bg-[#6666FF] text-white shadow-[0_0_20px_rgba(102,102,255,0.4),0_4px_12px_rgba(102,102,255,0.3)] hover:bg-[#5555EE]"
                  : "cursor-not-allowed text-[#00306E]/40"
              }`}
              disabled={!canProceed}
            >
              <span>Continue to Comprehension</span>
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </div>
        )}

        <div className="flex min-h-0 flex-1 gap-4">
          <div
            className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${
              passageExpanded ? "gap-0" : "gap-3"
            }`}
          >
            {!passageExpanded && !isLoadingClasses && (
              <StudentInfoBar
                studentName={studentName}
                gradeLevel={gradeLevel}
                classes={classNames}
                selectedClassName={selectedClassName}
                onStudentNameChange={setStudentName}
                onGradeLevelChange={setGradeLevel}
                onClassCreated={(newClass) => {
                  setClasses((prev) => [
                    ...prev,
                    { id: newClass, name: newClass },
                  ]);
                }}
                onStudentSelected={(studentId: string) =>
                  setSelectedStudentId(studentId)
                }
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
              expanded={passageExpanded}
              onToggleExpand={() => setPassageExpanded((prev) => !prev)}
            />

            {!passageExpanded && hasPassage && (
              <div className="mt-2 flex items-center">
                <span className="text-xs font-semibold text-[#00306E]">
                  {wordCount} words
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

            {!passageExpanded && hasPassage && (
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleStartNew}
                  className="rounded-lg border border-[#6666FF]/30 bg-[rgba(102,102,255,0.06)] px-6 py-2 text-sm font-semibold text-[#6666FF] transition-colors hover:bg-[rgba(102,102,255,0.12)]"
                >
                  Start New
                </button>
              </div>
            )}
          </div>

          <div className="w-60 shrink-0 self-stretch md:w-67.5 lg:w-75 xl:w-[320px]">
            <ReadingModePanel
              isSpeaking={isSpeaking}
              isPausedTTS={isPausedTTS}
              onPlayTTS={handlePlayTTS}
              onPauseTTS={handlePauseTTS}
              onResumeTTS={handleResumeTTS}
              onStopTTS={handleStopTTS}
              speechRate={speechRate}
              onSpeechRateChange={setSpeechRate}
              hasPassage={hasPassage}
              wordCount={wordCount}
              selectedVoiceName={selectedVoiceName}
              onVoiceChange={setSelectedVoiceName}
              availableVoices={availableVoices}
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

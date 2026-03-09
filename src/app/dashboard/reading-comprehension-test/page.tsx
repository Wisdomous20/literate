"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  X,
  Clock,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import { NavButton } from "@/components/ui/navButton";
import StudentInfoBar from "@/components/oral-reading-test/studentInfoBar";
import { PassageFilters } from "@/components/oral-reading-test/passageFilters";
import { PassageDisplay } from "@/components/oral-reading-test/passageDisplay";
import { AddPassageModal } from "@/components/oral-reading-test/addPassageModal";
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
  const [classLoadError, setClassLoadError] = useState(false);
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
        setClassLoadError(false);
      } else {
        setClasses([]);
        setClassLoadError(true);
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

  const hasPassage = passageContent.length > 0;
  const wordCount = hasPassage
    ? passageContent.split(/\s+/).filter(Boolean).length
    : 0;
  const estimatedReadingTime = wordCount > 0
    ? (() => {
        const totalSec = Math.ceil((wordCount / 150) * 60);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      })()
    : null;

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
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("reading-comprehension-assessmentId");
    sessionStorage.removeItem("reading-comprehension-state");
  }, []);

  const canProceed = hasPassage;

  const handleProceedToComprehension = useCallback(() => {
    if (!canProceed) return;
    router.push("/dashboard/reading-comprehension-test/quiz");
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
            <NavButton onClick={() => router.back()}>
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              <span>Previous</span>
            </NavButton>

            <h2 className="flex-1 text-center text-base font-bold text-[#0C1A6D] md:text-lg lg:text-xl">
              Student Information
            </h2>

            <NavButton
              onClick={handleProceedToComprehension}
              aria-label="Continue to comprehension"
              title="Continue to comprehension"
              className={
                canProceed
                  ? "animate-[pulseGlow_2s_ease-in-out_infinite]"
                  : "cursor-not-allowed bg-transparent text-[#00306E]/40 shadow-none hover:bg-transparent"
              }
              disabled={!canProceed}
            >
              <span>Continue to Comprehension</span>
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </NavButton>
          </div>
        )}

        <div
          className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${
            passageExpanded ? "gap-0" : "gap-3"
          }`}
        >
          {!passageExpanded && isLoadingClasses && (
            <>
              <div className="h-[72px] animate-pulse rounded-4xl border border-[#54A4FF] bg-[#EFFDFF] shadow-[0px_1px_20px_rgba(108,164,239,0.37)]" />
              <div className="flex gap-3">
                <div className="h-[42px] flex-1 animate-pulse rounded-[10px] border border-[#54A4FF] bg-[#D5E7FE]" />
                <div className="h-[42px] flex-1 animate-pulse rounded-[10px] border border-[#54A4FF] bg-[#D5E7FE]" />
                <div className="h-[42px] flex-1 animate-pulse rounded-[10px] border border-[#54A4FF] bg-[#D5E7FE]" />
                <div className="h-[42px] w-[140px] shrink-0 animate-pulse rounded-lg bg-[#2E2E68]/30" />
              </div>
            </>
          )}

          {!passageExpanded && classLoadError && !isLoadingClasses && (
            <div className="flex items-center justify-between rounded-4xl border border-[#54A4FF] bg-[#EFFDFF] px-6 py-4 shadow-[0px_1px_20px_rgba(108,164,239,0.37)]">
              <span className="text-sm font-medium text-red-500">Failed to load classes.</span>
              <button
                type="button"
                onClick={() => {
                  setClassLoadError(false);
                  setIsLoadingClasses(true);
                  getClassListBySchoolYear(getCurrentSchoolYear()).then((result) => {
                    if (result.success && result.classes) {
                      setClasses(result.classes.map((c) => ({ id: c.id, name: c.name })));
                      setClassLoadError(false);
                    } else {
                      setClassLoadError(true);
                    }
                    setIsLoadingClasses(false);
                  });
                }}
                className="text-xs font-semibold text-[#6666FF] hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {!passageExpanded && !isLoadingClasses && !classLoadError && (
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
            resizable={false}
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
            <div className="mb-2 flex items-center justify-center">
              <span className="text-lg font-bold text-[#31318A] md:text-xl">
                {selectedTitle}
              </span>
            </div>
          )}
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

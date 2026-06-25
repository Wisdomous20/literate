"use client";

import StudentInfoBar from "@/components/oral-reading-test/studentInfoBar";
import { PassageFilters } from "@/components/oral-reading-test/passageFilters";
import { ShareableLinkSection } from "@/components/assessment/shareableLinkSection";
import { useState, useCallback } from "react";
import { X } from "lucide-react";

function LoadingSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="h-18 animate-pulse rounded-2xl border border-[#D9D1FF] bg-[linear-gradient(90deg,#F6F3FF_0%,#EEE8FF_45%,#F6F3FF_100%)]" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_140px]">
        <div className="h-10.5 animate-pulse rounded-xl border border-[#D9D1FF] bg-[linear-gradient(90deg,#F6F3FF_0%,#EEE8FF_45%,#F6F3FF_100%)]" />
        <div className="h-10.5 animate-pulse rounded-xl border border-[#D9D1FF] bg-[linear-gradient(90deg,#F6F3FF_0%,#EEE8FF_45%,#F6F3FF_100%)]" />
        <div className="h-10.5 animate-pulse rounded-xl border border-[#D9D1FF] bg-[linear-gradient(90deg,#F6F3FF_0%,#EEE8FF_45%,#F6F3FF_100%)]" />
        <div className="h-10.5 animate-pulse rounded-xl bg-[#D2CCF6]/75" />
      </div>
    </div>
  );
}

interface StudentSetupSectionProps {
  isLoading: boolean;
  studentName: string;
  gradeLevel: string;
  classes: string[];
  selectedClassName: string;
  onStudentNameChange: (name: string) => void;
  onGradeLevelChange: (grade: string) => void;
  onClassCreated: () => void;
  onStudentSelected: (id: string) => void;
  onClassChange: (name: string) => void;
  onClear: () => void;
  hasPassage: boolean;
  selectedLanguage?: string;
  selectedLevel?: string;
  selectedTestType?: string;
  passageTitle?: string;
  onOpenPassageModal: () => void;
  shareableLink?: {
    studentId: string;
    passageId: string;
    assessmentType: string;
  };
  hideStudentInfo?: boolean;
  disabled?: boolean;
  allowPassageChange?: boolean;
}

export function StudentSetupSection({
  isLoading,
  studentName,
  gradeLevel,
  classes,
  selectedClassName,
  onStudentNameChange,
  onGradeLevelChange,
  onClassCreated,
  onStudentSelected,
  onClassChange,
  onClear,
  hasPassage,
  selectedLanguage,
  selectedLevel,
  selectedTestType,
  passageTitle,
  onOpenPassageModal,
  shareableLink,
  hideStudentInfo = false,
  disabled = false,
  allowPassageChange = true,
}: StudentSetupSectionProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  const handleToggleShare = useCallback(() => {
    setShowShareModal((prev) => !prev);
  }, []);

  if (isLoading) return <LoadingSkeleton />;

  return (
    <>
      {!hideStudentInfo && (
        <StudentInfoBar
          studentName={studentName}
          gradeLevel={gradeLevel}
          classes={classes}
          selectedClassName={selectedClassName}
          onStudentNameChange={onStudentNameChange}
          onGradeLevelChange={onGradeLevelChange}
          onClassCreated={onClassCreated}
          onStudentSelected={onStudentSelected}
          onClassChange={onClassChange}
          onClear={onClear}
        />
      )}

      <div data-tour-target="passage-controls">
        <PassageFilters
          language={hasPassage ? selectedLanguage : undefined}
          passageLevel={hasPassage ? selectedLevel : undefined}
          testType={hasPassage ? selectedTestType : undefined}
          hasPassage={hasPassage}
          passageTitle={passageTitle}
          onOpenPassageModal={onOpenPassageModal}
          showShareLink={!!shareableLink}
          onShareLink={shareableLink ? handleToggleShare : undefined}
          disabled={disabled}
          allowPassageChange={allowPassageChange}
        />
      </div>

      {/* Shareable Link Modal */}
      {showShareModal && shareableLink && (
        <div
          className="fixed inset-0 z-90 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-0 shadow-[0_8px_40px_rgba(0,0,0,0.18)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-[#6B7280] transition-colors hover:bg-gray-100 hover:text-gray-800"
              aria-label="Close shareable link modal"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <ShareableLinkSection
              studentId={shareableLink.studentId}
              passageId={shareableLink.passageId}
              assessmentType={
                shareableLink.assessmentType as
                  | "ORAL_READING"
                  | "COMPREHENSION"
                  | "READING_FLUENCY"
              }
            />
          </div>
        </div>
      )}
    </>
  );
}
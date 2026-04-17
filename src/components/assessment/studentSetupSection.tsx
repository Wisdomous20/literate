"use client";

import StudentInfoBar from "@/components/oral-reading-test/studentInfoBar";
import { PassageFilters } from "@/components/oral-reading-test/passageFilters";
import { ShareableLinkSection } from "@/components/assessment/shareableLinkSection";

function LoadingSkeleton() {
  return (
    <>
      <div className="h-18 animate-pulse rounded-4xl border border-[#54A4FF] bg-[#EFFDFF] shadow-[0px_1px_20px_rgba(108,164,239,0.37)]" />
      <div className="flex gap-3">
        <div className="h-10.5 flex-1 animate-pulse rounded-[10px] border border-[#54A4FF] bg-[#D5E7FE]" />
        <div className="h-10.5 flex-1 animate-pulse rounded-[10px] border border-[#54A4FF] bg-[#D5E7FE]" />
        <div className="h-10.5 flex-1 animate-pulse rounded-[10px] border border-[#54A4FF] bg-[#D5E7FE]" />
        <div className="h-10.5 w-35 shrink-0 animate-pulse rounded-lg bg-[#2E2E68]/30" />
      </div>
    </>
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
  onOpenPassageModal: () => void;
  shareableLink?: {
    studentId: string;
    passageId: string;
    assessmentType: string;
  };
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
  onOpenPassageModal,
  shareableLink,
}: StudentSetupSectionProps) {
  if (isLoading) return <LoadingSkeleton />;

  return (
    <>
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

      <PassageFilters
        language={hasPassage ? selectedLanguage : undefined}
        passageLevel={hasPassage ? selectedLevel : undefined}
        testType={hasPassage ? selectedTestType : undefined}
        hasPassage={hasPassage}
        onOpenPassageModal={onOpenPassageModal}
      />

      {shareableLink && (
        <ShareableLinkSection
          studentId={shareableLink.studentId}
          passageId={shareableLink.passageId}
          assessmentType={shareableLink.assessmentType}
        />
      )}
    </>
  );
}
"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Search,
  ChevronUp,
  ChevronDown,
  Loader2,
  X,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { ClassListsHeader } from "@/components/class-lists/classListsHeader";
import { StatCards } from "@/components/class-lists/statCards";
import {
  AssessmentTypeFilterDropdown,
  type AssessmentTypeFilter,
} from "@/components/class-lists/assessmentTypeFilter";
import { StudentTable } from "@/components/class-lists/studentTable";
import { ClassInfo } from "@/components/class-lists/classInfo";
import { CreateStudentModal } from "@/components/class-lists/createStudentModal";
import { createStudent } from "@/app/actions/student/createStudent";
import { deleteStudent } from "@/app/actions/student/deleteStudent";
import { updateStudent } from "@/app/actions/student/updateStudent";
import { useStudentList } from "@/lib/hooks/useStudentList";
import { useQueryClient } from "@tanstack/react-query";
import { useClassById } from "@/lib/hooks/useClassById";
import { useStudentAssessments } from "@/lib/hooks/useStudentAssessments";
import type { AssessmentData, StudentTableItem } from "@/types/assessment";

interface StudentData {
  id: string;
  name: string;
  level?: number;
  classId: string;
  deletedAt?: Date | null;
}

const assessmentTypeLabels: Record<AssessmentTypeFilter, string> = {
  ALL: "All Students",
  ORAL_READING: "Oral Reading Test",
  COMPREHENSION: "Reading Comprehension Test",
  READING_FLUENCY: "Reading Fluency Test",
};

function levelToGradeLevel(level?: number): string {
  if (!level) return "Grade 1";
  return `Grade ${level}`;
}

function gradeLevelToNumber(gradeLevel: string): number {
  const match = gradeLevel.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

function getAssessmentClassification(
  assessment: AssessmentData,
): string | null {
  switch (assessment.type) {
    case "ORAL_READING":
      return assessment.oralReadingResult?.classificationLevel || null;
    case "READING_FLUENCY":
      return assessment.oralFluency?.classificationLevel || null;
    case "COMPREHENSION":
      return assessment.comprehension?.classificationLevel || null;
    default:
      return null;
  }
}

export default function ClassListsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<
    "nameAsc" | "nameDesc" | "gradeAsc" | "gradeDesc"
  >("nameAsc");
  const [assessmentType, setAssessmentType] =
    useState<AssessmentTypeFilter>("ALL");
  const [showStats, setShowStats] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const {
    data: classData,
    isLoading: classLoading,
    error: classError,
  } = useClassById(classId);

  const {
    data: students = [],
    isLoading: studentsLoading,
    error: studentsError,
  } = useStudentList(classData?.name ?? "");

  const studentIds = useMemo(
    () => students.map((s: StudentData) => s.id),
    [students],
  );

  const { data: studentAssessments, isLoading: assessmentsLoading } =
    useStudentAssessments(studentIds);

  const loading = classLoading || studentsLoading || assessmentsLoading;
  const fetchError = classError?.message || studentsError?.message || null;

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStudentCreate = async (data: {
    studentName: string;
    gradeLevel: string;
  }) => {
    if (!classData) return;
    const level = gradeLevelToNumber(data.gradeLevel);
    try {
      const result = await createStudent(
        data.studentName,
        level,
        classData.name,
      );
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ["students", classData.name],
        });
        setIsModalOpen(false);
        showToast("Student created successfully!", "success");
      } else {
        showToast(result.error || "Failed to create student", "error");
      }
    } catch (err) {
      console.error("Failed to create student:", err);
      showToast("Something went wrong. Please try again.", "error");
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const result = await deleteStudent(studentId);
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ["students", classData?.name],
        });
        await queryClient.invalidateQueries({
          queryKey: ["assessments", studentId],
        });
        showToast("Student deleted successfully.", "success");
      } else {
        showToast(result.error || "Failed to delete student", "error");
      }
    } catch (err) {
      console.error("Failed to delete student:", err);
      showToast("Something went wrong. Please try again.", "error");
    }
  };

  const handleUpdateStudent = async (
    studentId: string,
    name: string,
    gradeLevel: string,
  ) => {
    const level = gradeLevelToNumber(gradeLevel);
    try {
      const result = await updateStudent(studentId, name, level);
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ["students", classData?.name],
        });
        showToast("Student updated successfully.", "success");
      } else {
        showToast(result.error || "Failed to update student", "error");
      }
    } catch (err) {
      console.error("Failed to update student:", err);
      showToast("Something went wrong. Please try again.", "error");
    }
  };

  const handleAssessmentFilterChange = (type: AssessmentTypeFilter) => {
    setAssessmentType(type);
    setShowStats(true);
  };

  const transformStudentsForTable = (
    studentList: StudentData[],
  ): StudentTableItem[] => {
    if (assessmentType === "ALL") {
      return studentList
        .map((student) => {
          const assessments = [...(studentAssessments[student.id] || [])].sort(
            (a, b) =>
              new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime(),
          );
          const latest = assessments[0] as AssessmentData | undefined;
          return {
            id: student.id,
            name: student.name || "No Name",
            gradeLevel: levelToGradeLevel(student.level),
            lastAssessment: latest
              ? new Date(latest.dateTaken).toLocaleDateString()
              : null,
            assessmentType: latest ? latest.type : "Awaiting Assessment",
          };
        })
        .filter((s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    } else {
      return studentList
        .map((student) => {
          const assessments = (studentAssessments[student.id] || []).filter(
            (a) => a.type === assessmentType,
          );
          if (assessments.length === 0) return null;
          const latest = [...assessments].sort(
            (a, b) =>
              new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime(),
          )[0];
          return {
            id: student.id,
            name: student.name || "No Name",
            gradeLevel: levelToGradeLevel(student.level),
            lastAssessment: latest
              ? new Date(latest.dateTaken).toLocaleDateString()
              : null,
            assessmentType: assessmentType as string,
          };
        })
        .filter((s): s is StudentTableItem => s !== null)
        .filter((s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }
  };

  const calculateStats = () => {
    let assessed = 0,
      independent = 0,
      instructional = 0,
      frustrated = 0;
    for (const student of students as StudentData[]) {
      const all = studentAssessments[student.id] || [];
      const relevant =
        assessmentType === "ALL"
          ? all
          : all.filter((a) => a.type === assessmentType);
      if (relevant.length === 0) continue;
      assessed++;
      const latest = [...relevant].sort(
        (a, b) =>
          new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime(),
      )[0];
      const level = getAssessmentClassification(latest);
      if (level === "INDEPENDENT") independent++;
      else if (level === "INSTRUCTIONAL") instructional++;
      else if (level === "FRUSTRATION") frustrated++;
    }
    return { assessed, independent, instructional, frustrated };
  };

  if (loading && !classData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-12 w-12 animate-spin text-[#6666FF]" />
      </div>
    );
  }

  if (fetchError || !classData) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="text-base text-red-500">
          {fetchError || "Class not found"}
        </div>
        <button
          onClick={() => router.back()}
          className="text-sm text-[#31318A] hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const stats = calculateStats();
  const tableStudents = transformStudentsForTable(students);

  const sortedStudents = [...tableStudents].sort((a, b) => {
    switch (sortOption) {
      case "nameAsc":
        return a.name.localeCompare(b.name);
      case "nameDesc":
        return b.name.localeCompare(a.name);
      case "gradeAsc":
        return a.gradeLevel.localeCompare(b.gradeLevel);
      case "gradeDesc":
        return b.gradeLevel.localeCompare(a.gradeLevel);
      default:
        return 0;
    }
  });

  return (
    <div className="flex h-screen flex-col">
      <ClassListsHeader onCreateStudent={() => setIsModalOpen(true)} />

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
            className="ml-1 rounded-full p-0.5 transition-colors hover:bg-gray-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <main className="flex-1 flex flex-col gap-3 px-6 py-4 lg:px-8 min-h-0 overflow-y-auto">
        {loading && (
          <div className="absolute right-3 top-3 z-50 text-xs text-blue-500">
            Updating…
          </div>
        )}

        {/* Row 1: Previous + Statistics toggle + Assessment filter dropdown */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#31318A] transition-opacity hover:opacity-70"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            {assessmentType !== "ALL" && (
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#00306E] focus:outline-none"
                onClick={() => setShowStats((v) => !v)}
                aria-expanded={showStats}
                aria-controls="stat-cards-panel"
              >
                <span>{assessmentTypeLabels[assessmentType]} Statistics</span>
                {showStats ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
            <AssessmentTypeFilterDropdown
              onFilterChange={handleAssessmentFilterChange}
            />
          </div>
        </div>

        {/* Stat Cards (collapsible, only when filtered) */}
        {assessmentType !== "ALL" && showStats && (
          <div id="stat-cards-panel">
            <StatCards
              assessedCount={stats.assessed}
              independentCount={stats.independent}
              instructionalCount={stats.instructional}
              frustratedCount={stats.frustrated}
            />
          </div>
        )}

        {/* Row 2: Class info + Search + Sort */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <ClassInfo
            className={classData.name}
            schoolYear={classData.schoolYear}
          />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-[rgba(84,164,255,0.35)] bg-[#F4FCFD] px-3 py-1">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E4F4FF]">
                <Search className="h-3 w-3 text-[#162DB0]" />
              </div>
              <input
                type="text"
                placeholder="Search students…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 bg-transparent text-xs text-[#00306E] outline-none placeholder:text-[#00306E]/40"
              />
            </div>

            <select
              value={sortOption}
              onChange={(e) =>
                setSortOption(
                  e.target.value as
                    | "nameAsc"
                    | "nameDesc"
                    | "gradeAsc"
                    | "gradeDesc",
                )
              }
              className="rounded-lg border border-[#54A4FF]/40 bg-[#E4F4FF] px-2.5 py-1 text-[11px] text-[#03438D]"
              aria-label="Sort students"
              title="Sort students"
            >
              <option value="nameAsc">Name: A → Z</option>
              <option value="nameDesc">Name: Z → A</option>
              <option value="gradeAsc">Grade: Ascending</option>
              <option value="gradeDesc">Grade: Descending</option>
            </select>
          </div>
        </div>

        <StudentTable
          students={sortedStudents}
          totalStudents={sortedStudents.length}
          studentAssessments={studentAssessments}
          onDeleteStudent={handleDeleteStudent}
          onUpdateStudent={handleUpdateStudent}
        />
      </main>

      <CreateStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateStudent={handleStudentCreate}
      />
    </div>
  );
}

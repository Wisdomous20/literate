// src/app/dashboard/class/[id]/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Search, ChevronUp, ChevronDown } from "lucide-react";
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

/** Get the classification level from a single assessment based on its type */
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

  const [assessmentType, setAssessmentType] =
    useState<AssessmentTypeFilter>("ALL");
  const [showStats, setShowStats] = useState(true);

  const studentIds = useMemo(
    () => students.map((s: StudentData) => s.id),
    [students],
  );

  const { data: studentAssessments, isLoading: assessmentsLoading } =
    useStudentAssessments(studentIds);

  const loading = classLoading || studentsLoading || assessmentsLoading;
  const fetchError = classError?.message || studentsError?.message || null;

  const handleCreateStudent = () => {
    setIsModalOpen(true);
  };

  const handleStudentCreate = async (data: {
    studentName: string;
    gradeLevel: string;
  }) => {
    if (!classData) return;

    const level = gradeLevelToNumber(data.gradeLevel);
    const result = await createStudent(data.studentName, level, classData.name);

    if (result.success) {
      await queryClient.invalidateQueries({
        queryKey: ["students", classData.name],
      });
      setIsModalOpen(false);
    } else {
      alert(result.error || "Failed to create student");
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    const result = await deleteStudent(studentId);
    if (result.success) {
      await queryClient.invalidateQueries({
        queryKey: ["students", classData?.name],
      });
      await queryClient.invalidateQueries({
        queryKey: ["assessments", studentId],
      });
    } else {
      alert(result.error || "Failed to delete student");
    }
  };

  const handleUpdateStudent = async (
    studentId: string,
    name: string,
    gradeLevel: string,
  ) => {
    const level = gradeLevelToNumber(gradeLevel);
    const result = await updateStudent(studentId, name, level);

    if (result.success) {
      await queryClient.invalidateQueries({
        queryKey: ["students", classData?.name],
      });
    } else {
      alert(result.error || "Failed to update student");
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
        .filter((student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()),
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
        .filter((student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }
  };

  /** Compute real statistics from assessment data */
  const calculateStats = () => {
    let assessed = 0;
    let independent = 0;
    let instructional = 0;
    let frustrated = 0;

    for (const student of students as StudentData[]) {
      const allStudentAssessments = studentAssessments[student.id] || [];
      const relevantAssessments =
        assessmentType === "ALL"
          ? allStudentAssessments
          : allStudentAssessments.filter((a) => a.type === assessmentType);

      if (relevantAssessments.length === 0) continue;
      assessed++;

      // Latest assessment determines the classification
      const latest = [...relevantAssessments].sort(
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
      <div className="flex flex-col gap-4 p-8">
        <div className="h-8 w-1/3 animate-pulse rounded bg-gray-200" />
        <div className="h-6 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-96 w-full animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  if (fetchError || !classData) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="text-lg text-red-500">
          {fetchError || "Class not found"}
        </div>
        <button
          onClick={() => router.back()}
          className="text-[#31318A] hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const stats = calculateStats();
  const tableStudents = transformStudentsForTable(students);

  return (
    <div className="flex min-h-screen flex-col overflow-y-auto">
      <ClassListsHeader onCreateStudent={handleCreateStudent} />

      <main className="flex flex-1 flex-col gap-5 px-8 py-6">
        {loading && (
          <div className="absolute right-2 top-2 z-50 text-xs text-blue-500">
            Updating...
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xl font-semibold text-[#31318A] hover:opacity-80"
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </button>

          <AssessmentTypeFilterDropdown
            onFilterChange={handleAssessmentFilterChange}
          />
        </div>

        {assessmentType !== "ALL" && (
          <div>
            {showStats ? (
              <button
                type="button"
                className="mb-2 flex items-center gap-2 font-semibold text-[#00306E] focus:outline-none"
                onClick={() => setShowStats(false)}
                aria-expanded="true"
                aria-controls="stat-cards-panel"
              >
                <span>
                  Show {assessmentTypeLabels[assessmentType]} Statistics
                </span>
                <ChevronUp className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                className="mb-2 flex items-center gap-2 font-semibold text-[#00306E] focus:outline-none"
                onClick={() => setShowStats(true)}
                aria-expanded="false"
                aria-controls="stat-cards-panel"
              >
                <span>
                  Show {assessmentTypeLabels[assessmentType]} Statistics
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
            <div id="stat-cards-panel" hidden={!showStats}>
              <StatCards
                assessedCount={stats.assessed}
                independentCount={stats.independent}
                instructionalCount={stats.instructional}
                frustratedCount={stats.frustrated}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <ClassInfo
            className={classData.name}
            schoolYear={classData.schoolYear}
          />

          <div className="flex items-center gap-4">
            <div className="flex w-87.5 items-center gap-3 rounded-full border border-[rgba(84,164,255,0.38)] bg-[#F4FCFD] px-4 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E4F4FF]">
                <Search className="h-4 w-4 text-[#162DB0]" />
              </div>
              <input
                type="text"
                placeholder="Search Anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#00306E] outline-none"
              />
            </div>

            <div className="relative">
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
                className="rounded-md bg-[#E4F4FF] px-4 py-2 text-sm text-[#03438D]"
                aria-label="Sort students"
                title="Sort students"
              >
                <option value="nameAsc">Name: A to Z</option>
                <option value="nameDesc">Name: Z to A</option>
                <option value="gradeAsc">Grade Level: Ascending</option>
                <option value="gradeDesc">Grade Level: Descending</option>
              </select>
            </div>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          <StudentTable
            students={tableStudents}
            totalStudents={tableStudents.length}
            studentAssessments={studentAssessments}
            onDeleteStudent={handleDeleteStudent}
            onUpdateStudent={handleUpdateStudent}
          />
        </div>
      </main>

      <CreateStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateStudent={handleStudentCreate}
      />
    </div>
  );
}

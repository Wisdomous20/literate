"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Search, ChevronUp, ChevronDown } from "lucide-react";
import { ClassListsHeader } from "@/components/class-lists/classListsHeader";
import { StatCards } from "@/components/class-lists/statCards";
import {
  AssessmentTypeFilterDropdown,
  AssessmentTypeFilter,
} from "@/components/class-lists/assessmentTypeFilter";
import { StudentTable } from "@/components/class-lists/studentTable";
import { ClassInfo } from "@/components/class-lists/classInfo";
import { CreateStudentModal } from "@/components/class-lists/createStudentModal";
import { createStudent } from "@/app/actions/student/createStudent";
import { deleteStudent } from "@/app/actions/student/deleteStudent";
import { updateStudent } from "@/app/actions/student/updateStudent";
import { getAssessmentsByStudent } from "@/app/actions/assessment/getAssessment";
import { useStudentList } from "@/lib/hooks/useStudentList";
import { useQueryClient } from "@tanstack/react-query";
import { useClassById } from "@/lib/hooks/useClassById";

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

  // Store all assessments for all students
  const [studentAssessments, setStudentAssessments] = useState<
    Record<string, any[]>
  >({});

  useEffect(() => {
    if (!students || students.length === 0) {
      Promise.resolve().then(() => setStudentAssessments({}));
      return;
    }
    let cancelled = false;
    async function fetchAllAssessments() {
      const result: Record<string, any[]> = {};
      await Promise.all(
        students.map(async (student: StudentData) => {
          try {
            const assessments = await getAssessmentsByStudent(student.id);
            result[student.id] = assessments || [];
          } catch {
            result[student.id] = [];
          }
        }),
      );
      if (!cancelled) setStudentAssessments(result);
    }
    fetchAllAssessments();
    return () => {
      cancelled = true;
    };
  }, [students]);

  const loading = classLoading || studentsLoading;
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
      // Invalidate and force refetch to update the UI right away
      await queryClient.invalidateQueries({
        queryKey: ["students", classData?.name],
      });
      await queryClient.refetchQueries({
        queryKey: ["students", classData?.name],
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

  // Transform students for table based on filter
  const transformStudentsForTable = (students: StudentData[]) => {
    if (assessmentType === "ALL") {
      return students
        .map((student) => {
          const assessments = studentAssessments[student.id] || [];
          // Find latest assessment of any type
          const latest = assessments.sort(
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
            assessmentType: latest ? latest.type : "Awaiting Assessment",
          };
        })
        .filter((student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    } else {
      // Filter by selected type, only show students with at least one assessment of that type
      return students
        .map((student) => {
          const assessments = (studentAssessments[student.id] || []).filter(
            (a) => a.type === assessmentType,
          );
          if (assessments.length === 0) return null;
          const latest = assessments.sort(
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
            assessmentType: latest.type,
          };
        })
        .filter(Boolean)
        .filter((student) =>
          (student as any).name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
        );
    }
  };

  const calculateStats = () => {
    // You can update this to show stats for the current filter if needed
    return {
      assessed:
        assessmentType === "ALL"
          ? students.filter((s) => (studentAssessments[s.id] || []).length > 0)
              .length
          : students.filter((s) =>
              (studentAssessments[s.id] || []).some(
                (a) => a.type === assessmentType,
              ),
            ).length,
      independent: 0,
      instructional: 0,
      frustrated: 0,
    };
  };

  if (loading && !classData) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <div className="h-8 w-1/3 bg-gray-200 animate-pulse rounded" />
        <div className="h-6 w-1/2 bg-gray-200 animate-pulse rounded" />
        <div className="h-96 w-full bg-gray-100 animate-pulse rounded" />
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
          <div className="absolute top-2 right-2 text-xs text-blue-500 z-50">
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

        <div>
          {showStats ? (
            <button
              className="flex items-center gap-2 mb-2 text-[#00306E] font-semibold focus:outline-none"
              onClick={() => setShowStats(false)}
              aria-expanded="true"
              aria-controls="stat-cards-panel"
              type="button"
            >
              <span>
                Show {assessmentTypeLabels[assessmentType]} Statistics
              </span>
              <ChevronUp className="w-4 h-4" />
            </button>
          ) : (
            <button
              className="flex items-center gap-2 mb-2 text-[#00306E] font-semibold focus:outline-none"
              onClick={() => setShowStats(true)}
              aria-expanded="false"
              aria-controls="stat-cards-panel"
              type="button"
            >
              <span>
                Show {assessmentTypeLabels[assessmentType]} Statistics
              </span>
              <ChevronDown className="w-4 h-4" />
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

        <div className="flex items-center justify-between">
          <ClassInfo
            className={classData.name}
            schoolYear={classData.schoolYear}
          />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-full px-4 py-2 bg-[#F4FCFD] border border-[rgba(84,164,255,0.38)] w-87.5">
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

            {/* Sort Dropdown */}
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
                className="px-4 py-2 bg-[#E4F4FF] rounded-md text-[#03438D] text-sm"
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
            students={tableStudents as any}
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

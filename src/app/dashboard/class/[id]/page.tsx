"use client";

import { useState, useEffect, useCallback } from "react";
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
import { getClassById } from "@/app/actions/class/getClassById";
import { createStudent } from "@/app/actions/student/createStudent";
import { deleteStudent } from "@/app/actions/student/deleteStudent";
import { updateStudent } from "@/app/actions/student/updateStudent";

interface StudentData {
  id: string;
  name: string;
  level?: number;
  classId: string;
  deletedAt?: Date | null;
}

interface ClassData {
  id: string;
  name: string;
  userId: string;
  schoolYear: string;
  archived: boolean;
  createdAt: Date;
  students: StudentData[];
}

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<
    "nameAsc" | "nameDesc" | "gradeAsc" | "gradeDesc"
  >("nameAsc");

  // Track assessment type and stat card collapse
  const [assessmentType, setAssessmentType] =
    useState<AssessmentTypeFilter>("ORAL_READING");
  const [showStats, setShowStats] = useState(true);

  // Remove caching: use local state for loading, error, and data
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchClassData = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setFetchError(null);
    try {
      const result = await getClassById(classId);
      if (result?.success && result.classItem) {
        setClassData(result.classItem);
      } else {
        setClassData(null);
        setFetchError(result?.error || "Failed to fetch class data");
      }
    } catch (err: unknown) {
      setClassData(null);
      if (err instanceof Error) {
        setFetchError(err.message);
      } else {
        setFetchError("Failed to fetch class data");
      }
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  const refetchClassData = async () => {
    await fetchClassData();
  };

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
      await refetchClassData();
      setIsModalOpen(false);
    } else {
      alert(result.error || "Failed to create student");
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    const result = await deleteStudent(studentId);

    if (result.success) {
      await refetchClassData();
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
      await refetchClassData();
    } else {
      alert(result.error || "Failed to update student");
    }
  };

  const handleAssessmentFilterChange = (type: AssessmentTypeFilter) => {
    setAssessmentType(type);
    setShowStats(true); // Optionally always open stats when switching type
  };

  const transformStudentsForTable = (students: StudentData[]) => {
    const transformed = students
      .map((student) => ({
        id: student.id,
        name: student.name,
        gradeLevel: levelToGradeLevel(student.level),
        lastAssessment: null as string | null,
      }))
      .filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    // Apply sorting based on the selected sort option
    if (sortOption === "nameAsc") {
      return transformed.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === "nameDesc") {
      return transformed.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOption === "gradeAsc") {
      return transformed.sort((a, b) =>
        a.gradeLevel.localeCompare(b.gradeLevel),
      );
    } else if (sortOption === "gradeDesc") {
      return transformed.sort((a, b) =>
        b.gradeLevel.localeCompare(a.gradeLevel),
      );
    }

    return transformed;
  };

  // Dummy stats for each assessment type (replace with real logic as needed)
  const calculateStats = (type: AssessmentTypeFilter) => {
    if (type === "ORAL_READING") {
      return {
        assessed: 10,
        independent: 5,
        instructional: 3,
        frustrated: 2,
      };
    }
    if (type === "COMPREHENSION") {
      return {
        assessed: 8,
        independent: 4,
        instructional: 2,
        frustrated: 2,
      };
    }
    if (type === "ORAL_READING_TEST") {
      return {
        assessed: 12,
        independent: 6,
        instructional: 4,
        frustrated: 2,
      };
    }
    return {
      assessed: 0,
      independent: 0,
      instructional: 0,
      frustrated: 0,
    };
  };

  // For label display
  const assessmentTypeLabels: Record<AssessmentTypeFilter, string> = {
    ORAL_READING: "Oral Reading Test",
    COMPREHENSION: "Reading Comprehension Test",
    ORAL_READING_TEST: "Reading Fluency Test",
  };

  // Skeleton loading state
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

  const stats = calculateStats(assessmentType);
  const tableStudents = transformStudentsForTable(classData.students);

  return (
    <div className="flex min-h-screen flex-col overflow-y-auto">
      <ClassListsHeader onCreateStudent={handleCreateStudent} />

      <main className="flex flex-1 flex-col gap-5 px-8 py-6">
        {/* Optional: Subtle updating indicator */}
        {loading && (
          <div className="absolute top-2 right-2 text-xs text-blue-500 z-50">
            Updating...
          </div>
        )}

        {/* Previous + Assessment Filter */}
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

        {/* Collapsible StatCards for all assessment types */}
        <div>
          <button
            className="flex items-center gap-2 mb-2 text-[#00306E] font-semibold focus:outline-none"
            onClick={() => setShowStats((prev) => !prev)}
            aria-expanded={showStats ? "true" : "false"}
            aria-controls="stat-cards-panel"
            type="button"
          >
            <span>Show {assessmentTypeLabels[assessmentType]} Statistics</span>
            {showStats ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {showStats && (
            <div id="stat-cards-panel">
              <StatCards
                assessedCount={stats.assessed}
                independentCount={stats.independent}
                instructionalCount={stats.instructional}
                frustratedCount={stats.frustrated}
              />
            </div>
          )}
        </div>

        {/* Class Info + Search + Sort */}
        <div className="flex items-center justify-between">
          <ClassInfo
            className={classData.name}
            schoolYear={classData.schoolYear}
          />

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex items-center gap-3 rounded-full px-4 py-2 bg-[#F4FCFD] border border-[rgba(84,164,255,0.38)] w-[350px]">
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

        <StudentTable
          students={tableStudents}
          totalStudents={tableStudents.length}
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

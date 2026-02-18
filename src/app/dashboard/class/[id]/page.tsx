"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ClassListsHeader } from "@/components/class-lists/classListsHeader";
import { StatCards } from "@/components/class-lists/statCards";
import { AssessmentTypeFilterDropdown } from "@/components/class-lists/assessmentTypeFilter";
import { StudentTable } from "@/components/class-lists/studentTable";
import { ClassInfo } from "@/components/class-lists/classInfo";
import { CreateStudentModal } from "@/components/class-lists/createStudentModal";
import { getClassById } from "@/app/actions/class/getClassById";
import { createStudent } from "@/app/actions/student/createStudent";
import { deleteStudent } from "@/app/actions/student/deleteStudent";
import { updateStudent } from "@/app/actions/student/updateStudent";
import { useCachedFetch, invalidateCache } from "@/lib/clientCache";

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

  // Use cached fetch for class data — keyed by class ID
  const {
    data: result,
    isLoading: loading,
    error: fetchHookError,
    refetch,
  } = useCachedFetch(
    `class-detail-${classId}`,
    () => getClassById(classId),
    { ttlMs: 2 * 60 * 1000, enabled: !!classId }
  );

  const classData: ClassData | null =
    result?.success && result.classItem ? result.classItem : null;
  const error =
    !loading && result && !result.success
      ? result.error || "Failed to fetch class data"
      : fetchHookError;

  const refetchClassData = async () => {
    // Invalidate this class detail and all class list caches
    invalidateCache(`class-detail-${classId}`);
    invalidateCache("class-list-", true);
    await refetch();
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

  const handleAssessmentFilterChange = () => {
    // TODO: Fetch stats based on assessment type filter when backend supports it
  };

  const transformStudentsForTable = (students: StudentData[]) => {
    return students.map((student) => ({
      id: student.id,
      name: student.name,
      gradeLevel: levelToGradeLevel(student.level),
      lastAssessment: null as string | null,
    }));
  };

  const calculateStats = () => {
    return {
      assessed: 0,
      independent: 0,
      instructional: 0,
      frustrated: 0,
    };
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg text-[#00306E]">Loading class data...</div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="text-lg text-red-500">{error || "Class not found"}</div>
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
  const tableStudents = transformStudentsForTable(classData.students);

  return (
    <div className="flex h-full flex-col">
      <ClassListsHeader onCreateStudent={handleCreateStudent} />

      <main className="flex flex-1 flex-col gap-5 px-8 py-6">
        {/* Previous Button and Assessment Filter in one row */}
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

        <StatCards
          assessedCount={stats.assessed}
          independentCount={stats.independent}
          instructionalCount={stats.instructional}
          frustratedCount={stats.frustrated}
        />

        <div className="flex flex-1 flex-col gap-4">
          <ClassInfo
            className={classData.name}
            schoolYear={classData.schoolYear}
          />

          <StudentTable
            students={tableStudents}
            totalStudents={classData.students.length}
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
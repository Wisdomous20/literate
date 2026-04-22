"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  ArrowUpDown,
  X,
} from "lucide-react";
import { ClassListsHeader } from "@/components/class-lists/classListsHeader";
import {
  AssessmentFilterTabs,
  type AssessmentTypeFilter,
} from "@/components/class-lists/assessmentFilterTabs";
import { StudentTable } from "@/components/class-lists/studentTable";
import { ClassInfoBox } from "@/components/class-lists/classInfoBox";
import { CreateStudentModal } from "@/components/class-lists/createStudentModal";
import { StatisticsSidebar } from "@/components/class-lists/statisticsSidebar";
import { WelcomeBox } from "@/components/class-lists/welcomeBox";
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
  classRoomId: string;
  deletedAt?: Date | null;
}

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
  const classRoomId = params.id as string;
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<
    "nameAsc" | "nameDesc" | "gradeAsc" | "gradeDesc"
  >("nameAsc");
  const [assessmentType, setAssessmentType] =
    useState<AssessmentTypeFilter>("ALL");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const {
    data: classData,
    isLoading: classLoading,
    error: classError,
  } = useClassById(classRoomId);

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
        showToast("Student created successfully!", "success");
        setIsModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ["students"] });
      } else {
        showToast("Failed to create student.", "error");
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
        showToast("Student deleted successfully!", "success");
        queryClient.invalidateQueries({ queryKey: ["students"] });
      } else {
        showToast("Failed to delete student.", "error");
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
        showToast("Student updated successfully!", "success");
        queryClient.invalidateQueries({ queryKey: ["students"] });
      } else {
        showToast("Failed to update student.", "error");
      }
    } catch (err) {
      console.error("Failed to update student:", err);
      showToast("Something went wrong. Please try again.", "error");
    }
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
          if (assessments.length === 0) {
            return {
              id: student.id,
              name: student.name || "No Name",
              gradeLevel: levelToGradeLevel(student.level),
              lastAssessment: null,
              assessmentType: "Awaiting Assessment",
            };
          }
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
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-white via-[#F8F9FF] to-[#EEF0FF]">
        <Loader2 className="h-12 w-12 animate-spin text-[#6666FF]" />
      </div>
    );
  }

  if (fetchError || !classData) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <span className="text-lg font-semibold text-[#00306E]">
          Failed to load class data
        </span>
        <span className="text-sm text-[#00306E]/60">{fetchError}</span>
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

  const sortLabels: Record<typeof sortOption, string> = {
    nameAsc: "Alphabetically (A-Z)",
    nameDesc: "Alphabetically (Z-A)",
    gradeAsc: "Grade (Low-High)",
    gradeDesc: "Grade (High-Low)",
  };

  return (
    <div className="flex flex-col min-h-screen bg-linear-to-br from-white via-[#F8F9FF] to-[#EEF0FF]">
      <ClassListsHeader />

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all ${
            toast.type === "success"
              ? "bg-green-500 shadow-lg"
              : "bg-red-500 shadow-lg"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {toast.message}
          <button
            onClick={() => setToast(null)}
            className="ml-2"
            aria-label="Close notification"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex-1 px-6 py-6 gap-6 flex">
        <div className="flex-1 bg-white rounded-2xl border border-[#9999FF]/25 p-6 shadow-[0_4px_16px_rgba(102,102,255,0.08)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <ClassInfoBox
              classData={classData}
              totalStudents={students.length}
              onCreateStudent={() => setIsModalOpen(true)}
              isCompact={true}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2 flex-1 border border-[#6666FF] rounded-full px-4 py-2 bg-[#F8F9FF]">
                <Search className="h-4 w-4 text-[#6666FF]/70" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-[#00306E] placeholder-[#00306E]/40 outline-none"
                />
              </div>
              <button
                onClick={() => {
                  const options: (
                    | "nameAsc"
                    | "nameDesc"
                    | "gradeAsc"
                    | "gradeDesc"
                  )[] = ["nameAsc", "nameDesc", "gradeAsc", "gradeDesc"];
                  const currentIndex = options.indexOf(sortOption);
                  setSortOption(options[(currentIndex + 1) % options.length]);
                }}
                className="flex items-center justify-center w-10 h-10 rounded-lg border border-[#6666FF]/30 bg-[#F8F9FF] text-[#6666FF] hover:bg-[#EEF0FF] transition-colors"
                title={`Sort: ${sortLabels[sortOption]}`}
                aria-label={`Sort students: ${sortLabels[sortOption]}`}
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </div>
            <div className="text-right whitespace-nowrap">
              <span className="text-xs font-bold text-[#00306E]/60 uppercase block">
                Total Students
              </span>
              <div className="text-2xl font-bold text-[#6666FF]">
                {students.length}
              </div>
            </div>
          </div>

          <AssessmentFilterTabs
            selectedType={assessmentType}
            onFilterChange={setAssessmentType}
            isCompact={true}
          />

          <StudentTable
            students={sortedStudents}
            totalStudents={students.length}
            studentAssessments={studentAssessments}
            onDeleteStudent={handleDeleteStudent}
            onUpdateStudent={handleUpdateStudent}
          />
        </div>

        <div className="w-80 flex flex-col gap-4 self-start">
          <WelcomeBox assessmentType={assessmentType} />
          <StatisticsSidebar stats={stats} assessmentType={assessmentType} />
        </div>
      </div>

      <CreateStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateStudent={handleStudentCreate}
      />
    </div>
  );
}

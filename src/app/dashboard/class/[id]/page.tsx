"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  AArrowDown,
  X,
  Plus,
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
import { useQueryClient } from "@tanstack/react-query";
import { useClassById } from "@/lib/hooks/useClassById";
import { useClassAssessmentSummaries } from "@/lib/hooks/useClassAssessmentSummaries";
import type { AssessmentSummaryData, StudentTableItem } from "@/types/assessment";

interface StudentData {
  id: string;
  name: string;
  level?: number;
  classRoomId: string;
  archived?: boolean;
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
  assessment: AssessmentSummaryData,
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
    "dateDesc" | "nameAsc" | "nameDesc" | "gradeAsc" | "gradeDesc"
  >("dateDesc");
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

  const students = useMemo(
    () => (classData?.students ?? []) as StudentData[],
    [classData?.students],
  );

  const {
    data: assessmentSummaries = [],
    isLoading: assessmentsLoading,
    error: assessmentsError,
  } = useClassAssessmentSummaries(classRoomId);

  const studentAssessments = useMemo(() => {
    const grouped: Record<string, AssessmentSummaryData[]> = {};
    for (const assessment of assessmentSummaries) {
      if (!grouped[assessment.studentId]) grouped[assessment.studentId] = [];
      grouped[assessment.studentId].push(assessment);
    }
    return grouped;
  }, [assessmentSummaries]);

  const loading = classLoading || assessmentsLoading;
  const fetchError = classError?.message || assessmentsError?.message || null;

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
        queryClient.invalidateQueries({ queryKey: ["class", classRoomId] });
        queryClient.invalidateQueries({
          queryKey: ["assessment-summaries", classRoomId],
        });
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
        queryClient.invalidateQueries({ queryKey: ["class", classRoomId] });
        queryClient.invalidateQueries({
          queryKey: ["assessment-summaries", classRoomId],
        });
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
        queryClient.invalidateQueries({ queryKey: ["class", classRoomId] });
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
          const latest = assessments[0] as AssessmentSummaryData | undefined;
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
      case "dateDesc": {
        const aTime = a.lastAssessment ? new Date(a.lastAssessment).getTime() : 0;
        const bTime = b.lastAssessment ? new Date(b.lastAssessment).getTime() : 0;
        return bTime - aTime;
      }
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
    dateDesc: "Newest to Latest",
    nameAsc: "Alphabetically (A-Z)",
    nameDesc: "Alphabetically (Z-A)",
    gradeAsc: "Grade (Low-High)",
    gradeDesc: "Grade (High-Low)",
  };

  return (
    <div className="flex flex-col min-h-screen bg-linear-to-br from-white via-[#F8F9FF] to-[#EEF0FF] overflow-y-auto scrollbar-thin scrollbar-thumb-[#5D5DFB]/40 scrollbar-track-transparent">
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

      <div className="flex-1 px-4 py-4 md:px-6 md:py-6 gap-4 md:gap-6 flex flex-col xl:flex-row min-w-0">
        <div className="flex-1 bg-white rounded-2xl border border-[#9999FF]/25 p-4 md:p-6 shadow-[0_4px_16px_rgba(102,102,255,0.08)] flex flex-col gap-4 min-w-0 overflow-x-hidden">
          <div className="flex items-center justify-between">
            <ClassInfoBox
              classData={classData}
              totalStudents={students.length}
              onCreateStudent={() => setIsModalOpen(true)}
              isCompact={true}
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div
              data-tour-target="class-search"
              className="flex items-center gap-2 flex-1 min-w-0 border border-[#6666FF] rounded-full px-4 py-2 bg-[#F8F9FF]"
            >
              <Search className="h-4 w-4 text-[#6666FF]/70 shrink-0" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#00306E] placeholder-[#00306E]/40 outline-none"
              />
            </div>
            <button
              data-tour-target="class-sort-button"
              onClick={() => {
                const options: (
                  | "dateDesc"
                  | "nameAsc"
                  | "nameDesc"
                  | "gradeAsc"
                  | "gradeDesc"
                )[] = ["dateDesc", "nameAsc", "nameDesc", "gradeAsc", "gradeDesc"];
                const currentIndex = options.indexOf(sortOption);
                setSortOption(options[(currentIndex + 1) % options.length]);
              }}
              className="flex items-center justify-center gap-1.5 h-10 rounded-lg border border-[#6666FF]/30 bg-[#F8F9FF] px-3 text-[#6666FF] hover:bg-[#EEF0FF] transition-colors shrink-0"
              title={`Sort: ${sortLabels[sortOption]}`}
              aria-label={`Sort students: ${sortLabels[sortOption]}`}
            >
              <AArrowDown className="h-4 w-4" />
              <span className="text-xs font-semibold hidden sm:inline">{sortOption === "nameAsc" ? "A→Z" : sortOption === "nameDesc" ? "Z→A" : sortOption === "gradeAsc" ? "Gr↑" : sortOption === "gradeDesc" ? "Gr↓" : "Date"}</span>
            </button>
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full translate-y-1 bg-[#B3A4F1]" />
              <button
                data-tour-target="create-student-button"
                onClick={() => setIsModalOpen(true)}
                className="relative flex items-center justify-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold shadow transition-transform bg-[#6666FF] text-white hover:bg-[#4F46E5] hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                Create Student
              </button>
            </div>
          </div>

          <AssessmentFilterTabs
            selectedType={assessmentType}
            onFilterChange={setAssessmentType}
            isCompact={true}
          />

          <div data-tour-target="student-table">
            <StudentTable
              students={sortedStudents}
              totalStudents={students.length}
              studentAssessments={studentAssessments}
              onDeleteStudent={handleDeleteStudent}
              onUpdateStudent={handleUpdateStudent}
            />
          </div>
        </div>

        <div
          data-tour-target="statistics-sidebar"
          className="w-full xl:w-80 flex flex-col gap-4 xl:self-start"
        >
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

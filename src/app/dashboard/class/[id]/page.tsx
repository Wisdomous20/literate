// "use client";

// import { useState, useMemo } from "react";
// import { useParams, useRouter } from "next/navigation";
// import {
//   ChevronLeft,
//   Search,
//   Loader2,
//   X,
//   CheckCircle,
//   XCircle,
// } from "lucide-react";
// import { ClassListsHeader } from "@/components/class-lists/classListsHeader";
// import { StatCards } from "@/components/class-lists/statCards";
// import {
//   AssessmentTypeFilterDropdown,
//   type AssessmentTypeFilter,
// } from "@/components/class-lists/assessmentTypeFilter";
// import { StudentTable } from "@/components/class-lists/studentTable";
// import { ClassInfo } from "@/components/class-lists/classInfo";
// import { CreateStudentModal } from "@/components/class-lists/createStudentModal";
// import { createStudent } from "@/app/actions/student/createStudent";
// import { deleteStudent } from "@/app/actions/student/deleteStudent";
// import { updateStudent } from "@/app/actions/student/updateStudent";
// import { useStudentList } from "@/lib/hooks/useStudentList";
// import { useQueryClient } from "@tanstack/react-query";
// import { useClassById } from "@/lib/hooks/useClassById";
// import { useStudentAssessments } from "@/lib/hooks/useStudentAssessments";
// import type { AssessmentData, StudentTableItem } from "@/types/assessment";

// interface StudentData {
//   id: string;
//   name: string;
//   level?: number;
//   classRoomId: string;
//   deletedAt?: Date | null;
// }

// const assessmentTypeLabels: Record<AssessmentTypeFilter, string> = {
//   ALL: "All Students",
//   ORAL_READING: "Oral Reading Test",
//   COMPREHENSION: "Reading Comprehension Test",
//   READING_FLUENCY: "Reading Fluency Test",
// };

// function levelToGradeLevel(level?: number): string {
//   if (!level) return "Grade 1";
//   return `Grade ${level}`;
// }

// function gradeLevelToNumber(gradeLevel: string): number {
//   const match = gradeLevel.match(/\d+/);
//   return match ? parseInt(match[0], 10) : 1;
// }

// function getAssessmentClassification(
//   assessment: AssessmentData,
// ): string | null {
//   switch (assessment.type) {
//     case "ORAL_READING":
//       return assessment.oralReadingResult?.classificationLevel || null;
//     case "READING_FLUENCY":
//       return assessment.oralFluency?.classificationLevel || null;
//     case "COMPREHENSION":
//       return assessment.comprehension?.classificationLevel || null;
//     default:
//       return null;
//   }
// }

// export default function ClassListsPage() {
//   const params = useParams();
//   const router = useRouter();
//   const classRoomId = params.id as string;
//   const queryClient = useQueryClient();

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [sortOption, setSortOption] = useState<
//     "nameAsc" | "nameDesc" | "gradeAsc" | "gradeDesc"
//   >("nameAsc");
//   const [assessmentType, setAssessmentType] =
//     useState<AssessmentTypeFilter>("ALL");
//   const [toast, setToast] = useState<{
//     message: string;
//     type: "success" | "error";
//   } | null>(null);

//   const {
//     data: classData,
//     isLoading: classLoading,
//     error: classError,
//   } = useClassById(classRoomId);

//   const {
//     data: students = [],
//     isLoading: studentsLoading,
//     error: studentsError,
//   } = useStudentList(classData?.name ?? "");

//   const studentIds = useMemo(
//     () => students.map((s: StudentData) => s.id),
//     [students],
//   );

//   const { data: studentAssessments, isLoading: assessmentsLoading } =
//     useStudentAssessments(studentIds);

//   const loading = classLoading || studentsLoading || assessmentsLoading;
//   const fetchError = classError?.message || studentsError?.message || null;

//   const showToast = (message: string, type: "success" | "error") => {
//     setToast({ message, type });
//     setTimeout(() => setToast(null), 4000);
//   };

//   const handleStudentCreate = async (data: {
//     studentName: string;
//     gradeLevel: string;
//   }) => {
//     if (!classData) return;
//     const level = gradeLevelToNumber(data.gradeLevel);
//     try {
//       const result = await createStudent(
//         data.studentName,
//         level,
//         classData.name,
//       );
//       if (result.success) {
//         await queryClient.invalidateQueries({
//           queryKey: ["students", classData.name],
//         });
//         setIsModalOpen(false);
//         showToast("Student created successfully!", "success");
//       } else {
//         showToast(result.error || "Failed to create student", "error");
//       }
//     } catch (err) {
//       console.error("Failed to create student:", err);
//       showToast("Something went wrong. Please try again.", "error");
//     }
//   };

//   const handleDeleteStudent = async (studentId: string) => {
//     try {
//       const result = await deleteStudent(studentId);
//       if (result.success) {
//         await queryClient.invalidateQueries({
//           queryKey: ["students", classData?.name],
//         });
//         await queryClient.invalidateQueries({
//           queryKey: ["assessments", studentId],
//         });
//         showToast("Student deleted successfully.", "success");
//       } else {
//         showToast(result.error || "Failed to delete student", "error");
//       }
//     } catch (err) {
//       console.error("Failed to delete student:", err);
//       showToast("Something went wrong. Please try again.", "error");
//     }
//   };

//   const handleUpdateStudent = async (
//     studentId: string,
//     name: string,
//     gradeLevel: string,
//   ) => {
//     const level = gradeLevelToNumber(gradeLevel);
//     try {
//       const result = await updateStudent(studentId, name, level);
//       if (result.success) {
//         await queryClient.invalidateQueries({
//           queryKey: ["students", classData?.name],
//         });
//         showToast("Student updated successfully.", "success");
//       } else {
//         showToast(result.error || "Failed to update student", "error");
//       }
//     } catch (err) {
//       console.error("Failed to update student:", err);
//       showToast("Something went wrong. Please try again.", "error");
//     }
//   };

//   const handleAssessmentFilterChange = (type: AssessmentTypeFilter) => {
//     setAssessmentType(type);
//   };

//   const transformStudentsForTable = (
//     studentList: StudentData[],
//   ): StudentTableItem[] => {
//     if (assessmentType === "ALL") {
//       return studentList
//         .map((student) => {
//           const assessments = [...(studentAssessments[student.id] || [])].sort(
//             (a, b) =>
//               new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime(),
//           );
//           const latest = assessments[0] as AssessmentData | undefined;
//           return {
//             id: student.id,
//             name: student.name || "No Name",
//             gradeLevel: levelToGradeLevel(student.level),
//             lastAssessment: latest
//               ? new Date(latest.dateTaken).toLocaleDateString()
//               : null,
//             assessmentType: latest ? latest.type : "Awaiting Assessment",
//           };
//         })
//         .filter((s) =>
//           s.name.toLowerCase().includes(searchQuery.toLowerCase()),
//         );
//     } else {
//       return studentList
//         .map((student) => {
//           const assessments = (studentAssessments[student.id] || []).filter(
//             (a) => a.type === assessmentType,
//           );
//           if (assessments.length === 0) return null;
//           const latest = [...assessments].sort(
//             (a, b) =>
//               new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime(),
//           )[0];
//           return {
//             id: student.id,
//             name: student.name || "No Name",
//             gradeLevel: levelToGradeLevel(student.level),
//             lastAssessment: latest
//               ? new Date(latest.dateTaken).toLocaleDateString()
//               : null,
//             assessmentType: assessmentType as string,
//           };
//         })
//         .filter((s): s is StudentTableItem => s !== null)
//         .filter((s) =>
//           s.name.toLowerCase().includes(searchQuery.toLowerCase()),
//         );
//     }
//   };

//   const calculateStats = () => {
//     let assessed = 0,
//       independent = 0,
//       instructional = 0,
//       frustrated = 0;
//     for (const student of students as StudentData[]) {
//       const all = studentAssessments[student.id] || [];
//       const relevant =
//         assessmentType === "ALL"
//           ? all
//           : all.filter((a) => a.type === assessmentType);
//       if (relevant.length === 0) continue;
//       assessed++;
//       const latest = [...relevant].sort(
//         (a, b) =>
//           new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime(),
//       )[0];
//       const level = getAssessmentClassification(latest);
//       if (level === "INDEPENDENT") independent++;
//       else if (level === "INSTRUCTIONAL") instructional++;
//       else if (level === "FRUSTRATION") frustrated++;
//     }
//     return { assessed, independent, instructional, frustrated };
//   };

//   if (loading && !classData) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-[#F8F9FF] to-[#EEF0FF]">
//         <Loader2 className="h-12 w-12 animate-spin text-[#6666FF]" />
//       </div>
//     );
//   }

//   if (fetchError || !classData) {
//     return (
//       <div className="flex h-full flex-col items-center justify-center gap-4">
//         <div className="text-base font-semibold text-red-500">
//           {fetchError || "Class not found"}
//         </div>
//         <button
//           onClick={() => router.back()}
//           className="text-sm font-semibold text-[#31318A] hover:underline transition-all"
//         >
//           Go back
//         </button>
//       </div>
//     );
//   }

//   const stats = calculateStats();
//   const tableStudents = transformStudentsForTable(students);

//   const sortedStudents = [...tableStudents].sort((a, b) => {
//     switch (sortOption) {
//       case "nameAsc":
//         return a.name.localeCompare(b.name);
//       case "nameDesc":
//         return b.name.localeCompare(a.name);
//       case "gradeAsc":
//         return a.gradeLevel.localeCompare(b.gradeLevel);
//       case "gradeDesc":
//         return b.gradeLevel.localeCompare(a.gradeLevel);
//       default:
//         return 0;
//     }
//   });

//   return (
//     <div className="flex h-screen flex-col bg-gradient-to-br from-white via-[#F8F9FF] to-[#EEF0FF]">
//       <ClassListsHeader onCreateStudent={() => setIsModalOpen(true)} />

//       {toast && (
//         <div
//           className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-semibold shadow-[0_8px_24px_rgba(0,48,110,0.2)] transition-all duration-300 border backdrop-blur-sm ${
//             toast.type === "success"
//               ? "bg-emerald-50 border-emerald-200 text-emerald-800"
//               : "bg-red-50 border-red-200 text-red-800"
//           }`}
//         >
//           {toast.type === "success" ? (
//             <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
//           ) : (
//             <XCircle className="h-5 w-5 shrink-0 text-red-500" />
//           )}
//           <span className="flex-1">{toast.message}</span>
//           <button
//             type="button"
//             onClick={() => setToast(null)}
//             aria-label="Close notification"
//             title="Close notification"
//             className="ml-2 rounded-full p-0.5 transition-colors hover:bg-black/10"
//           >
//             <X className="h-4 w-4" />
//           </button>
//         </div>
//       )}

//       <main className="flex-1 flex flex-col gap-6 px-4 sm:px-6 lg:px-8 py-6 min-h-0 overflow-y-auto">
//         {loading && (
//           <div className="absolute right-6 top-24 z-50 text-xs font-bold text-blue-500 flex items-center gap-2">
//             <Loader2 className="h-3 w-3 animate-spin" />
//             Updating…
//           </div>
//         )}

//         <div className="flex items-center justify-between gap-4">
//           <button
//             onClick={() => router.back()}
//             className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-[#31318A] transition-all hover:bg-white hover:shadow-[0_4px_12px_rgba(102,102,255,0.1)] active:scale-95"
//           >
//             <ChevronLeft className="h-5 w-5" />
//             Back
//           </button>

//           <AssessmentTypeFilterDropdown
//             onFilterChange={handleAssessmentFilterChange}
//           />
//         </div>

//         {assessmentType !== "ALL" && (
//           <div className="rounded-3xl bg-gradient-to-br from-[#EEF0FF] via-[#F5F7FF] to-[#FAFBFF] p-6 border border-[#6666FF]/15 shadow-[0_4px_16px_rgba(102,102,255,0.08)]">
//             <h3 className="text-xs font-bold text-[#6666FF] mb-4 uppercase tracking-widest">
//               {assessmentTypeLabels[assessmentType]} Statistics
//             </h3>
//             <StatCards
//               assessedCount={stats.assessed}
//               independentCount={stats.independent}
//               instructionalCount={stats.instructional}
//               frustratedCount={stats.frustrated}
//             />
//           </div>
//         )}

//         <div className="rounded-3xl bg-gradient-to-r from-[#E8E5FF]/70 via-[#F0ECFF]/70 to-[#F8F6FF]/70 p-6 border border-[#B8B3FF]/25 shadow-[0_4px_20px_rgba(102,102,255,0.1)] backdrop-blur-sm">
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
//             {/* Class Info */}
//             <div>
//               <ClassInfo
//                 className={classData.name}
//                 schoolYear={classData.schoolYear}
//               />
//             </div>

//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
//               {/* Search Input */}
//               <div className="flex items-center gap-3 rounded-2xl border border-[#9999FF]/40 bg-white/90 px-4 py-2.5 shadow-[0_4px_16px_rgba(102,102,255,0.12)] backdrop-blur-sm flex-1 sm:flex-none transition-all hover:shadow-[0_6px_20px_rgba(102,102,255,0.15)]">
//                 <Search className="h-4 w-4 text-[#6666FF]/70 shrink-0" />
//                 <input
//                   type="text"
//                   placeholder="Search students…"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="flex-1 bg-transparent text-sm text-[#00306E] outline-none placeholder:text-[#00306E]/40 font-medium"
//                 />
//               </div>

//               <select
//                 value={sortOption}
//                 onChange={(e) =>
//                   setSortOption(
//                     e.target.value as
//                       | "nameAsc"
//                       | "nameDesc"
//                       | "gradeAsc"
//                       | "gradeDesc",
//                   )
//                 }
//                 className="rounded-xl border border-[#9999FF]/40 bg-white/90 px-4 py-2.5 text-xs font-bold text-[#6666FF] outline-none transition-all hover:bg-white hover:shadow-[0_4px_12px_rgba(102,102,255,0.15)] focus:border-[#6666FF]/50 focus:ring-1 focus:ring-[#6666FF]/20 shadow-[0_2px_8px_rgba(102,102,255,0.08)] backdrop-blur-sm"
//                 aria-label="Sort students"
//                 title="Sort students"
//               >
//                 <option value="nameAsc">Name: A → Z</option>
//                 <option value="nameDesc">Name: Z → A</option>
//                 <option value="gradeAsc">Grade: ↑</option>
//                 <option value="gradeDesc">Grade: ↓</option>
//               </select>

//               <button
//                 onClick={() => setIsModalOpen(true)}
//                 type="button"
//                 className="rounded-xl border border-[#7A7AFB] bg-gradient-to-r from-[#6666FF] via-[#7270FF] to-[#7A7AFB] px-5 py-2.5 text-xs font-bold text-white shadow-[0_4px_16px_rgba(102,102,255,0.3)] transition-all hover:shadow-[0_8px_24px_rgba(102,102,255,0.4)] active:scale-95 whitespace-nowrap"
//               >
//                 + Create Student
//               </button>
//             </div>
//           </div>
//         </div>

//         <StudentTable
//           students={sortedStudents}
//           totalStudents={sortedStudents.length}
//           studentAssessments={studentAssessments}
//           onDeleteStudent={handleDeleteStudent}
//           onUpdateStudent={handleUpdateStudent}
//         />
//       </main>

//       <CreateStudentModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onCreateStudent={handleStudentCreate}
//       />
//     </div>
//   );
// }

// src/app/dashboard/class/[id]/page.tsx
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
  const classRoomId = params.id as string;
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<
    "nameAsc" | "nameDesc" | "gradeAsc" | "gradeDesc"
  >("nameAsc");
  const [assessmentType, setAssessmentType] = useState<AssessmentTypeFilter>("ALL");
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
        // For ALL filter, show all students, even if they only have one type
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-[#F8F9FF] to-[#EEF0FF]">
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

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-white via-[#F8F9FF] to-[#EEF0FF]">
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
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex-1 px-6 py-6 gap-6 flex">
        {/* Main Content - LEFT SECTION IN ONE WHITE BOX */}
        <div className="flex-1 bg-white rounded-2xl border border-[#9999FF]/25 p-6 shadow-[0_4px_16px_rgba(102,102,255,0.08)] flex flex-col gap-4">
          
          {/* Class Info Box with Create Student */}
          <div className="flex items-center justify-between">
            <ClassInfoBox
              classData={classData}
              totalStudents={students.length}
              onCreateStudent={() => setIsModalOpen(true)}
              isCompact={true}
            />
          </div>

          {/* Search, Sort, and Total Students */}
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
                  const options: ("nameAsc" | "nameDesc" | "gradeAsc" | "gradeDesc")[] = ["nameAsc", "nameDesc", "gradeAsc", "gradeDesc"];
                  const currentIndex = options.indexOf(sortOption);
                  setSortOption(options[(currentIndex + 1) % options.length]);
                }}
                className="flex items-center justify-center w-10 h-10 rounded-lg border border-[#6666FF]/30 bg-[#F8F9FF] text-[#6666FF] hover:bg-[#EEF0FF] transition-colors"
                title={`Sort: ${sortOption}`}
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

          {/* Assessment Type Filter Tabs */}
          <AssessmentFilterTabs
            selectedType={assessmentType}
            onFilterChange={setAssessmentType}
            isCompact={true}
          />

          {/* Student Table */}
          <StudentTable
            students={sortedStudents}
            totalStudents={students.length}
            studentAssessments={studentAssessments}
            onDeleteStudent={handleDeleteStudent}
            onUpdateStudent={handleUpdateStudent}
          />
        </div>

        {/* Right Sidebar - UNCHANGED */}
        <div className="w-80 flex flex-col gap-4">
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
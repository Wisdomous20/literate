// "use client";

// import { useState, useEffect } from "react";
// import { useParams, useRouter } from "next/navigation";
// import {
//   Edit2,
//   Trash2,
//   X,
//   Check,
//   Loader2,
//   ChevronLeft,
//   ChevronRight,
// } from "lucide-react";

// interface Student {
//   id: string;
//   name: string;
//   gradeLevel: string;
//   lastAssessment: string | null;
//   assessmentType: string;
// }

// interface StudentTableProps {
//   students: Student[];
//   totalStudents: number;
//   studentAssessments: Record<string, any[]>;
//   onDeleteStudent?: (studentId: string) => Promise<void>;
//   onUpdateStudent?: (
//     studentId: string,
//     name: string,
//     gradeLevel: string,
//   ) => Promise<void>;
// }

// type TabType = "all" | "completed";

// const gradeLevels = [
//   "Grade 1",
//   "Grade 2",
//   "Grade 3",
//   "Grade 4",
//   "Grade 5",
//   "Grade 6",
// ];

// const assessmentTypeLabels: Record<string, string> = {
//   ORAL_READING: "Oral Reading Test",
//   COMPREHENSION: "Reading Comprehension Test",
//   READING_FLUENCY: "Reading Fluency Test",
//   "Awaiting Assessment": "Awaiting Assessment",
// };

// export function StudentTable({
//   students,
//   totalStudents,
//   studentAssessments,
//   onDeleteStudent,
//   onUpdateStudent,
// }: StudentTableProps) {
//   const params = useParams();
//   const router = useRouter();
//   const classId = params.id as string;

//   const [activeTab, setActiveTab] = useState<TabType>("all");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [editName, setEditName] = useState("");
//   const [editGradeLevel, setEditGradeLevel] = useState("");
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [isDeleting, setIsDeleting] = useState<string | null>(null);

//   const studentsPerPage = 10;

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [activeTab]);

//   const filteredStudents = students;

//   const totalPages = Math.max(
//     1,
//     Math.ceil(filteredStudents.length / studentsPerPage),
//   );

//   const paginatedStudents = filteredStudents.slice(
//     (currentPage - 1) * studentsPerPage,
//     currentPage * studentsPerPage,
//   );

//   const tabs = [{ id: "all" as const, label: "All Students" }];

//   const handleEdit = (student: Student) => {
//     setEditingId(student.id);
//     setEditName(student.name);
//     setEditGradeLevel(student.gradeLevel);
//   };

//   const handleCancelEdit = () => {
//     setEditingId(null);
//     setEditName("");
//     setEditGradeLevel("");
//   };

//   const handleSaveEdit = async (studentId: string) => {
//     if (!onUpdateStudent || !editName.trim()) return;

//     try {
//       setIsUpdating(true);
//       await onUpdateStudent(studentId, editName.trim(), editGradeLevel);
//       setEditingId(null);
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const handleDelete = async (studentId: string) => {
//     if (!onDeleteStudent) return;
//     try {
//       setIsDeleting(studentId);
//       await onDeleteStudent(studentId);
//     } finally {
//       setIsDeleting(null);
//     }
//   };

//   // Always pass backend type (ORAL_READING, etc.) to report page
//   const handleViewReport = (studentId: string, assessmentType: string) => {
//     router.push(
//       `/dashboard/class/${classId}/report/${studentId}?assessmentType=${assessmentType}`,
//     );
//   };

//   return (
//     <div className="flex flex-1 flex-col">
//       {/* Tabs and Total Students */}
//       <div className="mb-4 flex items-center justify-between">
//         <div className="flex items-center gap-6">
//           {tabs.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className={`relative pb-2 text-[13px] font-bold ${
//                 activeTab === tab.id ? "text-[#00306E]" : "text-[#404040]/70"
//               }`}
//             >
//               {tab.label}
//               {activeTab === tab.id && (
//                 <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#162DB0]" />
//               )}
//             </button>
//           ))}
//         </div>
//         <span className="text-[15px] font-bold text-[#162DB0]">
//           {totalStudents} Total Students
//         </span>
//       </div>

//       {/* Table */}
//       <div className="flex-1 overflow-auto rounded-t-[5px] bg-[#E4F4FF] border border-[rgba(74,74,252,0.08)]">
//         <div className="grid grid-cols-[1fr_1fr_1fr_1fr_160px] px-6 py-3 bg-[rgba(74,74,252,0.12)] border-b">
//           <span className="text-[17px] font-medium text-[#00306E]">Name</span>
//           <span className="text-[17px] font-medium text-[#00306E]">
//             Grade Level
//           </span>
//           <span className="text-[17px] font-medium text-[#00306E]">
//             Latest Assessment Type
//           </span>
//           <span className="text-[17px] font-medium text-[#00306E]">
//             Last Assessment
//           </span>
//           <span />
//         </div>

//         <div className="divide-y divide-[rgba(74,74,252,0.08)]">
//           {paginatedStudents.length === 0 ? (
//             <div className="px-6 py-8 text-center text-[#00306E]/60">
//               No students found
//             </div>
//           ) : (
//             paginatedStudents.map((student) => {
//               const assessments = studentAssessments[student.id] || [];
//               const hasAssessment = assessments.length > 0;
//               // Always get the latest assessment from the assessments array
//               const latestAssessment = hasAssessment
//                 ? assessments
//                     .slice()
//                     .sort(
//                       (a, b) =>
//                         new Date(b.dateTaken).getTime() -
//                         new Date(a.dateTaken).getTime()
//                     )[0]
//                 : null;
//               // Use backend type for navigation, label for display
//               const backendAssessmentType = latestAssessment ? latestAssessment.type : "";

//               return (
//                 <div
//                   key={student.id}
//                   className="grid grid-cols-[1fr_1fr_1fr_1fr_160px] items-center px-6 py-4 bg-white/10 backdrop-blur-xl transition-all duration-200"
//                 >
//                   {editingId === student.id ? (
//                     <>
//                       <input
//                         aria-label="Edit name"
//                         value={editName}
//                         onChange={(e) => setEditName(e.target.value)}
//                         disabled={isUpdating}
//                         className="mr-2 rounded border border-[#162DB0]/30 px-2 py-1"
//                       />
//                       <select
//                         aria-label="Edit grade level"
//                         value={editGradeLevel}
//                         onChange={(e) => setEditGradeLevel(e.target.value)}
//                         disabled={isUpdating}
//                         className="mr-2 rounded border border-[#162DB0]/30 px-2 py-1"
//                       >
//                         {gradeLevels.map((level) => (
//                           <option key={level} value={level}>
//                             {level}
//                           </option>
//                         ))}
//                       </select>
//                       <span>
//                         {assessmentTypeLabels[student.assessmentType] ||
//                           student.assessmentType}
//                       </span>
//                       <span>{student.lastAssessment ?? "N/A"}</span>
//                       <div className="flex gap-2">
//                         <button
//                           onClick={() => handleSaveEdit(student.id)}
//                           disabled={isUpdating}
//                           className="rounded bg-[#162DB0] px-2 py-1 text-white"
//                         >
//                           {isUpdating ? (
//                             <Loader2 className="animate-spin" />
//                           ) : (
//                             <Check />
//                           )}
//                         </button>
//                         <button
//                           onClick={handleCancelEdit}
//                           disabled={isUpdating}
//                           className="rounded bg-gray-200 px-2 py-1"
//                         >
//                           <X />
//                         </button>
//                       </div>
//                     </>
//                   ) : (
//                     <>
//                       <span>{student.name}</span>
//                       <span>{student.gradeLevel}</span>
//                       <span>
//                         {assessmentTypeLabels[student.assessmentType] ||
//                           student.assessmentType}
//                       </span>
//                       <span>
//                         {student.lastAssessment ? (
//                           <span className="text-green-700">
//                             {student.lastAssessment}
//                           </span>
//                         ) : (
//                           <span className="text-gray-500">N/A</span>
//                         )}
//                       </span>
//                       <div className="flex gap-2">
//                         <button
//                           onClick={() => handleEdit(student)}
//                           className="rounded bg-blue-100 px-2 py-1"
//                         >
//                           <Edit2 size={16} />
//                         </button>
//                         <button
//                           onClick={() => handleDelete(student.id)}
//                           disabled={isDeleting === student.id}
//                           className={`rounded bg-red-100 px-2 py-1 ${
//                             isDeleting === student.id
//                               ? "opacity-50 cursor-not-allowed"
//                               : ""
//                           }`}
//                         >
//                           {isDeleting === student.id ? (
//                             <Loader2 className="animate-spin" />
//                           ) : (
//                             <Trash2 size={16} />
//                           )}
//                         </button>
//                         <button
//                           onClick={() =>
//                             handleViewReport(student.id, backendAssessmentType)
//                           }
//                           className={`rounded bg-green-100 px-2 py-1 ${
//                             !hasAssessment
//                               ? "opacity-50 cursor-not-allowed"
//                               : ""
//                           }`}
//                           disabled={!hasAssessment}
//                         >
//                           View
//                         </button>
//                       </div>
//                     </>
//                   )}
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </div>

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="flex justify-center items-center mt-4 gap-2">
//           <button
//             onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//             disabled={currentPage === 1}
//             className="p-2"
//           >
//             <ChevronLeft />
//           </button>
//           <span>
//             Page {currentPage} of {totalPages}
//           </span>
//           <button
//             onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
//             disabled={currentPage === totalPages}
//             className="p-2"
//           >
//             <ChevronRight />
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  gradeLevel: string;
  lastAssessment: string | null;
  assessmentType: string;
}

interface StudentTableProps {
  students: Student[];
  totalStudents: number;
  studentAssessments: Record<string, any[]>; // <-- NEW
  onDeleteStudent?: (studentId: string) => Promise<void>;
  onUpdateStudent?: (
    studentId: string,
    name: string,
    gradeLevel: string,
  ) => Promise<void>;
}

type TabType = "all" | "completed";

const gradeLevels = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
];

const assessmentTypeLabels: Record<string, string> = {
  ORAL_READING: "Oral Reading Test",
  COMPREHENSION: "Reading Comprehension Test",
  READING_FLUENCY: "Reading Fluency Test",
};

export function StudentTable({
  students,
  totalStudents,
  studentAssessments,
  onDeleteStudent,
  onUpdateStudent,
}: StudentTableProps) {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGradeLevel, setEditGradeLevel] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const studentsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const filteredStudents = students;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / studentsPerPage),
  );

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage,
  );

  const tabs = [{ id: "all" as const, label: "All Students" }];

  const handleEdit = (student: Student) => {
    setEditingId(student.id);
    setEditName(student.name);
    setEditGradeLevel(student.gradeLevel);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditGradeLevel("");
  };

  const handleSaveEdit = async (studentId: string) => {
    if (!onUpdateStudent || !editName.trim()) return;

    try {
      setIsUpdating(true);
      await onUpdateStudent(studentId, editName.trim(), editGradeLevel);
      setEditingId(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!onDeleteStudent) return;

    try {
      setIsDeleting(studentId);
      await onDeleteStudent(studentId);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewReport = (studentId: string, assessmentType: string) => {
    router.push(
      `/dashboard/class/${classId}/report/${studentId}?assessmentType=${assessmentType}`,
    );
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Tabs and Total Students */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-2 text-[13px] font-bold ${
                activeTab === tab.id ? "text-[#00306E]" : "text-[#404040]/70"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#162DB0]" />
              )}
            </button>
          ))}
        </div>
        <span className="text-[15px] font-bold text-[#162DB0]">
          {totalStudents} Total Students
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-t-[5px] bg-[#E4F4FF] border border-[rgba(74,74,252,0.08)]">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_160px] px-6 py-3 bg-[rgba(74,74,252,0.12)] border-b">
          <span className="text-[17px] font-medium text-[#00306E]">Name</span>
          <span className="text-[17px] font-medium text-[#00306E]">
            Grade Level
          </span>
          <span className="text-[17px] font-medium text-[#00306E]">
            Latest Assessment Type
          </span>
          <span className="text-[17px] font-medium text-[#00306E]">
            Last Assessment
          </span>
          <span />
        </div>

        <div className="divide-y divide-[rgba(74,74,252,0.08)]">
          {paginatedStudents.length === 0 ? (
            <div className="px-6 py-8 text-center text-[#00306E]/60">
              No students found
            </div>
          ) : (
            paginatedStudents.map((student) => {
              const hasAssessment =
                (studentAssessments[student.id] || []).length > 0;
              return (
                <div
                  key={student.id}
                  className="grid grid-cols-[1fr_1fr_1fr_1fr_160px] items-center px-6 py-4 bg-white/10 backdrop-blur-xl transition-all duration-200"
                >
                  {editingId === student.id ? (
                    <>
                      <input
                        aria-label="Edit name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={isUpdating}
                        className="mr-2 rounded border border-[#162DB0]/30 px-2 py-1"
                      />
                      <select
                        aria-label="Edit grade level"
                        value={editGradeLevel}
                        onChange={(e) => setEditGradeLevel(e.target.value)}
                        disabled={isUpdating}
                        className="mr-2 rounded border border-[#162DB0]/30 px-2 py-1"
                      >
                        {gradeLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                      <span>
                        {assessmentTypeLabels[student.assessmentType] ||
                          student.assessmentType}
                      </span>
                      <span>{student.lastAssessment ?? "N/A"}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(student.id)}
                          disabled={isUpdating}
                          className="rounded bg-[#162DB0] px-2 py-1 text-white"
                        >
                          {isUpdating ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Check />
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          className="rounded bg-gray-200 px-2 py-1"
                        >
                          <X />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span>{student.name}</span>
                      <span>{student.gradeLevel}</span>
                      <span>
                        {assessmentTypeLabels[student.assessmentType] ||
                          student.assessmentType}
                      </span>
                      <span>
                        {student.lastAssessment ? (
                          <span className="text-green-700">
                            {student.lastAssessment}
                          </span>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(student)}
                          className="rounded bg-blue-100 px-2 py-1"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          disabled={isDeleting === student.id}
                          className="rounded bg-red-100 px-2 py-1"
                        >
                          {isDeleting === student.id ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleViewReport(student.id, student.assessmentType)
                          }
                          className={`rounded bg-green-100 px-2 py-1 ${!hasAssessment ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={!hasAssessment}
                        >
                          View Report
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2"
          >
            <ChevronLeft />
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2"
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}

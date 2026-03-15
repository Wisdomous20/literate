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
  GraduationCap,
  CheckCircle2,
  Calendar,
  User,
} from "lucide-react";
import type { AssessmentData, StudentTableItem } from "@/types/assessment";

interface StudentTableProps {
  students: StudentTableItem[];
  totalStudents: number;
  studentAssessments: Record<string, AssessmentData[]>;
  onDeleteStudent?: (studentId: string) => Promise<void>;
  onUpdateStudent?: (
    studentId: string,
    name: string,
    gradeLevel: string,
  ) => Promise<void>;
}

const gradeLevels = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
];

const assessmentTypeLabels: Record<string, string> = {
  ORAL_READING: "Oral Reading Test",
  COMPREHENSION: "Comprehension Test",
  READING_FLUENCY: "Reading Fluency Test",
  "Awaiting Assessment": "—",
};

const cardColors = [
  {
    bg: "from-blue-50 to-blue-100",
    border: "border-blue-300",
    iconBg: "bg-blue-100",
  },
  {
    bg: "from-pink-50 to-pink-100",
    border: "border-pink-300",
    iconBg: "bg-pink-100",
  },
  {
    bg: "from-green-50 to-green-100",
    border: "border-green-300",
    iconBg: "bg-green-100",
  },
  {
    bg: "from-yellow-50 to-yellow-100",
    border: "border-yellow-300",
    iconBg: "bg-yellow-100",
  },
  {
    bg: "from-purple-50 to-purple-100",
    border: "border-purple-300",
    iconBg: "bg-purple-100",
  },
];

export function StudentTable({
  students,
  // totalStudents,
  studentAssessments,
  onDeleteStudent,
  onUpdateStudent,
}: StudentTableProps) {
  const params = useParams();
  const router = useRouter();
  const classRoomId = params.id as string;

  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGradeLevel, setEditGradeLevel] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const cardsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [students]);

  const totalPages = Math.max(1, Math.ceil(students.length / cardsPerPage));

  const paginatedStudents = students.slice(
    (currentPage - 1) * cardsPerPage,
    currentPage * cardsPerPage,
  );

  const handleEdit = (e: React.MouseEvent, student: StudentTableItem) => {
    e.stopPropagation();
    setEditingId(student.id);
    setEditName(student.name);
    setEditGradeLevel(student.gradeLevel);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditName("");
    setEditGradeLevel("");
  };

  const handleSaveEdit = async (
    e: React.MouseEvent,
    studentId: string,
  ) => {
    e.stopPropagation();
    if (!onUpdateStudent || !editName.trim()) return;
    try {
      setIsUpdating(true);
      await onUpdateStudent(studentId, editName.trim(), editGradeLevel);
      setEditingId(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (
    e: React.MouseEvent,
    studentId: string,
  ) => {
    e.stopPropagation();
    if (!onDeleteStudent) return;
    try {
      setIsDeleting(studentId);
      await onDeleteStudent(studentId);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCardClick = (student: StudentTableItem) => {
  const hasAssessment = (studentAssessments[student.id] || []).length > 0;
  if (!hasAssessment) return;

  router.push(
    `/dashboard/class/${classRoomId}/report/${student.id}?assessmentType=${encodeURIComponent(student.assessmentType)}`
  );
};

  const getCardColor = (index: number) => cardColors[index % cardColors.length];

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Cards Grid */}
      {paginatedStudents.length === 0 ? (
        <div className="col-span-full flex items-center justify-center rounded-3xl border-2 border-dashed border-[#6666FF]/20 bg-linear-to-br from-[#F8F9FF] to-[#EEF0FF] py-20 px-4">
          <span className="text-sm font-medium text-[#00306E]/50">
            No students found
          </span>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 w-full">
          {paginatedStudents.map((student, index) => {
            const hasAssessment =
              (studentAssessments[student.id] || []).length > 0;
            const colorScheme = getCardColor(index);

            return (
              <div
                key={student.id}
                className={`relative h-full rounded-2xl border-2 ${colorScheme.border} bg-linear-to-br ${colorScheme.bg} shadow-[0_4px_16px_rgba(102,102,255,0.08)] transition-all duration-300`}
              >
                {editingId === student.id ? (
                  // Edit Mode
                  <div className="h-full p-4 flex flex-col gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#00306E] mb-1.5 block uppercase tracking-wide">
                        Name
                      </label>
                      <input
                        aria-label="Edit student name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={50}
                        disabled={isUpdating}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded-lg border border-[#6666FF]/30 bg-white/80 px-2.5 py-2 text-xs font-semibold text-[#00306E] placeholder:text-[#00306E]/40 focus:border-[#6666FF]/50 focus:outline-none focus:ring-1 focus:ring-[#6666FF]/20 disabled:opacity-50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#00306E] mb-1.5 block uppercase tracking-wide">
                        Grade
                      </label>
                      <select
                        aria-label="Edit grade level"
                        value={editGradeLevel}
                        onChange={(e) => setEditGradeLevel(e.target.value)}
                        disabled={isUpdating}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded-lg border border-[#6666FF]/30 bg-white/80 px-2.5 py-2 text-xs font-semibold text-[#00306E] focus:border-[#6666FF]/50 focus:outline-none focus:ring-1 focus:ring-[#6666FF]/20 disabled:opacity-50 transition-all"
                      >
                        {gradeLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 pt-2 justify-center">
                      <button
                        onClick={(e) => handleSaveEdit(e, student.id)}
                        disabled={isUpdating}
                        className="flex items-center justify-center rounded-full bg-linear-to-r from-[#6666FF] to-[#7A7AFB] w-8 h-8 text-white transition-all hover:shadow-lg disabled:opacity-50"
                        aria-label="Save changes"
                        title="Save changes"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isUpdating}
                        className="flex items-center justify-center rounded-full border border-[#6666FF]/30 bg-white/80 w-8 h-8 text-[#6666FF] transition-all hover:bg-white/90 disabled:opacity-50"
                        aria-label="Cancel editing"
                        title="Cancel editing"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div
                    onClick={() => handleCardClick(student)}
                    className={`h-full p-4 flex flex-col gap-3 cursor-${hasAssessment ? "pointer" : "default"} ${
                      hasAssessment
                        ? "hover:shadow-[0_12px_32px_rgba(102,102,255,0.18)] hover:border-[#6666FF]/40 hover:-translate-y-1"
                        : "opacity-70"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colorScheme.iconBg} shadow-sm`}>
                        <User className="h-4 w-4 text-[#6666FF]" />
                      </div>
                      <h3 className="text-sm font-bold text-[#00306E] truncate group-hover:text-[#31318A] transition-colors">
                        {student.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/60 backdrop-blur-sm">
                      <GraduationCap className="h-4 w-4 text-[#6666FF] shrink-0" />
                      <span className="text-xs font-semibold text-[#6666FF] truncate">
                        {student.gradeLevel}
                      </span>
                    </div>
                    {/* Info Details with Titles */}
                    <div className="flex flex-col gap-3 mt-2">
                      <div>
                        <div className="text-[11px] font-bold text-[#6666FF] mb-0.5">Assessment Type</div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-[#6666FF] shrink-0" />
                          <span className="text-xs font-semibold text-[#00306E] truncate">
                            {assessmentTypeLabels[student.assessmentType] ?? student.assessmentType}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-[#6666FF] mb-0.5">Last Date</div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-[#6666FF] shrink-0" />
                          <span className="text-xs font-semibold text-[#00306E]">
                            {student.lastAssessment ? (
                              <span className="text-emerald-600">
                                {student.lastAssessment}
                              </span>
                            ) : (
                              <span className="text-[#00306E]/40">—</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 justify-center">
                      <button
                        onClick={(e) => handleEdit(e, student)}
                        className="flex items-center justify-center rounded-full bg-white/80 border border-[#6666FF]/20 w-8 h-8 text-[#162DB0] text-xs font-bold transition-all hover:bg-white active:scale-95 shadow"
                        aria-label={`Edit ${student.name}`}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(student.id);
                        }}
                        disabled={isDeleting === student.id}
                        className="flex items-center justify-center rounded-full bg-red-50/80 border border-red-200/40 w-8 h-8 text-red-500 text-xs font-bold transition-all hover:bg-red-100/80 disabled:opacity-50 active:scale-95 shadow"
                        aria-label={`Delete ${student.name}`}
                        title="Delete"
                      >
                        {isDeleting === student.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                    {hasAssessment && (
                      <div className="text-center text-xs text-[#6666FF]/60 font-semibold pt-1">
                        Click to view
                      </div>
                    )}
                  </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirmId === student.id && (
                  <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div
                      className="absolute inset-0 bg-black/30 backdrop-blur-md"
                      onClick={() => setDeleteConfirmId(null)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,48,110,0.3)] p-5 max-w-sm w-full">
                      <h3 className="text-base font-bold text-[#00306E] mb-1.5">
                        Delete Student?
                      </h3>
                      <p className="text-xs text-[#00306E]/70 mb-5">
                        Delete{" "}
                        <span className="font-semibold">{student.name}</span>?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            handleDelete(e, student.id);
                            setDeleteConfirmId(null);
                          }}
                          className="flex-1 rounded-lg bg-red-500 text-white text-xs font-bold py-2 transition-all hover:bg-red-600 active:scale-95 shadow"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="flex-1 rounded-lg border border-[#6666FF]/30 bg-[#F8F9FF] text-[#6666FF] text-xs font-bold py-2 transition-all hover:bg-[#EEEEFF] active:scale-95"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 rounded-lg border border-[#6666FF]/25 bg-white px-3.5 py-2 text-xs font-bold text-[#6666FF] transition-all hover:bg-linear-to-r hover:from-[#F8F9FF] hover:to-[#EEF0FF] hover:shadow-lg hover:border-[#6666FF]/40 disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                  currentPage === i + 1
                    ? "bg-linear-to-r from-[#6666FF] to-[#7A7AFB] text-white shadow"
                    : "bg-white text-[#6666FF] border border-[#6666FF]/25 hover:bg-linear-to-r hover:from-[#F8F9FF] hover:to-[#EEF0FF] hover:shadow"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 rounded-lg border border-[#6666FF]/25 bg-white px-3.5 py-2 text-xs font-bold text-[#6666FF] transition-all hover:bg-linear-to-r hover:from-[#F8F9FF] hover:to-[#EEF0FF] hover:shadow-lg hover:border-[#6666FF]/40 disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
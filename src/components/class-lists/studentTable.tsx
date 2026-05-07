"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  BookOpen,
} from "lucide-react";
import type { AssessmentSummaryData, StudentTableItem } from "@/types/assessment";

interface StudentTableProps {
  students: StudentTableItem[];
  totalStudents: number;
  studentAssessments: Record<string, AssessmentSummaryData[]>;
  onDeleteStudent?: (studentId: string) => Promise<void>;
  onUpdateStudent?: (
    studentId: string,
    name: string,
    gradeLevel: string,
  ) => Promise<void>;
  assessmentType?: string;
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
  COMPREHENSION: "Reading Comprehension Test",
  READING_FLUENCY: "Reading Fluency Test",
  // Add more types here as needed
};

const getAssessmentTypeLabel = (type?: string) => {
  if (!type) return "—";
  return assessmentTypeLabels[type] || type;
};

export function StudentTable({
  students,
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

  const cardsPerPage = 6;

  // Remove this effect if you want to stay on the same page after edit/delete
  // useEffect(() => {
  //   setCurrentPage(1);
  // }, [students]);

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

  const handleSaveEdit = async (e: React.MouseEvent, studentId: string) => {
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

  const handleDelete = async (e: React.MouseEvent, studentId: string) => {
    e.stopPropagation();
    if (!onDeleteStudent) return;
    try {
      setIsDeleting(studentId);
      await onDeleteStudent(studentId);
      setDeleteConfirmId(null);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCardClick = (student: StudentTableItem) => {
    const assessments = studentAssessments[student.id] || [];
    if (assessments.length === 0) return;
    router.push(
      `/dashboard/class/${classRoomId}/report/${student.id}?assessmentType=${encodeURIComponent(
        student.assessmentType,
      )}`,
    );
  };

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Cards Grid */}
      {paginatedStudents.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-[#6666FF]/20 bg-[#F8F9FF] py-12 px-4">
          <span className="text-sm font-medium text-[#00306E]/50">
            No students found
          </span>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-3 w-full flex-1">
          {paginatedStudents.map((student) => {
            const hasAssessment =
              (studentAssessments[student.id] || []).length > 0;

            // The whole card is clickable unless in edit mode
            return (
              <div
                key={student.id}
                onClick={
                  editingId === student.id
                    ? undefined
                    : () => hasAssessment && handleCardClick(student)
                }
                className={`
                  relative bg-white rounded-2xl
                  border-l border-t border-r-[3px] border-b-[3px] border-[#5D5DFB]
                  shadow-md shadow-[#5D5DFB]/10
                  transition-all duration-200
                  p-4 flex flex-col gap-3
                  ${
                    editingId === student.id
                      ? ""
                      : hasAssessment
                        ? "cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:shadow-[#5D5DFB]/20 active:scale-95"
                        : "cursor-not-allowed"
                  }
                `}
                title={
                  editingId === student.id
                    ? ""
                    : hasAssessment
                      ? "Click to view details"
                      : "No results yet"
                }
              >
                {editingId === student.id ? (
                  // Edit Mode
                  <div className="h-full flex flex-col gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="rounded-lg border border-[#6666FF]/30 bg-[#F8F9FF] px-3 py-2 text-sm font-semibold text-[#00306E] outline-none focus:border-[#6666FF]"
                      maxLength={50}
                      placeholder="Student name"
                    />
                    <select
                      value={editGradeLevel}
                      onChange={(e) => setEditGradeLevel(e.target.value)}
                      className="rounded-lg border border-[#6666FF]/30 bg-[#F8F9FF] px-3 py-2 text-sm font-semibold text-[#00306E] outline-none focus:border-[#6666FF]"
                      title="Grade level"
                    >
                      {gradeLevels.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2 justify-center pt-2">
                      <button
                        onClick={(e) => handleSaveEdit(e, student.id)}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#E8D5FF] px-3 py-2 text-xs font-bold text-[#6666FF] transition-all hover:bg-[#D9C0FF] disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#F0E8FA] px-3 py-2 text-xs font-bold text-[#00306E]/60 transition-all hover:bg-[#E8D5FF]"
                        aria-label="Cancel edit"
                        title="Cancel edit"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    {/* Student Name and Grade */}
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="h-4 w-4 text-[#6666FF] shrink-0" />
                      <span
                        className="text-sm font-bold text-[#00306E] truncate flex-1 min-w-0"
                        title={student.name}
                      >
                        {student.name}
                      </span>
                      <span className="shrink-0 text-[9px] rounded-full bg-[#E8D5FF]/60 px-1.5 py-0.5 text-black font-normal leading-tight">
                        {student.gradeLevel}
                      </span>
                    </div>

                    {/* Assessment Type with label */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-normal text-[#5D5DFB]/60 uppercase tracking-wider">Assessment Type</span>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-[#6666FF] shrink-0" />
                        <span className="text-xs text-[#00306E] truncate">
                          {getAssessmentTypeLabel(student.assessmentType)}
                        </span>
                      </div>
                    </div>

                    {/* Date with label */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-normal text-[#5D5DFB]/60 uppercase tracking-wider">Date</span>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-[#6666FF] shrink-0" />
                        <span className="text-xs text-[#00306E]">
                          {student.lastAssessment ? (
                            <span>{student.lastAssessment}</span>
                          ) : (
                            <span className="text-[#00306E]/40">—</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 mt-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(e, student);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-white border border-[#6666FF]/40 px-2 py-2 text-xs font-bold text-[#6666FF] transition-all hover:bg-[#F0F4FF] hover:border-[#6666FF] active:scale-95"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(student.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-white border border-[#E84C3D]/40 px-2 py-2 text-xs font-bold text-[#E84C3D] transition-all hover:bg-[#FFF0EE] hover:border-[#E84C3D] active:scale-95"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                    {!hasAssessment && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-2xl bg-white/70 backdrop-blur-[2px]">
                        <span className="bg-white text-[#6666FF] text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg border border-[#6666FF]/20">
                          No results yet
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Delete Confirmation */}
                {deleteConfirmId === student.id && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/40 p-4 backdrop-blur-sm">
                    <span className="text-sm font-bold text-white text-center">
                      Delete {student.name}?
                    </span>
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={(e) => handleDelete(e, student.id)}
                        disabled={isDeleting === student.id}
                        className="flex-1 rounded-lg bg-[#E84C3D] px-2 py-1 text-xs font-bold text-white transition-all hover:bg-[#D93D30] disabled:opacity-50"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 rounded-lg bg-white/90 px-2 py-1 text-xs font-bold text-[#00306E] transition-all hover:bg-white"
                      >
                        Cancel
                      </button>
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
        <div className="flex items-center justify-center gap-2 pt-4 mt-auto">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 rounded-lg border-2 border-[#6666FF]/25 bg-white px-3 py-2 text-xs font-bold text-[#6666FF] transition-all hover:bg-[#F8F9FF] hover:border-[#6666FF]/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`h-8 w-8 rounded-full text-xs font-bold transition-all flex items-center justify-center ${
                  currentPage === i + 1
                    ? "bg-[#6666FF] text-white shadow-[0_4px_12px_rgba(102,102,255,0.3)]"
                    : "bg-white border-2 border-[#6666FF]/25 text-[#6666FF] hover:bg-[#F8F9FF] hover:border-[#6666FF]/40"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 rounded-lg border-2 border-[#6666FF]/25 bg-white px-3 py-2 text-xs font-bold text-[#6666FF] transition-all hover:bg-[#F8F9FF] hover:border-[#6666FF]/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

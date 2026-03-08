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
  Eye,
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
];

const assessmentTypeLabels: Record<string, string> = {
  ORAL_READING: "Oral Reading",
  COMPREHENSION: "Comprehension",
  READING_FLUENCY: "Reading Fluency",
  "Awaiting Assessment": "—",
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

  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGradeLevel, setEditGradeLevel] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const studentsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [students]);

  const totalPages = Math.max(
    1,
    Math.ceil(students.length / studentsPerPage),
  );

  const paginatedStudents = students.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage,
  );

  const handleEdit = (student: StudentTableItem) => {
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
    <div className="flex flex-col">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-[#00306E]/60">
          Showing {paginatedStudents.length} of {totalStudents} students
        </span>
      </div>

      <div className="overflow-auto rounded-2xl border border-[#6666FF]/10 bg-white shadow-sm">
        <div className="grid grid-cols-[1.5fr_1fr_1.2fr_1fr_140px] border-b border-[#6666FF]/8 bg-[#F8F9FF] px-5 py-3">
          <span className="text-xs font-semibold text-[#00306E]">Name</span>
          <span className="text-xs font-semibold text-[#00306E]">Grade Level</span>
          <span className="text-xs font-semibold text-[#00306E]">Latest Assessment</span>
          <span className="text-xs font-semibold text-[#00306E]">Last Date</span>
          <span className="text-xs font-semibold text-[#00306E]">Actions</span>
        </div>

        <div className="divide-y divide-[#6666FF]/5">
          {paginatedStudents.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[#00306E]/50">
              No students found
            </div>
          ) : (
            paginatedStudents.map((student) => {
              const hasAssessment =
                (studentAssessments[student.id] || []).length > 0;
              return (
                <div
                  key={student.id}
                  className="grid grid-cols-[1.5fr_1fr_1.2fr_1fr_140px] items-center bg-white px-5 py-3 transition-colors hover:bg-[#FAFAFF]"
                >
                  {editingId === student.id ? (
                    <>
                      <input
                        aria-label="Edit student name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={isUpdating}
                        className="mr-2 rounded border border-[#162DB0]/30 px-2 py-1 text-xs"
                      />
                      <select
                        aria-label="Edit grade level"
                        value={editGradeLevel}
                        onChange={(e) => setEditGradeLevel(e.target.value)}
                        disabled={isUpdating}
                        className="mr-2 rounded border border-[#162DB0]/30 px-2 py-1 text-xs"
                      >
                        {gradeLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-[#00306E]/60">
                        {assessmentTypeLabels[student.assessmentType] ??
                          student.assessmentType}
                      </span>
                      <span className="text-xs text-[#00306E]/60">
                        {student.lastAssessment ?? "—"}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleSaveEdit(student.id)}
                          disabled={isUpdating}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#162DB0] text-white disabled:opacity-50"
                          aria-label="Save changes"
                          title="Save changes"
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-200 disabled:opacity-50"
                          aria-label="Cancel editing"
                          title="Cancel editing"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="truncate pr-2 text-sm font-medium text-[#00306E]">
                        {student.name}
                      </span>
                      <span className="text-xs text-[#00306E]/80">
                        {student.gradeLevel}
                      </span>
                      <span className="text-xs text-[#00306E]/70">
                        {assessmentTypeLabels[student.assessmentType] ??
                          student.assessmentType}
                      </span>
                      <span className="text-xs">
                        {student.lastAssessment ? (
                          <span className="text-emerald-700">
                            {student.lastAssessment}
                          </span>
                        ) : (
                          <span className="text-[#00306E]/40">—</span>
                        )}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(student)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E4F4FF] text-[#162DB0] transition-colors hover:bg-[#d0e8ff]"
                          aria-label={`Edit ${student.name}`}
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          disabled={isDeleting === student.id}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors hover:bg-red-100 disabled:opacity-50"
                          aria-label={`Delete ${student.name}`}
                          title="Delete"
                        >
                          {isDeleting === student.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleViewReport(student.id, student.assessmentType)
                          }
                          disabled={!hasAssessment}
                          className={`flex h-7 items-center gap-1 rounded-lg border border-[#6666FF] px-2 text-[11px] font-medium transition-colors ${
                            hasAssessment
                              ? "bg-transparent text-[#6666FF] hover:bg-[#6666FF]/10"
                              : "cursor-not-allowed border-gray-300 bg-transparent text-gray-400"
                          }`}
                          title="View report"
                        >
                          <Eye size={11} />
                          View
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

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-[#00306E]/60">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#162DB0]/20 text-[#162DB0] transition-colors hover:bg-[#E4F4FF] disabled:opacity-30"
              aria-label="Previous page"
              title="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                    currentPage === page
                      ? "border-[#6666FF] bg-[#6666FF] text-white"
                      : "border-[#162DB0]/20 text-[#162DB0] hover:bg-[#E4F4FF]"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#162DB0]/20 text-[#162DB0] transition-colors hover:bg-[#E4F4FF] disabled:opacity-30"
              aria-label="Next page"
              title="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
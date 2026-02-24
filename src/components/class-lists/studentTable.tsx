"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  gradeLevel: string;
  lastAssessment: string | null;
}

interface StudentTableProps {
  students: Student[];
  totalStudents: number;
  onDeleteStudent?: (studentId: string) => Promise<void>;
  onUpdateStudent?: (
    studentId: string,
    name: string,
    gradeLevel: string,
  ) => Promise<void>;
}

type TabType = "all" | "completed" | "awaiting";

const gradeLevels = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
];

export function StudentTable({
  students,
  totalStudents,
  onDeleteStudent,
  onUpdateStudent,
}: StudentTableProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGradeLevel, setEditGradeLevel] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const studentsPerPage = 10; // Updated to 10 students per page

  /* Reset page when tab changes */
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const filteredStudents = students.filter((student) => {
    if (activeTab === "completed") return student.lastAssessment !== null;
    if (activeTab === "awaiting") return student.lastAssessment === null;
    return true;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / studentsPerPage),
  );

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage,
  );

  const tabs = [
    { id: "all" as const, label: "All Students" },
    { id: "completed" as const, label: "Completed" },
    { id: "awaiting" as const, label: "Awaiting" },
  ];

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

  return (
    <div className="flex flex-1 flex-col">
      {/* Tabs and Total Students in one row */}
      <div className="mb-4 flex items-center justify-between">
        {/* Tabs */}
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

        {/* Total Students */}
        <div>
          <span className="text-[15px] font-bold text-[#162DB0]">
            {totalStudents} Total Students
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden rounded-t-[5px] bg-[#E4F4FF] border border-[rgba(74,74,252,0.08)]">
        <div className="grid grid-cols-[1fr_1fr_1fr_120px] px-6 py-3 bg-[rgba(74,74,252,0.12)] border-b">
          <span className="text-[17px] font-medium text-[#00306E]">Name</span>
          <span className="text-[17px] font-medium text-[#00306E]">
            Grade Level
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
            paginatedStudents.map((student) => (
              <div
                key={student.id}
                className="grid grid-cols-[1fr_1fr_1fr_120px] items-center px-6 py-4"
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
                      {gradeLevels.map((grade) => (
                        <option key={grade}>{grade}</option>
                      ))}
                    </select>
                    <span>{student.lastAssessment ?? "N/A"}</span>
                    <div className="flex justify-end gap-2">
                      <button
                        disabled={isUpdating}
                        onClick={() => handleSaveEdit(student.id)}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-5 w-5 animate-spin text-[#162DB0]" />
                        ) : (
                          <Check className="h-5 w-5 text-green-600" />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={handleCancelEdit}
                        aria-label="Cancel edit"
                      >
                        <X className="h-5 w-5 text-red-600" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span>{student.name}</span>
                    <span>{student.gradeLevel}</span>
                    <span>{student.lastAssessment ?? "N/A"}</span>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(student)}
                        aria-label="Edit student"
                        title="Edit student"
                      >
                        <Edit2 className="h-5 w-5 text-[#162DB0]" />
                      </button>
                      <button
                        disabled={isDeleting === student.id}
                        onClick={() => handleDelete(student.id)}
                      >
                        {isDeleting === student.id ? (
                          <Loader2 className="h-5 w-5 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="h-5 w-5 text-red-600" />
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            aria-label="Go to first page"
            title="Go to first page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
            aria-label="Go to last page"
            title="Go to last page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

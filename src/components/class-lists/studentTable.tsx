"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  Check,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGradeLevel, setEditGradeLevel] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const studentsPerPage = 5;
  const totalPages = Math.ceil(students.length / studentsPerPage);

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (activeTab === "completed")
      return matchesSearch && student.lastAssessment !== null;
    if (activeTab === "awaiting")
      return matchesSearch && student.lastAssessment === null;
    return matchesSearch;
  });

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

    setIsUpdating(true);
    await onUpdateStudent(studentId, editName.trim(), editGradeLevel);
    setIsUpdating(false);
    setEditingId(null);
  };

  const handleDelete = async (studentId: string) => {
    if (!onDeleteStudent) return;

    setIsDeleting(studentId);
    await onDeleteStudent(studentId);
    setIsDeleting(null);
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Search and Filters Row */}
      <div className="mb-4 flex items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-2 text-[13px] font-bold transition-colors ${
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

        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="flex items-center gap-3 rounded-full px-4 py-2 bg-[#F4FCFD] border border-[rgba(84,164,255,0.38)] w-[350px]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E4F4FF]">
              <Search className="h-4 w-4 text-[#162DB0]" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search Anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[#00306E] placeholder:text-[#00306E]/60 outline-none"
              aria-label="Search students"
            />
          </div>

          {/* Sort By */}
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-[#E4F4FF]"
            aria-label="Sort students"
          >
            <span className="text-base font-medium text-[#03438D]">
              Sort By
            </span>
            <ChevronDown
              className="h-5 w-5 text-[#03438D]"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Total Students Count */}
      <div className="mb-4 text-right">
        <span className="text-[15px] font-bold text-[#162DB0]">
          {totalStudents} Total Students
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden rounded-t-[5px] bg-[#E4F4FF] border border-[rgba(74,74,252,0.08)]">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_1fr_1fr_120px] px-6 py-3 bg-[rgba(74,74,252,0.12)] border-b border-[rgba(74,74,252,0.08)]">
          <span className="text-[17px] font-medium text-[#00306E]">Name</span>
          <span className="text-[17px] font-medium text-[#00306E]">
            Grade Level
          </span>
          <span className="text-[17px] font-medium text-[#00306E]">
            Last Assessment
          </span>
          <span></span>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[rgba(74,74,252,0.88)]">
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
                      id="editName"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mr-2 rounded border border-[#162DB0]/30 px-2 py-1 text-base text-[#00306E] outline-none focus:border-[#162DB0]"
                      aria-label="Edit student name"
                    />
                    <select
                      id="editGradeLevel"
                      value={editGradeLevel}
                      onChange={(e) => setEditGradeLevel(e.target.value)}
                      className="mr-2 rounded border border-[#162DB0]/30 px-2 py-1 text-base text-[#00306E] outline-none focus:border-[#162DB0]"
                      aria-label="Edit grade level"
                    >
                      {gradeLevels.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                    <span className="text-base text-[#00306E]">
                      {student.lastAssessment
                        ? `Last Assessed: ${student.lastAssessment}`
                        : "N/A"}
                    </span>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(student.id)}
                        disabled={isUpdating}
                        className="text-green-600 hover:opacity-70 disabled:opacity-50"
                        aria-label="Save student changes"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isUpdating}
                        className="text-[#DE3B40] hover:opacity-70 disabled:opacity-50"
                        aria-label="Cancel edit"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-base font-medium text-[#00306E]">
                      {student.name}
                    </span>
                    <span className="text-base text-[#00306E]">
                      {student.gradeLevel}
                    </span>
                    <span className="text-base text-[#00306E]">
                      {student.lastAssessment
                        ? `Last Assessed: ${student.lastAssessment}`
                        : "N/A"}
                    </span>
                    <div className="flex items-center justify-end gap-3">
                      {student.lastAssessment ? (
                        <button
                          type="button"
                          className="rounded-lg border border-[#162DB0]/20 bg-white px-4 py-1.5 text-xs font-medium text-[#162DB0] transition-colors hover:bg-[#E4F4FF]"
                          aria-label={`View report for ${student.name}`}
                        >
                          View Report
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEdit(student)}
                            className="text-[#162DB0] hover:opacity-70"
                            aria-label={`Edit ${student.name}`}
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(student.id)}
                            disabled={isDeleting === student.id}
                            className="text-[#DE3B40] hover:opacity-70 disabled:opacity-50"
                            aria-label={`Delete ${student.name}`}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-[#00306E]">
          Page {currentPage} of {totalPages || 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="flex h-8 w-8 items-center justify-center rounded border border-[#162DB0]/20 bg-white text-[#00306E] disabled:opacity-50"
            aria-label="Go to first page"
          >
            <ChevronLeft className="h-4 w-4" />
            <ChevronLeft className="h-4 w-4 -ml-2" />
          </button>
          {Array.from({ length: Math.min(5, totalPages || 1) }, (_, i) => {
            let pageNum: number | string = i + 1;
            if (totalPages > 5) {
              if (i === 3) pageNum = "...";
              else if (i === 4) pageNum = totalPages;
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() =>
                  typeof pageNum === "number" && setCurrentPage(pageNum)
                }
                className={`flex h-8 w-8 items-center justify-center rounded text-sm font-medium ${
                  currentPage === pageNum
                    ? "bg-[#162DB0] text-white"
                    : "border border-[#162DB0]/20 bg-white text-[#00306E]"
                }`}
                disabled={pageNum === "..."}
                aria-label={
                  typeof pageNum === "number"
                    ? `Go to page ${pageNum}`
                    : undefined
                }
              >
                {pageNum}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="flex h-8 w-8 items-center justify-center rounded border border-[#162DB0]/20 bg-white text-[#00306E] disabled:opacity-50"
            aria-label="Go to last page"
          >
            <ChevronRight className="h-4 w-4" />
            <ChevronRight className="h-4 w-4 -ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}

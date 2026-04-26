"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronDown,
  Plus,
  Search,
  X,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { createClass } from "@/app/actions/class/createClass";
import { createStudent } from "@/app/actions/student/createStudent";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAllStudentsByClasses } from "@/lib/hooks/useAllStudentByClass";
import { useQueryClient } from "@tanstack/react-query";

interface OralReadingNavRowProps {
  onGoBack: () => void;
  onContinue: () => void;
  continueEnabled: boolean;
  onClear: () => void;
  studentName: string;
  gradeLevel: string;
  selectedClassName: string;
  hasPassage: boolean;
  continueLabel?: string;
  showContinue?: boolean;
  // Field props — used when !hasPassage
  classes: string[];
  onStudentNameChange: (name: string) => void;
  onGradeLevelChange: (grade: string) => void;
  onClassCreated: (newClass: string) => void;
  onStudentSelected: (studentId: string) => void;
  onClassChange: (className: string) => void;
}

export function OralReadingNavRow({
  onGoBack,
  onContinue,
  continueEnabled,
  onClear,
  studentName,
  gradeLevel,
  selectedClassName,
  hasPassage,
  continueLabel = "Comprehension Test",
  showContinue = true,
  classes,
  onStudentNameChange,
  onGradeLevelChange,
  onClassCreated,
  onStudentSelected,
  onClassChange,
}: OralReadingNavRowProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [selectedClass, setSelectedClass] = useState(selectedClassName ?? "");

  const { data: allStudents, isLoading: isLoadingStudents } =
    useAllStudentsByClasses(classes);

  useEffect(() => {
    setSelectedClass(selectedClassName ?? "");
  }, [selectedClassName]);

  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
  const [isStudentInputFocused, setIsStudentInputFocused] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [createStudentNote, setCreateStudentNote] = useState("");

  const studentInputRef = useRef<HTMLInputElement>(null);
  const studentDropdownRef = useRef<HTMLDivElement>(null);
  const gradeDropdownRef = useRef<HTMLDivElement>(null);
  const gradeButtonRef = useRef<HTMLButtonElement>(null);
  const classDropdownRef = useRef<HTMLDivElement>(null);
  const classButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const clickedGradeArea =
        (gradeDropdownRef.current &&
          gradeDropdownRef.current.contains(target)) ||
        (gradeButtonRef.current && gradeButtonRef.current.contains(target));
      const clickedClassArea =
        (classDropdownRef.current &&
          classDropdownRef.current.contains(target)) ||
        (classButtonRef.current && classButtonRef.current.contains(target));

      if (
        studentDropdownRef.current &&
        !studentDropdownRef.current.contains(target) &&
        studentInputRef.current &&
        !studentInputRef.current.contains(target) &&
        !clickedGradeArea &&
        !clickedClassArea
      ) {
        setIsStudentInputFocused(false);
      }
      if (
        isGradeDropdownOpen &&
        gradeDropdownRef.current &&
        !gradeDropdownRef.current.contains(target) &&
        gradeButtonRef.current &&
        !gradeButtonRef.current.contains(target)
      ) {
        setIsGradeDropdownOpen(false);
      }
      if (
        isClassDropdownOpen &&
        classDropdownRef.current &&
        !classDropdownRef.current.contains(target) &&
        classButtonRef.current &&
        !classButtonRef.current.contains(target)
      ) {
        setIsClassDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isGradeDropdownOpen, isClassDropdownOpen]);

  useEffect(() => {
    setCreateStudentNote("");
  }, [gradeLevel, selectedClass]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const clearAutoFill = () => {
    if (selectedStudentId) {
      onStudentNameChange("");
      setSelectedStudentId("");
      onStudentSelected("");
    }
  };

  const handleClassChange = (value: string) => {
    if (value === "create-new") {
      setIsDialogOpen(true);
      setIsClassDropdownOpen(false);
      return;
    }
    setSelectedClass(value);
    onClassChange(value);
    setIsClassDropdownOpen(false);
    clearAutoFill();
  };

  const handleStudentSelect = (student: {
    id: string;
    name: string;
    level: number;
    className: string;
  }) => {
    setSelectedStudentId(student.id);
    onStudentNameChange(student.name);
    onGradeLevelChange(String(student.level));
    setSelectedClass(student.className);
    onClassChange(student.className);
    onStudentSelected(student.id);
    setIsStudentInputFocused(false);
  };

  const handleStudentNameInput = (value: string) => {
    onStudentNameChange(value);
    setCreateStudentNote("");
    if (selectedStudentId) setSelectedStudentId("");
  };

  const handleCreateClass = async () => {
    const trimmedName = newClassName.trim();
    if (!trimmedName) return;
    setIsCreatingClass(true);
    try {
      const result = await createClass(trimmedName);
      if (result.success) {
        onClassCreated(trimmedName);
        setSelectedClass(trimmedName);
        onClassChange(trimmedName);
        setNewClassName("");
        setIsDialogOpen(false);
        setToast({
          message: `Class "${trimmedName}" created successfully!`,
          type: "success",
        });
      } else {
        setToast({
          message: result.error || "Failed to create class.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Failed to create class:", err);
      setToast({
        message: "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleCreateStudent = async () => {
    const trimmedName = studentName.trim();
    if (!trimmedName) return;
    if (!gradeLevel || !selectedClass) {
      setCreateStudentNote("Select grade and class.");
      return;
    }
    setIsCreatingStudent(true);
    try {
      const result = await createStudent(
        trimmedName,
        Number(gradeLevel),
        selectedClass,
      );
      if (result.success && result.student) {
        setSelectedStudentId(result.student.id);
        onStudentSelected(result.student.id);
        onStudentNameChange(result.student.name);
        setIsStudentInputFocused(false);
        queryClient.invalidateQueries({
          queryKey: ["students", selectedClass],
        });
        setToast({
          message: `Student "${trimmedName}" created successfully!`,
          type: "success",
        });
      } else {
        setToast({
          message: result.error || "Failed to create student.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Failed to create student:", err);
      setToast({
        message: "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setIsCreatingStudent(false);
    }
  };

  const hasFilters = !!selectedClass || !!gradeLevel;
  const searchQuery = studentName.trim().toLowerCase();
  const hasSearchQuery = searchQuery.length >= 1;

  const displayStudents = allStudents.filter((s) => {
    if (!hasFilters && !hasSearchQuery) return false;
    if (hasSearchQuery) {
      if (!s.name.toLowerCase().startsWith(searchQuery)) return false;
      if (selectedClass && s.className !== selectedClass) return false;
      if (gradeLevel && String(s.level) !== gradeLevel) return false;
      return true;
    }
    if (selectedClass && s.className !== selectedClass) return false;
    if (gradeLevel && String(s.level) !== gradeLevel) return false;
    return true;
  });

  const exactMatches = hasSearchQuery
    ? allStudents.filter((s) => s.name.toLowerCase() === searchQuery)
    : [];
  const isExactDuplicate =
    !!gradeLevel &&
    !!selectedClass &&
    exactMatches.some(
      (s) => String(s.level) === gradeLevel && s.className === selectedClass,
    );
  const showCreateStudent =
    hasSearchQuery && !selectedStudentId && !isExactDuplicate;
  const showSuggestions =
    isStudentInputFocused &&
    !isLoadingStudents &&
    (displayStudents.length > 0 || showCreateStudent);

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 flex animate-in slide-in-from-right items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg duration-300 ${
            toast.type === "success"
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0 text-red-500" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Close notification"
            title="Close notification"
            className={`ml-1 rounded-full p-0.5 transition-colors ${
              toast.type === "success"
                ? "hover:bg-green-200"
                : "hover:bg-red-200"
            }`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div
        data-tour-target="assessment-student-setup"
        className="flex items-center gap-3 rounded-2xl border-t border-l border-r-2 border-b-2 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9] border-b-[#6653F9] bg-[#F3F0FF] px-4 py-2.5 shadow-[0px_2px_16px_rgba(108,164,239,0.18)]"
      >
        {/* Back button */}
        <button
          type="button"
          onClick={onGoBack}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-3xl border-t border-l border-r-2 border-b-2 border-t-[#A855F7] border-l-[#A855F7] border-r-[#3B21CC] border-b-[#3B21CC] bg-[#6666FF] text-white transition-colors hover:bg-[#5555EE]"
          aria-label="Go back"
          title="Go back"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {hasPassage ? (
          /* ── PASSAGE SELECTED: compact info + action buttons ── */
          <>
            {/* Compact student info */}
            <div className="flex flex-1 items-center min-w-0">
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#6666FF] truncate flex items-center gap-1">
                  {selectedClassName || "—"}
                  <span className="ml-1">
                    {selectedClassName ? "Class" : ""}
                  </span>
                </span>
                <div className="flex items-center gap-2 mt-0.5 min-w-0">
                  <span className="text-sm font-bold text-[#00306E] truncate">
                    {studentName || "—"}
                  </span>
                  {gradeLevel && (
                    <span className="ml-2 rounded-full bg-[#e8e4fe] px-2 py-0.5 text-xs font-semibold text-[#7C3AED]">
                      Grade {gradeLevel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {showContinue && (
                <button
                  type="button"
                  data-tour-target="assessment-continue-button"
                  onClick={onContinue}
                  disabled={!continueEnabled}
                  className={`flex items-center gap-2 rounded-[20px] border-t border-l border-r-[3px] border-b-[3px] px-4 py-1.5 text-sm font-semibold transition-all ${
                    continueEnabled
                      ? "border-t-[#A855F7] border-l-[#A855F7] border-r-[#3B21CC] border-b-[#3B21CC] bg-[#6666FF] text-white shadow-[0_2px_12px_rgba(102,102,255,0.35)] hover:bg-[#5555EE]"
                      : "cursor-not-allowed border-t-[#A855F7]/30 border-l-[#A855F7]/30 border-r-[#C4C4FF] border-b-[#C4C4FF] bg-white text-[#A5A5D6]"
                  }`}
                >
                  <span>{continueLabel}</span>
                  <span
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                      continueEnabled ? "border-white" : "border-[#C4C4FF]"
                    }`}
                  >
                    {continueEnabled && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                </button>
              )}

              <button
                type="button"
                data-tour-target="assessment-clear-button"
                onClick={onClear}
  className="ml-2 inline-flex items-center gap-1 rounded-full border-t border-l border-r-2 border-b-2 border-t-[#ed1a1a] border-l-[#F87171] border-r-[#F87171] border-b-[#F87171] bg-white px-4 py-1 text-xs font-normal text-[#DC2626] transition-colors hover:bg-[#FEF2F2] hover:border-[#DC2626]"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            </div>
          </>
        ) : (
          /* ── NO PASSAGE: inline input fields with field labels ── */
          <div className="flex flex-1 min-w-0 gap-3">
            {/* Student Name */}
            <div className="flex flex-col flex-1 min-w-0">
              <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-[#0C1A6D]">
                Student Name
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A855F7]" />
                <input
                  ref={studentInputRef}
                  type="text"
                  value={studentName}
                  onChange={(e) => handleStudentNameInput(e.target.value)}
                  onFocus={() => setIsStudentInputFocused(true)}
                  placeholder="Student name"
                  className="w-full rounded-xl border-t border-l border-r-2 border-b-2 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9] border-b-[#6653F9] bg-white pl-9 pr-3 py-1.5 text-xs text-[#00306E] outline-none placeholder:text-[#00306E]/40 transition-all focus:ring-2 focus:ring-[#A855F7]/20"
                />
                {showSuggestions && (
                  <div
                    ref={studentDropdownRef}
                    className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-2xl border-t border-l border-r-4 border-b-4 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9] border-b-[#6653F9] bg-white py-1 shadow-[0px_4px_12px_rgba(84,164,255,0.2)]"
                  >
                    {showCreateStudent && (
                      <div className="border-b border-[#EEEEFF]">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleCreateStudent}
                          disabled={isCreatingStudent}
                          className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-sm font-semibold text-[#6666FF] transition-colors hover:bg-[#E4F4FF] disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {isCreatingStudent
                            ? "Creating..."
                            : `Create "${studentName.trim()}"`}
                        </button>
                        {createStudentNote && (
                          <p className="px-3 pb-1.5 text-xs text-amber-600">
                            {createStudentNote}
                          </p>
                        )}
                      </div>
                    )}
                    {displayStudents.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleStudentSelect(s)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm text-[#00306E] transition-colors hover:bg-[#E4F4FF]"
                      >
                        <span className="truncate font-medium">{s.name}</span>
                        <span className="shrink-0 text-xs text-[#54A4FF]">
                          Grade {s.level} · {s.className}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Grade Level */}
            <div className="flex flex-col w-32 flex-shrink-0">
              <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-[#6666FF]">
                Grade Level
              </span>
              <div className="relative" ref={gradeDropdownRef}>
                <button
                  ref={gradeButtonRef}
                  type="button"
                  onClick={() => {
                    setIsGradeDropdownOpen(!isGradeDropdownOpen);
                    setIsClassDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-1.5 rounded-xl border-t border-l border-r-2 border-b-2 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9] border-b-[#6653F9] px-3 py-1.5 text-xs font-medium transition-all ${
                    gradeLevel
                      ? "bg-purple-50 text-purple-700"
                      : "bg-white text-purple-700 hover:bg-purple-50"
                  }`}
                >
                  <span className="truncate">
                    {gradeLevel ? `Grade ${gradeLevel}` : "Grade"}
                  </span>
                  {gradeLevel ? (
                    <X
                      className="h-3 w-3 shrink-0 cursor-pointer hover:opacity-70"
                      onClick={(e) => {
                        e.stopPropagation();
                        onGradeLevelChange("");
                        clearAutoFill();
                      }}
                    />
                  ) : (
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  )}
                </button>
                {isGradeDropdownOpen && (
                  <div className="absolute left-0 top-full z-20 mt-1.5 max-h-48 w-32 overflow-y-auto rounded-2xl border-t border-l border-r-4 border-b-4 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9] border-b-[#6653F9] bg-white py-1 shadow-[0px_4px_12px_rgba(102,102,255,0.2)]">
                    {Array.from({ length: 10 }, (_, i) => {
                      const grade = String(i + 1);
                      const isActive = gradeLevel === grade;
                      return (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => {
                            if (isActive) {
                              onGradeLevelChange("");
                            } else {
                              onGradeLevelChange(grade);
                            }
                            clearAutoFill();
                            setIsGradeDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-colors hover:bg-[#EEEEFF] ${
                            isActive
                              ? "bg-[#EEEEFF] font-semibold text-[#6666FF]"
                              : "text-[#00306E]"
                          }`}
                        >
                          <span>Grade {grade}</span>
                          {isActive && (
                            <X className="h-3.5 w-3.5 text-[#6666FF]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Class */}
            <div className="flex flex-col w-40 flex-shrink-0">
              <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-[#6666FF]">
                Class
              </span>
              <div className="relative" ref={classDropdownRef}>
                <button
                  ref={classButtonRef}
                  type="button"
                  onClick={() => {
                    setIsClassDropdownOpen(!isClassDropdownOpen);
                    setIsGradeDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-1.5 rounded-xl border-t border-l border-r-2 border-b-2 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9] border-b-[#6653F9] px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedClass
                      ? "bg-purple-50 text-purple-700"
                      : "bg-white text-purple-700 hover:bg-purple-50"
                  }`}
                >
                  <span className="truncate">{selectedClass || "Class"}</span>
                  {selectedClass ? (
                    <X
                      className="h-3 w-3 shrink-0 cursor-pointer hover:opacity-70"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClass("");
                        onClassChange("");
                        clearAutoFill();
                      }}
                    />
                  ) : (
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  )}
                </button>
                {isClassDropdownOpen && (
                  <div className="absolute right-0 top-full z-20 mt-1.5 max-h-48 w-44 overflow-y-auto rounded-lg border border-[#6666FF] bg-white py-1 shadow-[0px_4px_12px_rgba(102,102,255,0.2)]">
                    <button
                      type="button"
                      onClick={() => handleClassChange("create-new")}
                      className="flex w-full items-center gap-1.5 border-b border-[#EEEEFF] px-3 py-1.5 text-left text-sm font-semibold text-[#6666FF] transition-colors hover:bg-[#EEEEFF]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Create New Class
                    </button>
                    {classes.map((cls, idx) => {
                      const isActive = selectedClass === cls;
                      return (
                        <button
                          key={`${cls}-${idx}`}
                          type="button"
                          onClick={() => {
                            if (isActive) {
                              setSelectedClass("");
                              onClassChange("");
                              clearAutoFill();
                              setIsClassDropdownOpen(false);
                            } else {
                              handleClassChange(cls);
                            }
                          }}
                          className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-colors hover:bg-[#EEEEFF] ${
                            isActive
                              ? "bg-[#EEEEFF] font-semibold text-[#6666FF]"
                              : "text-[#00306E]"
                          }`}
                        >
                          <span>{cls}</span>
                          {isActive && (
                            <X className="h-3.5 w-3.5 text-[#6666FF]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Clear button */}
            <div className="flex flex-col justify-end">
              <span className="select-none text-[10px] font-bold uppercase tracking-widest text-transparent">
                &nbsp;
              </span>
          <button
  type="button"
  data-tour-target="assessment-clear-button"
  onClick={onClear}
  className="ml-2 inline-flex items-center gap-1 rounded-full border-t border-l border-r-2 border-b-2 border-t-[#ed1a1a] border-l-[#F87171] border-r-[#F87171] border-b-[#F87171] bg-white px-4 py-1 text-xs font-normal text-[#DC2626] transition-colors hover:bg-[#FEF2F2] hover:border-[#DC2626]"
>
  <X className="h-3 w-3" />
  Clear
</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Class Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
          </DialogHeader>
          <input
            placeholder="Enter class name"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateClass();
            }}
            autoFocus
            className="w-full rounded-lg border border-[#54A4FF] bg-[#EFFDFF] px-3 py-2 text-sm text-[#00306E] shadow-[0px_1px_10px_rgba(108,164,239,0.25)] outline-none placeholder:text-[#00306E]/40"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateClass}
              disabled={!newClassName.trim() || isCreatingClass}
            >
              {isCreatingClass ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

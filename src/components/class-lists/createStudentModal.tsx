"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown } from "lucide-react";

interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStudent: (data: { studentName: string; gradeLevel: string }) => void;
}

const gradeLevels = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
];

export function CreateStudentModal({
  isOpen,
  onClose,
  onCreateStudent,
}: CreateStudentModalProps) {
  const [studentName, setStudentName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (studentName.trim() && gradeLevel) {
        onCreateStudent({ studentName, gradeLevel });
        setStudentName("");
        setGradeLevel("");
        onClose();
      }
    },
    [studentName, gradeLevel, onCreateStudent, onClose],
  );

  const handleSelectGrade = (grade: string) => {
    setGradeLevel(grade);
    setIsDropdownOpen(false);
  };

  // Don't render on server or when closed
  if (typeof window === "undefined" || !isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center z-[99999]">
      {/* Backdrop with blur - covers entire viewport */}
      <div
        ref={backdropRef}
        className="absolute inset-0 animate-in fade-in duration-300 bg-[rgba(0,0,0,0.4)] backdrop-blur-[10px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative animate-in fade-in zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-student-title"
      >
        <div className="w-[500px] bg-white p-8 rounded-[30px] shadow-[0px_10px_60px_rgba(0,48,110,0.25)]">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 text-[#00306E]/50 transition-colors hover:text-[#00306E]"
            aria-label="Close modal"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="mb-8">
            <h2
              id="create-student-title"
              className="text-[28px] font-bold leading-tight text-[#31318A]"
            >
              Create Student
            </h2>
            <p className="mt-1 text-base text-[#00306E]/70">
              Input student information for reading assessment
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Name Field */}
            <div className="flex items-center gap-6">
              <label
                htmlFor="studentName"
                className="w-[120px] shrink-0 text-base font-semibold text-[#00306E]"
              >
                Student Name
              </label>
              <input
                id="studentName"
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="flex-1 rounded-lg border-2 border-[#6666FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none transition-colors focus:border-[#6666FF] shadow-[inset_0px_2px_4px_rgba(0,48,110,0.08)]"
                placeholder=""
              />
            </div>

            {/* Grade Level Field - Dropdown */}
            <div className="flex items-center gap-6">
              <label
                htmlFor="gradeLevel"
                className="w-[120px] shrink-0 text-base font-semibold text-[#00306E]"
              >
                Grade Level
              </label>
              <div ref={dropdownRef} className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex w-full items-center justify-between rounded-lg border-2 border-[#6666FF] bg-white px-4 py-3 text-left text-base text-[#00306E] outline-none transition-colors shadow-[inset_0px_2px_4px_rgba(0,48,110,0.08)]"
                >
                  <span
                    className={
                      gradeLevel ? "text-[#00306E]" : "text-[#00306E]/50"
                    }
                  >
                    {gradeLevel || "Select grade level"}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-[#6666FF] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-lg border border-[#E4F4FF] bg-white py-1 shadow-[0px_4px_20px_rgba(0,48,110,0.15)]">
                    {gradeLevels.map((grade) => (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => handleSelectGrade(grade)}
                        className={`w-full px-4 py-2.5 text-left text-base transition-colors hover:bg-[#E4F4FF] ${
                          gradeLevel === grade
                            ? "bg-[#E4F4FF] font-medium text-[#6666FF]"
                            : "text-[#00306E]"
                        }`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                className="rounded-lg px-10 py-3 text-base font-semibold text-white transition-all hover:opacity-90 bg-[#2E2E68] shadow-[0px_4px_15px_rgba(46,46,104,0.4)]"
              >
                Create Student
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body);
}

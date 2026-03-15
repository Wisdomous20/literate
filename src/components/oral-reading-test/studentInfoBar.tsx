"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, Plus, Search, X, CheckCircle, XCircle } from "lucide-react"
import { createClass } from "@/app/actions/class/createClass"
import { createStudent } from "@/app/actions/student/createStudent"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAllStudentsByClasses } from "@/lib/hooks/useAllStudentByClass"
import { useQueryClient } from "@tanstack/react-query"

interface StudentInfoBarProps {
  studentName: string
  gradeLevel: string
  classes: string[]
  selectedClassName?: string
  onStudentNameChange: (name: string) => void
  onGradeLevelChange: (grade: string) => void
  onClassCreated: (newClass: string) => void
  onStudentSelected: (studentId: string) => void
  onClassChange?: (className: string) => void
  onClear?: () => void
}

export default function StudentInfoBar({
  studentName,
  gradeLevel,
  classes,
  selectedClassName,
  onStudentNameChange,
  onGradeLevelChange,
  onClassCreated,
  onStudentSelected,
  onClassChange,
  onClear,
}: StudentInfoBarProps) {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newClassName, setNewClassName] = useState("")
  const [selectedClass, setSelectedClass] = useState(selectedClassName ?? "")

  // TanStack Query cached student fetch for all classes
  const { data: allStudents, isLoading: isLoadingStudents } = useAllStudentsByClasses(classes)

  // Sync internal state when parent resets selectedClassName (e.g. Start New)
  useEffect(() => {
    setSelectedClass(selectedClassName ?? "")
  }, [selectedClassName])

  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false)
  const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false)
  const [isStudentInputFocused, setIsStudentInputFocused] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [isCreatingClass, setIsCreatingClass] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [isCreatingStudent, setIsCreatingStudent] = useState(false)
  const [createStudentNote, setCreateStudentNote] = useState("")

  const studentInputRef = useRef<HTMLInputElement>(null)
  const studentDropdownRef = useRef<HTMLDivElement>(null)
  const gradeDropdownRef = useRef<HTMLDivElement>(null)
  const gradeButtonRef = useRef<HTMLButtonElement>(null)
  const classDropdownRef = useRef<HTMLDivElement>(null)
  const classButtonRef = useRef<HTMLButtonElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node

      const clickedGradeArea =
        (gradeDropdownRef.current && gradeDropdownRef.current.contains(target)) ||
        (gradeButtonRef.current && gradeButtonRef.current.contains(target))
      const clickedClassArea =
        (classDropdownRef.current && classDropdownRef.current.contains(target)) ||
        (classButtonRef.current && classButtonRef.current.contains(target))

      if (
        studentDropdownRef.current &&
        !studentDropdownRef.current.contains(target) &&
        studentInputRef.current &&
        !studentInputRef.current.contains(target) &&
        !clickedGradeArea &&
        !clickedClassArea
      ) {
        setIsStudentInputFocused(false)
      }

      if (
        isGradeDropdownOpen &&
        gradeDropdownRef.current &&
        !gradeDropdownRef.current.contains(target) &&
        gradeButtonRef.current &&
        !gradeButtonRef.current.contains(target)
      ) {
        setIsGradeDropdownOpen(false)
      }

      if (
        isClassDropdownOpen &&
        classDropdownRef.current &&
        !classDropdownRef.current.contains(target) &&
        classButtonRef.current &&
        !classButtonRef.current.contains(target)
      ) {
        setIsClassDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isGradeDropdownOpen, isClassDropdownOpen])

  const clearAutoFill = () => {
    if (selectedStudentId) {
      onStudentNameChange("")
      setSelectedStudentId("")
      onStudentSelected("")
    }
  }

  const handleClassChange = (value: string) => {
    if (value === "create-new") {
      setIsDialogOpen(true)
      setIsClassDropdownOpen(false)
      return
    }
    setSelectedClass(value)
    onClassChange?.(value)
    setIsClassDropdownOpen(false)
    clearAutoFill()
  }

  const handleStudentSelect = (student: { id: string; name: string; level: number; className: string }) => {
    setSelectedStudentId(student.id)
    onStudentNameChange(student.name)
    onGradeLevelChange(String(student.level))
    setSelectedClass(student.className)
    onClassChange?.(student.className)
    onStudentSelected(student.id)
    setIsStudentInputFocused(false)
  }

  const handleStudentNameInput = (value: string) => {
    onStudentNameChange(value)
    setCreateStudentNote("")
    if (selectedStudentId) {
      setSelectedStudentId("")
    }
  }

  // Clear the note when grade or class changes
  useEffect(() => {
    setCreateStudentNote("")
  }, [gradeLevel, selectedClass])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleCreateClass = async () => {
    const trimmedName = newClassName.trim()
    if (!trimmedName) return

    setIsCreatingClass(true)
    try {
      const result = await createClass(trimmedName)
      if (result.success) {
        onClassCreated(trimmedName)
        setSelectedClass(trimmedName)
        onClassChange?.(trimmedName)
        setNewClassName("")
        setIsDialogOpen(false)
        setToast({ message: `Class "${trimmedName}" created successfully!`, type: "success" })
      } else {
        setToast({ message: result.error || "Failed to create class.", type: "error" })
      }
    } catch (err) {
      console.error("Failed to create class:", err)
      setToast({ message: "Something went wrong. Please try again.", type: "error" })
    } finally {
      setIsCreatingClass(false)
    }
  }

  const hasFilters = !!selectedClass || !!gradeLevel
  const searchQuery = studentName.trim().toLowerCase()
  const hasSearchQuery = searchQuery.length >= 1

  const displayStudents = allStudents.filter((s) => {
    if (!hasFilters && !hasSearchQuery) return false
    if (hasSearchQuery) {
      if (!s.name.toLowerCase().startsWith(searchQuery)) return false
      if (selectedClass && s.className !== selectedClass) return false
      if (gradeLevel && String(s.level) !== gradeLevel) return false
      return true
    }
    if (selectedClass && s.className !== selectedClass) return false
    if (gradeLevel && String(s.level) !== gradeLevel) return false
    return true
  })

  const exactMatches = hasSearchQuery
    ? allStudents.filter((s) => s.name.toLowerCase() === searchQuery)
    : []
  const isExactDuplicate =
    !!gradeLevel &&
    !!selectedClass &&
    exactMatches.some(
      (s) => String(s.level) === gradeLevel && s.className === selectedClass
    )
  const showCreateStudent =
    hasSearchQuery && !selectedStudentId && !isExactDuplicate

  const handleCreateStudent = async () => {
    const trimmedName = studentName.trim()
    if (!trimmedName) return
    if (!gradeLevel || !selectedClass) {
      setCreateStudentNote("Select grade and class.")
      return
    }

    setIsCreatingStudent(true)
    try {
      const result = await createStudent(trimmedName, Number(gradeLevel), selectedClass)
      if (result.success && result.student) {
        setSelectedStudentId(result.student.id)
        onStudentSelected(result.student.id)
        onStudentNameChange(result.student.name)
        setIsStudentInputFocused(false)
        // Invalidate TanStack cache so new student appears on next fetch
        queryClient.invalidateQueries({ queryKey: ["students", selectedClass] })
        setToast({ message: `Student "${trimmedName}" created successfully!`, type: "success" })
      } else {
        setToast({ message: result.error || "Failed to create student.", type: "error" })
      }
    } catch (err) {
      console.error("Failed to create student:", err)
      setToast({ message: "Something went wrong. Please try again.", type: "error" })
    } finally {
      setIsCreatingStudent(false)
    }
  }

  const showSuggestions =
    isStudentInputFocused &&
    !isLoadingStudents &&
    (displayStudents.length > 0 || showCreateStudent)

  return (
    <>
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
              toast.type === "success" ? "hover:bg-green-200" : "hover:bg-red-200"
            }`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-[1fr_160px_180px_auto] items-start gap-3">
        <div className="relative rounded-lg bg-[rgba(108,164,239,0.09)] px-3 py-2">
          <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-[#0C1A6D]">
            STUDENT NAME
          </label>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6666FF]" />
            <input
              ref={studentInputRef}
              type="text"
              value={studentName}
              onChange={(e) => handleStudentNameInput(e.target.value)}
              onFocus={() => setIsStudentInputFocused(true)}
              placeholder="Search or type student name"
              className="w-full rounded-lg border border-[#54A4FF] bg-[#EFFDFF] py-1.5 pl-8 pr-3 text-sm text-[#00306E] shadow-[0px_1px_10px_rgba(108,164,239,0.25)] outline-none placeholder:text-[#00306E]/40"
            />
          </div>

          {showSuggestions && (
            <div
              ref={studentDropdownRef}
              className="absolute left-3 right-3 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[#54A4FF] bg-white py-1 shadow-[0px_4px_12px_rgba(84,164,255,0.2)]"
            >
              {showCreateStudent && (
                <div className="border-b border-[#EEEEFF]">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleCreateStudent}
                    disabled={isCreatingStudent}
                    className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-sm font-semibold text-[#6666FF] hover:bg-[#E4F4FF] disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {isCreatingStudent ? "Creating..." : `Create Student "${studentName.trim()}"`}
                  </button>
                  {createStudentNote && (
                    <p className="px-3 pb-1.5 text-xs text-amber-600">{createStudentNote}</p>
                  )}
                </div>
              )}
              {displayStudents.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleStudentSelect(s)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm text-[#00306E] hover:bg-[#E4F4FF]"
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

        <div className="flex flex-col gap-1 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#6666FF]">
            Grade Level
          </span>
          <div className="relative" ref={gradeDropdownRef}>
            <button
              ref={gradeButtonRef}
              type="button"
              onClick={() => {
                setIsGradeDropdownOpen(!isGradeDropdownOpen)
                setIsClassDropdownOpen(false)
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                gradeLevel
                  ? "border-[#6666FF] bg-[#6666FF] text-white shadow-sm"
                  : "border-dashed border-[#6666FF]/60 bg-transparent text-[#00306E] hover:border-[#6666FF] hover:bg-[#EEEEFF]"
              }`}
            >
              <span className="truncate">{gradeLevel ? `Grade ${gradeLevel}` : "Select"}</span>
              {gradeLevel ? (
                <X
                  className="h-3 w-3 shrink-0 cursor-pointer hover:opacity-70"
                  onClick={(e) => {
                    e.stopPropagation()
                    onGradeLevelChange("")
                    clearAutoFill()
                  }}
                />
              ) : (
                <ChevronDown className="h-3 w-3 shrink-0" />
              )}
            </button>

            {isGradeDropdownOpen && (
              <div className="absolute left-0 top-full z-10 mt-1.5 max-h-48 w-36 overflow-y-auto rounded-lg border border-[#6666FF] bg-white py-1 shadow-[0px_4px_12px_rgba(102,102,255,0.2)]">
                {Array.from({ length: 10 }, (_, i) => {
                  const grade = String(i + 1)
                  const isActive = gradeLevel === grade
                  return (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => {
                        if (isActive) {
                          onGradeLevelChange("")
                        } else {
                          onGradeLevelChange(grade)
                        }
                        clearAutoFill()
                        setIsGradeDropdownOpen(false)
                      }}
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-[#EEEEFF] ${
                        isActive ? "bg-[#EEEEFF] font-semibold text-[#6666FF]" : "text-[#00306E]"
                      }`}
                    >
                      <span>Grade {grade}</span>
                      {isActive && <X className="h-3.5 w-3.5 text-[#6666FF]" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#6666FF]">
            Class
          </span>
          <div className="relative" ref={classDropdownRef}>
              <button
                ref={classButtonRef}
                type="button"
                onClick={() => {
                  setIsClassDropdownOpen(!isClassDropdownOpen)
                  setIsGradeDropdownOpen(false)
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                  selectedClass
                    ? "border-[#6666FF] bg-[#6666FF] text-white shadow-sm"
                    : "border-dashed border-[#6666FF]/60 bg-transparent text-[#00306E] hover:border-[#6666FF] hover:bg-[#EEEEFF]"
                }`}
              >
                <span className="truncate">{selectedClass || "Select"}</span>
                {selectedClass ? (
                  <X
                    className="h-3 w-3 shrink-0 cursor-pointer hover:opacity-70"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedClass("")
                      onClassChange?.("")
                      clearAutoFill()
                    }}
                  />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              {isClassDropdownOpen && (
                <div className="absolute right-0 top-full z-10 mt-1.5 max-h-48 w-44 overflow-y-auto rounded-lg border border-[#6666FF] bg-white py-1 shadow-[0px_4px_12px_rgba(102,102,255,0.2)]">
                  <button
                    type="button"
                    onClick={() => handleClassChange("create-new")}
                    className="flex w-full items-center gap-1.5 border-b border-[#EEEEFF] px-3 py-1.5 text-left text-sm font-semibold text-[#6666FF] hover:bg-[#EEEEFF]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create New Class
                  </button>

                  {classes.map((cls, idx) => {
                    const isActive = selectedClass === cls
                    return (
                      <button
                        key={`${cls}-${idx}`}
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            setSelectedClass("")
                            onClassChange?.("")
                            clearAutoFill()
                            setIsClassDropdownOpen(false)
                          } else {
                            handleClassChange(cls)
                          }
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-[#EEEEFF] ${
                          isActive ? "bg-[#EEEEFF] font-semibold text-[#6666FF]" : "text-[#00306E]"
                        }`}
                      >
                        <span>{cls}</span>
                        {isActive && <X className="h-3.5 w-3.5 text-[#6666FF]" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        {onClear && (
          <div className="flex flex-col gap-1 pt-2">
            <span className="select-none text-[10px] font-bold uppercase tracking-widest text-transparent">
              &nbsp;
            </span>
            <button
              type="button"
              onClick={onClear}
              className="rounded-full border border-dashed border-[#6666FF]/60 px-8 py-1.5 text-xs font-medium text-[#6666FF] transition-all hover:border-[#6666FF] hover:bg-[#EEEEFF]"
            >
              Clear
            </button>
          </div>
        )}
      </div>

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
              if (e.key === "Enter") handleCreateClass()
            }}
            autoFocus
            className="w-full rounded-lg border border-[#54A4FF] bg-[#EFFDFF] px-3 py-2 text-sm text-[#00306E] shadow-[0px_1px_10px_rgba(108,164,239,0.25)] outline-none placeholder:text-[#00306E]/40"
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateClass} disabled={!newClassName.trim() || isCreatingClass}>
              {isCreatingClass ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
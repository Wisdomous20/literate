"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { ChevronDown, Plus, Search, X, CheckCircle, XCircle } from "lucide-react"
import { createClass } from "@/app/actions/class/createClass"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getStudentsByClassName } from "@/app/actions/student/getAllStudentByClass"

interface StudentOption {
  id: string
  name: string
  level: number
  className: string
}

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
}: StudentInfoBarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newClassName, setNewClassName] = useState("")
  const [selectedClass, setSelectedClass] = useState(selectedClassName ?? "")
  const [allStudents, setAllStudents] = useState<StudentOption[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)

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
  const studentInputRef = useRef<HTMLInputElement>(null)
  const studentDropdownRef = useRef<HTMLDivElement>(null)
  const gradeDropdownRef = useRef<HTMLDivElement>(null)
  const gradeButtonRef = useRef<HTMLButtonElement>(null)
  const classDropdownRef = useRef<HTMLDivElement>(null)
  const classButtonRef = useRef<HTMLButtonElement>(null)
  const fetchedClassesRef = useRef<string>("")

  // Fetch students from ALL classes — skip if classes haven't changed
  const fetchAllStudents = useCallback(async () => {
    if (classes.length === 0) {
      setAllStudents([])
      fetchedClassesRef.current = ""
      return
    }

    // Skip re-fetch if the same classes
    const classesKey = classes.slice().sort().join("|")
    if (classesKey === fetchedClassesRef.current) return
    fetchedClassesRef.current = classesKey

    setIsLoadingStudents(true)
    try {
      const results = await Promise.all(
        classes.map(async (cls) => {
          const result = await getStudentsByClassName(cls)
          if (result.success && "students" in result && result.students) {
            return result.students.map((s) => ({
              id: s.id,
              name: s.name,
              level: s.level ?? 0,
              className: cls,
            }))
          }
          return []
        })
      )
      const all = results.flat()
      setAllStudents(all)
    } catch (error) {
      console.error("Failed to fetch students:", error)
      setAllStudents([])
    } finally {
      setIsLoadingStudents(false)
    }
  }, [classes])

  useEffect(() => {
    fetchAllStudents()
  }, [fetchAllStudents])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node

      // Close student suggestions
      if (
        studentDropdownRef.current &&
        !studentDropdownRef.current.contains(target) &&
        studentInputRef.current &&
        !studentInputRef.current.contains(target)
      ) {
        setIsStudentInputFocused(false)
      }

      // Close grade dropdown
      if (
        isGradeDropdownOpen &&
        gradeDropdownRef.current &&
        !gradeDropdownRef.current.contains(target) &&
        gradeButtonRef.current &&
        !gradeButtonRef.current.contains(target)
      ) {
        setIsGradeDropdownOpen(false)
      }

      // Close class dropdown
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

  // Clear auto-filled student when filters change
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


  const handleStudentSelect = (student: StudentOption) => {
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
    if (selectedStudentId) {
      setSelectedStudentId("")
    }
  }

  // Auto-dismiss toast after 4 seconds
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
    } catch {
      setToast({ message: "Something went wrong. Please try again.", type: "error" })
    } finally {
      setIsCreatingClass(false)
    }
  }

  const hasFilters = !!selectedClass || !!gradeLevel
  const searchQuery = studentName.trim().toLowerCase()
  const hasSearchQuery = searchQuery.length >= 1

  // Filter students based on filters and search
  const displayStudents = allStudents.filter((s) => {
    // Apply class filter if set
    if (selectedClass && s.className !== selectedClass) return false
    // Apply grade filter if set
    if (gradeLevel && String(s.level) !== gradeLevel) return false

    // If no filters and no search query → show nothing
    if (!hasFilters && !hasSearchQuery) return false

    // If search query is typed, further narrow by name match (starts with)
    if (hasSearchQuery) {
      return s.name.toLowerCase().startsWith(searchQuery)
    }

    // Filters are set but no search query → show all under filter
    return true
  })

  const showSuggestions =
    isStudentInputFocused &&
    !isLoadingStudents &&
    displayStudents.length > 0

  return (
    <>
      {/* Toast notification — fixed upper right */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg animate-in slide-in-from-right duration-300 ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className={`ml-1 rounded-full p-0.5 transition-colors ${
              toast.type === "success" ? "hover:bg-green-200" : "hover:bg-red-200"
            }`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* 1) Student Name — Left (Search Input) */}
        <div
          className="relative rounded-lg px-3 py-2"
          style={{ background: "rgba(108, 164, 239, 0.09)" }}
        >
          <label
            className="mb-0.5 block text-xs font-semibold"
            style={{ color: "#0C1A6D" }}
          >
            Student Name
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#54A4FF]" />
            <input
              ref={studentInputRef}
              type="text"
              value={studentName}
              onChange={(e) => handleStudentNameInput(e.target.value)}
              onFocus={() => setIsStudentInputFocused(true)}
              placeholder="Search student name"
              className="w-full rounded-lg py-1.5 pl-8 pr-3 text-sm text-[#00306E] outline-none placeholder:text-[#00306E]/40"
              style={{
                background: "#EFFDFF",
                border: "1px solid #54A4FF",
                boxShadow: "0px 1px 10px rgba(108, 164, 239, 0.25)",
              }}
            />
          </div>

          {/* Student search suggestions */}
          {showSuggestions && (
            <div
              ref={studentDropdownRef}
              className="absolute left-3 right-3 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg bg-white py-1"
              style={{
                border: "1px solid #54A4FF",
                boxShadow: "0px 4px 12px rgba(84, 164, 255, 0.2)",
              }}
            >
              {displayStudents.map((s) => (
                <button
                  key={s.id}
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

        {/* 2) Grade Level — Middle (Dropdown Grade 1–10, also a filter) */}
        <div
          className="relative rounded-lg px-3 py-2"
          style={{ background: "rgba(108, 164, 239, 0.09)" }}
        >
          <label
            className="mb-0.5 block text-xs font-semibold"
            style={{ color: "#0C1A6D" }}
          >
            Grade Level
          </label>
          <button
            ref={gradeButtonRef}
            onClick={() => setIsGradeDropdownOpen(!isGradeDropdownOpen)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm text-[#00306E]"
            style={{
              background: "#EFFDFF",
              border: "1px solid #54A4FF",
              boxShadow: "0px 1px 10px rgba(108, 164, 239, 0.25)",
            }}
          >
            <span>{gradeLevel ? `Grade ${gradeLevel}` : "Select grade"}</span>
            <ChevronDown className="h-4 w-4 text-[#54A4FF]" />
          </button>

          {isGradeDropdownOpen && (
            <div
              ref={gradeDropdownRef}
              className="absolute left-3 right-3 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg bg-white py-1"
              style={{
                border: "1px solid #54A4FF",
                boxShadow: "0px 4px 12px rgba(84, 164, 255, 0.2)",
              }}
            >
              {Array.from({ length: 10 }, (_, i) => {
                const isActive = gradeLevel === String(i + 1)
                return (
                  <button
                    key={i + 1}
                    onClick={() => {
                      if (isActive) {
                        onGradeLevelChange("")
                      } else {
                        onGradeLevelChange(String(i + 1))
                      }
                      clearAutoFill()
                      setIsGradeDropdownOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-[#00306E] hover:bg-[#E4F4FF] ${
                      isActive ? "bg-[#E4F4FF] font-semibold" : ""
                    }`}
                  >
                    <span>Grade {i + 1}</span>
                    {isActive && <X className="h-3.5 w-3.5 text-[#54A4FF]" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 3) Class Name — Right (also a filter) */}
        <div
          className="relative rounded-lg px-3 py-2"
          style={{ background: "rgba(108, 164, 239, 0.09)" }}
        >
          <label
            className="mb-0.5 block text-xs font-semibold"
            style={{ color: "#0C1A6D" }}
          >
            Class
          </label>
          <button
            ref={classButtonRef}
            onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm text-[#00306E]"
            style={{
              background: "#EFFDFF",
              border: "1px solid #54A4FF",
              boxShadow: "0px 1px 10px rgba(108, 164, 239, 0.25)",
            }}
          >
            <span>{selectedClass || "Select class"}</span>
            <ChevronDown className="h-4 w-4 text-[#54A4FF]" />
          </button>

          {isClassDropdownOpen && (
            <div
              ref={classDropdownRef}
              className="absolute left-3 right-3 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg bg-white py-1"
              style={{
                border: "1px solid #54A4FF",
                boxShadow: "0px 4px 12px rgba(84, 164, 255, 0.2)",
              }}
            >
              <button
                onClick={() => handleClassChange("create-new")}
                className="flex w-full items-center gap-1 px-3 py-1.5 text-left text-sm text-[#54A4FF] hover:bg-[#E4F4FF]"
              >
                <Plus className="h-4 w-4" />
                Create New Class
              </button>
              {classes.map((cls, idx) => {
                const isActive = selectedClass === cls
                return (
                  <button
                    key={`${cls}-${idx}`}
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
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-[#00306E] hover:bg-[#E4F4FF] ${
                      isActive ? "bg-[#E4F4FF] font-semibold" : ""
                    }`}
                  >
                    <span>{cls}</span>
                    {isActive && <X className="h-3.5 w-3.5 text-[#54A4FF]" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
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
              if (e.key === "Enter") handleCreateClass()
            }}
            autoFocus
            className="w-full rounded-lg px-3 py-2 text-sm text-[#00306E] outline-none placeholder:text-[#00306E]/40"
            style={{
              background: "#EFFDFF",
              border: "1px solid #54A4FF",
              boxShadow: "0px 1px 10px rgba(108, 164, 239, 0.25)",
            }}
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
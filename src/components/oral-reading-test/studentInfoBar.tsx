"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { ChevronDown, Plus, Search, X } from "lucide-react"
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
  onStudentNameChange: (name: string) => void
  onGradeLevelChange: (grade: string) => void
  onClassCreated: (newClass: string) => void
  onStudentSelected: (studentId: string) => void
}

export default function StudentInfoBar({
  studentName,
  gradeLevel,
  classes,
  onStudentNameChange,
  onGradeLevelChange,
  onClassCreated,
  onStudentSelected,
}: StudentInfoBarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newClassName, setNewClassName] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [allStudents, setAllStudents] = useState<StudentOption[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false)
  const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false)
  const [isStudentInputFocused, setIsStudentInputFocused] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const studentInputRef = useRef<HTMLInputElement>(null)
  const studentDropdownRef = useRef<HTMLDivElement>(null)
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

  // Close student suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        studentDropdownRef.current &&
        !studentDropdownRef.current.contains(e.target as Node) &&
        studentInputRef.current &&
        !studentInputRef.current.contains(e.target as Node)
      ) {
        setIsStudentInputFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleClassChange = (value: string) => {
    if (value === "create-new") {
      setIsDialogOpen(true)
      setIsClassDropdownOpen(false)
      return
    }
    setSelectedClass(value)
    setIsClassDropdownOpen(false)
  }


  const handleStudentSelect = (student: StudentOption) => {
    setSelectedStudentId(student.id)
    onStudentNameChange(student.name)
    onGradeLevelChange(String(student.level))
    setSelectedClass(student.className)
    onStudentSelected(student.id)
    setIsStudentInputFocused(false)
  }

  const handleStudentNameInput = (value: string) => {
    onStudentNameChange(value)
    if (selectedStudentId) {
      setSelectedStudentId("")
    }
  }

  const handleCreateClass = () => {
    if (newClassName.trim()) {
      onClassCreated(newClassName.trim())
      setSelectedClass(newClassName.trim())
      setNewClassName("")
      setIsDialogOpen(false)
    }
  }

  const hasFilters = !!selectedClass || !!gradeLevel
  const searchQuery = studentName.trim().toLowerCase()
  const hasSearchQuery = searchQuery.length >= 3

  // Filter students based on filters and search
  const displayStudents = allStudents.filter((s) => {
    // Apply class filter if set
    if (selectedClass && s.className !== selectedClass) return false
    // Apply grade filter if set
    if (gradeLevel && String(s.level) !== gradeLevel) return false

    // If no filters and no search query (or < 3 chars) → show nothing
    if (!hasFilters && !hasSearchQuery) return false

    // If search query is typed, further narrow by name match
    if (hasSearchQuery) {
      return s.name.toLowerCase().includes(searchQuery)
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
              className="absolute left-3 right-3 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg bg-white py-1"
              style={{
                border: "1px solid #54A4FF",
                boxShadow: "0px 4px 12px rgba(84, 164, 255, 0.2)",
              }}
            >
              {classes.map((cls, idx) => {
                const isActive = selectedClass === cls
                return (
                  <button
                    key={`${cls}-${idx}`}
                    onClick={() => {
                      if (isActive) {
                        setSelectedClass("")
                      } else {
                        handleClassChange(cls)
                      }
                      setIsClassDropdownOpen(false)
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
              <button
                onClick={() => handleClassChange("create-new")}
                className="flex w-full items-center gap-1 px-3 py-1.5 text-left text-sm text-[#54A4FF] hover:bg-[#E4F4FF]"
              >
                <Plus className="h-4 w-4" />
                Create New Class
              </button>
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
            <Button onClick={handleCreateClass} disabled={!newClassName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
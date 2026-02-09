"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getStudentsByClassName } from "@/app/actions/student/getAllStudentByClass"
import { createStudent } from "@/app/actions/student/createStudent"

interface StudentOption {
  id: string
  name: string
  level: number
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
  const [students, setStudents] = useState<StudentOption[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [isCreatingStudent, setIsCreatingStudent] = useState(false)

  // Fetch students when class changes
  const fetchStudents = useCallback(async (className: string) => {
    if (!className || className === "create-new") {
      setStudents([])
      return
    }

    setIsLoadingStudents(true)
    try {
      const result = await getStudentsByClassName(className)
      if (result.success && "students" in result) {
        setStudents(result.students)
      } else {
        setStudents([])
      }
    } catch (error) {
      console.error("Failed to fetch students:", error)
      setStudents([])
    } finally {
      setIsLoadingStudents(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedClass || selectedClass === "create-new") {
      setStudents([])
      setSelectedStudentId("")
      return
    }

    fetchStudents(selectedClass)
  }, [selectedClass, fetchStudents])

  const handleClassChange = (value: string) => {
    if (value === "create-new") {
      setIsDialogOpen(true)
      return
    }
    setSelectedClass(value)
    // Reset student selection when class changes
    setSelectedStudentId("")
    onStudentNameChange("")
    onGradeLevelChange("")
  }

  const handleStudentSelect = (studentId: string) => {
    if (studentId === "create-new") {
      setSelectedStudentId("create-new")
      onStudentNameChange("")
      onGradeLevelChange("")
      return
    }

    const student = students.find((s) => s.id === studentId)
    if (student) {
      setSelectedStudentId(studentId)
      onStudentNameChange(student.name)
      onGradeLevelChange(String(student.level))
      onStudentSelected(student.id)
    }
  }

  const handleCreateNewStudent = async () => {
    if (!studentName.trim() || !gradeLevel || !selectedClass || isCreatingStudent) return

    const parsedLevel = parseInt(gradeLevel, 10)
    if (isNaN(parsedLevel) || parsedLevel < 1 || parsedLevel > 12) {
      console.error("Invalid grade level:", gradeLevel)
      return
    }

    setIsCreatingStudent(true)
    try {
      const result = await createStudent(
        studentName.trim(),
        parsedLevel,
        selectedClass
      )

      if (result.success && result.student) {
        onStudentSelected(result.student.id)
        setSelectedStudentId(result.student.id)
        // Refresh student list so the new student appears in the dropdown
        await fetchStudents(selectedClass)
      } else {
        console.error("Failed to create student:", result.error)
      }
    } catch (error) {
      console.error("Failed to create student:", error)
    } finally {
      setIsCreatingStudent(false)
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

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 p-4 bg-white rounded-lg shadow-sm border">
        {/* Class */}
        <div className="w-full sm:w-48">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Class
          </label>
          <Select value={selectedClass} onValueChange={handleClassChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  {cls}
                </SelectItem>
              ))}
              <SelectItem value="create-new">
                <span className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  Create New Class
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Student Selection */}
        <div className="w-full sm:w-52">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Student
          </label>
          <Select
            value={selectedStudentId}
            onValueChange={handleStudentSelect}
            disabled={!selectedClass || isLoadingStudents}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingStudents
                    ? "Loading..."
                    : selectedClass
                      ? "Select student"
                      : "Select class first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} (Grade {s.level})
                </SelectItem>
              ))}
              <SelectItem value="create-new">
                <span className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  Add New Student
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Student Name & Grade — shown only when creating new student */}
        {selectedStudentId === "create-new" && (
          <>
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Student Name
              </label>
              <Input
                placeholder="Enter student name"
                value={studentName}
                onChange={(e) => onStudentNameChange(e.target.value)}
                disabled={isCreatingStudent}
              />
            </div>

            {/* Grade Level */}
            <div className="w-full sm:w-40">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Grade Level
              </label>
              <Select
                value={gradeLevel}
                onValueChange={onGradeLevelChange}
                disabled={isCreatingStudent}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      Grade {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Save student button */}
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-500 mb-1 invisible">
                Action
              </label>
              <Button
                onClick={handleCreateNewStudent}
                disabled={
                  !studentName.trim() ||
                  !gradeLevel ||
                  !selectedClass ||
                  isCreatingStudent
                }
              >
                {isCreatingStudent ? "Adding..." : "Add Student"}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Create Class Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Enter class name"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateClass()
            }}
            autoFocus
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
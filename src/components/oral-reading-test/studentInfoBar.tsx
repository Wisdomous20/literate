"use client"

import React, { useState } from "react"
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

  const handleClassChange = async (value: string) => {
    if (value === "create-new") {
      setIsDialogOpen(true)
      return
    }
    setSelectedClass(value)

    // Look up/create student when class is selected and name + grade exist
    if (studentName.trim() && gradeLevel && value) {
      try {
        const response = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: studentName.trim(),
            gradeLevel,
            className: value,
          }),
        })
        if (response.ok) {
          const data = await response.json()
          onStudentSelected(data.id)
        }
      } catch (error) {
        console.error("Failed to look up/create student:", error)
      }
    }
  }

  const handleStudentNameChange = async (name: string) => {
    onStudentNameChange(name)

    // Look up/create student when all fields are filled
    if (name.trim() && gradeLevel && selectedClass) {
      try {
        const response = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            gradeLevel,
            className: selectedClass,
          }),
        })
        if (response.ok) {
          const data = await response.json()
          onStudentSelected(data.id)
        }
      } catch (error) {
        console.error("Failed to look up/create student:", error)
      }
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
        {/* Student Name */}
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Student Name
          </label>
          <Input
            placeholder="Enter student name"
            value={studentName}
            onChange={(e) => handleStudentNameChange(e.target.value)}
          />
        </div>

        {/* Grade Level */}
        <div className="w-full sm:w-40">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Grade Level
          </label>
          <Select value={gradeLevel} onValueChange={onGradeLevelChange}>
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
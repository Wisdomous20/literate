"use client"

import { useState } from "react"
import { ChevronDown, Plus, X } from "lucide-react"
import { createClass } from "@/app/actions/class/createClass"

interface StudentInfoBarProps {
  studentName: string
  gradeLevel: string
  classes: string[]
  onStudentNameChange?: (name: string) => void
  onGradeLevelChange?: (level: string) => void
  onClassCreated?: (newClass: string) => void
}

export function StudentInfoBar({
  studentName,
  gradeLevel,
  classes,
  onStudentNameChange,
  onGradeLevelChange,
  onClassCreated,
}: StudentInfoBarProps) {
  const [selectedClass, setSelectedClass] = useState(classes[0] || "")
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false)
  const [isCreatingClass, setIsCreatingClass] = useState(false)
  const [newClassName, setNewClassName] = useState("")
  const [isCreatingLoading, setIsCreatingLoading] = useState(false)
  const [creationError, setCreationError] = useState("")

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      setCreationError("Class name cannot be empty")
      return
    }

    setIsCreatingLoading(true)
    setCreationError("")

    try {
      const result = await createClass(newClassName.trim())

      if (result.success) {
        // Set the newly created class as selected
        setSelectedClass(newClassName.trim())
        setNewClassName("")
        setIsCreatingClass(false)
        setIsClassDropdownOpen(false)

        // Notify parent component if callback is provided
        onClassCreated?.(newClassName.trim())
      } else {
        setCreationError(result.error || "Failed to create class")
      }
    } catch (error) {
      setCreationError("An error occurred while creating the class")
    } finally {
      setIsCreatingLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Student Name - Editable Input */}
      <div
        className="rounded-lg px-3 py-2"
        style={{ background: "rgba(108, 164, 239, 0.09)" }}
      >
        <label
          htmlFor="studentName"
          className="mb-0.5 block text-xs font-semibold"
          style={{ color: "#0C1A6D" }}
        >
          Student Name
        </label>
        <input
          id="studentName"
          type="text"
          value={studentName}
          onChange={(e) => onStudentNameChange?.(e.target.value)}
          placeholder="Enter name"
          className="w-full rounded-lg px-3 py-1.5 text-sm text-[#00306E] outline-none placeholder:text-[#00306E]/40"
          style={{
            background: "#EFFDFF",
            border: "1px solid #54A4FF",
            boxShadow: "0px 1px 10px rgba(108, 164, 239, 0.25)",
          }}
        />
      </div>

      {/* Grade Level - Editable Input */}
      <div
        className="rounded-lg px-3 py-2"
        style={{ background: "rgba(108, 164, 239, 0.09)" }}
      >
        <label
          htmlFor="gradeLevel"
          className="mb-0.5 block text-xs font-semibold"
          style={{ color: "#0C1A6D" }}
        >
          Grade Level
        </label>
        <input
          id="gradeLevel"
          type="text"
          value={gradeLevel}
          onChange={(e) => onGradeLevelChange?.(e.target.value)}
          placeholder="Enter grade level"
          className="w-full rounded-lg px-3 py-1.5 text-sm text-[#00306E] outline-none placeholder:text-[#00306E]/40"
          style={{
            background: "#EFFDFF",
            border: "1px solid #54A4FF",
            boxShadow: "0px 1px 10px rgba(108, 164, 239, 0.25)",
          }}
        />
      </div>

      {/* Class Name - Dropdown with Manual Input */}
      <div
        className="relative rounded-lg px-3 py-2"
        style={{ background: "rgba(108, 164, 239, 0.09)" }}
      >
        <label
          className="mb-0.5 block text-xs font-semibold"
          style={{ color: "#0C1A6D" }}
        >
          Class Name
        </label>
        {!isCreatingClass ? (
          <>
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
                {classes.length > 0 ? (
                  <>
                    {classes.map((cls, idx) => (
                      <button
                        key={`${cls}-${idx}`}
                        onClick={() => {
                          setSelectedClass(cls)
                          setIsClassDropdownOpen(false)
                        }}
                        className="w-full px-3 py-1.5 text-left text-sm text-[#00306E] hover:bg-[#E4F4FF]"
                      >
                        {cls}
                      </button>
                    ))}
                    <div className="border-t border-[#E4F4FF]" />
                  </>
                ) : null}

                {/* Create New Class Option */}
                <button
                  onClick={() => {
                    setIsCreatingClass(true)
                    setIsClassDropdownOpen(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-[#6666FF] hover:bg-[#E4F4FF]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create new class</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Input for new class name */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newClassName}
                onChange={(e) => {
                  setNewClassName(e.target.value)
                  setCreationError("")
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleCreateClass()
                  }
                }}
                placeholder="Enter class name"
                autoFocus
                disabled={isCreatingLoading}
                className="flex-1 rounded-lg px-3 py-1.5 text-sm text-[#00306E] outline-none placeholder:text-[#00306E]/40 disabled:opacity-50"
                style={{
                  background: "#EFFDFF",
                  border: "1px solid #54A4FF",
                  boxShadow: "0px 1px 10px rgba(108, 164, 239, 0.25)",
                }}
              />
              <button
                onClick={handleCreateClass}
                disabled={isCreatingLoading || !newClassName.trim()}
                className="rounded-lg px-3 py-1.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "#6666FF" }}
              >
                {isCreatingLoading ? "..." : "Add"}
              </button>
            </div>

            {/* Error message */}
            {creationError && (
              <div className="mt-1 text-xs text-red-500">{creationError}</div>
            )}

            {/* Cancel button */}
            <button
              onClick={() => {
                setIsCreatingClass(false)
                setNewClassName("")
                setCreationError("")
              }}
              disabled={isCreatingLoading}
              className="mt-2 flex items-center gap-1 text-xs text-[#00306E] hover:opacity-70 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
              <span>Cancel</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

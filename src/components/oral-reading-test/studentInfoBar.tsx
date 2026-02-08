"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface StudentInfoBarProps {
  studentName: string
  gradeLevel: string
  classes: string[]
  onStudentNameChange?: (name: string) => void
  onGradeLevelChange?: (level: string) => void
}

export function StudentInfoBar({
  studentName,
  gradeLevel,
  classes,
  onStudentNameChange,
  onGradeLevelChange,
}: StudentInfoBarProps) {
  const [selectedClass, setSelectedClass] = useState(classes[0] || "")
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false)

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

      {/* Class Name - Dropdown */}
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
        <button
          onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm text-[#00306E]"
          style={{
            background: "#EFFDFF",
            border: "1px solid #54A4FF",
            boxShadow: "0px 1px 10px rgba(108, 164, 239, 0.25)",
          }}
        >
          <span>{selectedClass}</span>
          <ChevronDown className="h-4 w-4 text-[#54A4FF]" />
        </button>

        {isClassDropdownOpen && (
          <div
            className="absolute left-3 right-3 top-full z-10 mt-1 rounded-lg bg-white py-1"
            style={{
              border: "1px solid #54A4FF",
              boxShadow: "0px 4px 12px rgba(84, 164, 255, 0.2)",
            }}
          >
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
          </div>
        )}
      </div>
    </div>
  )
}

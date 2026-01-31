"use client"

import { useState } from "react"
import { ChevronDown, Plus } from "lucide-react"
import { ClassCard } from "./class-card"

type ClassCardVariant = "blue" | "yellow" | "cyan"

interface ClassItem {
  id: string
  name: string
  studentCount: number
  variant: ClassCardVariant
}

const mockClasses: ClassItem[] = [
  { id: "1", name: "Class Nara", studentCount: 24, variant: "blue" },
  { id: "2", name: "Class Nara", studentCount: 24, variant: "yellow" },
  { id: "3", name: "Class Nara", studentCount: 24, variant: "blue" },
  { id: "4", name: "Class Nara", studentCount: 24, variant: "blue" },
  { id: "5", name: "Class Nara", studentCount: 24, variant: "yellow" },
  { id: "6", name: "Class Nara", studentCount: 24, variant: "cyan" },
  { id: "7", name: "Class Nara", studentCount: 24, variant: "cyan" },
]

const schoolYears = ["2026-2027", "2025-2026", "2024-2025"]

export function ClassInventory() {
  const [selectedYear, setSelectedYear] = useState(schoolYears[0])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-foreground">Class Inventory</h2>
        <div className="flex gap-3">
          {/* School Year Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              School Year
              <ChevronDown className="h-4 w-4" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-border/50 bg-card py-1 shadow-lg">
                {schoolYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year)
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted ${
                      selectedYear === year
                        ? "font-semibold text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create Class Button */}
          <button className="flex items-center gap-2 rounded-lg bg-[#2E2E68] px-4 py-2 text-sm font-medium text-white shadow-lg transition-colors hover:bg-[#3E3E78]">
            <Plus className="h-4 w-4" />
            Create Class
          </button>
        </div>
      </div>

      {/* Class Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockClasses.map((classItem) => (
          <ClassCard
            key={classItem.id}
            name={classItem.name}
            studentCount={classItem.studentCount}
            variant={classItem.variant}
          />
        ))}
      </div>
    </div>
  )
}

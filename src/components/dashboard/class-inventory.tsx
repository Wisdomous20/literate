"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { ClassCard } from "./class-card"
import { CreateClassModal } from "./create-class-modal"

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
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCreateClass = (data: { className: string; schoolYear: string }) => {
    console.log("Creating class:", data)
    // Here you would typically make an API call to create the class
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[20px] font-semibold leading-[30px] text-[#00306E]">Class Inventory</h2>
        <div className="flex gap-3">
          {/* School Year Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-[#5D5DFB]/30 bg-white px-4 py-2 text-sm font-medium text-[#00306E] transition-colors hover:bg-[#E4F4FF]"
            >
              School Year
              <ChevronDown className="h-4 w-4" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
                {schoolYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year)
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#E4F4FF] ${
                      selectedYear === year
                        ? "font-semibold text-[#6666FF]"
                        : "text-[#00306E]"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create Class Button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex justify-center items-center gap-2 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{
              width: "150px",
              height: "40px",
              background: "#2E2E68",
              border: "1px solid #7A7AFB",
              boxShadow: "0px 1px 20px rgba(65, 155, 180, 0.47)",
              borderRadius: "8px"
            }}
          >
            Create Class
          </button>
        </div>
      </div>

      {/* Class Grid - 5 columns on large screens, 4 on medium, 3 on small */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {mockClasses.map((classItem) => (
          <ClassCard
            key={classItem.id}
            name={classItem.name}
            studentCount={classItem.studentCount}
            variant={classItem.variant}
          />
        ))}
      </div>

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateClass={handleCreateClass}
      />
    </div>
  )
}

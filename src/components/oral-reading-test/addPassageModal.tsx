"use client"

import { useState } from "react"
import { X, ChevronDown, List, LayoutGrid, FileText } from "lucide-react"

interface Passage {
  id: string
  title: string
  language: string
  level: string
  testType: string
}

// Mock passage data
const mockPassages: Passage[] = [
  { id: "1", title: "The Philippine Eagle", language: "English", level: "Grade 3", testType: "Pre-Test" },
  { id: "2", title: "Ang Alamat ng Pinya", language: "Filipino", level: "Grade 4", testType: "Pre-Test" },
  { id: "3", title: "The Importance of Reading", language: "English", level: "Grade 4", testType: "Post-Test" },
  { id: "4", title: "Mga Hayop sa Bukid", language: "Filipino", level: "Grade 3", testType: "Pre-Test" },
  { id: "5", title: "Water Conservation", language: "English", level: "Grade 5", testType: "Pre-Test" },
  { id: "6", title: "Ang Munting Prinsesa", language: "Filipino", level: "Grade 5", testType: "Post-Test" },
  { id: "7", title: "Our Solar System", language: "English", level: "Grade 6", testType: "Pre-Test" },
  { id: "8", title: "Panahon ng Tag-ulan", language: "Filipino", level: "Grade 4", testType: "Pre-Test" },
  { id: "9", title: "The Life of Jose Rizal", language: "English", level: "Grade 6", testType: "Post-Test" },
  { id: "10", title: "Kalikasan at Kapaligiran", language: "Filipino", level: "Grade 5", testType: "Pre-Test" },
  { id: "11", title: "Healthy Eating Habits", language: "English", level: "Grade 3", testType: "Pre-Test" },
  { id: "12", title: "Ang Simbahan sa Aming Bayan", language: "Filipino", level: "Grade 6", testType: "Post-Test" },
  { id: "13", title: "Community Helpers", language: "English", level: "Grade 3", testType: "Pre-Test" },
  { id: "14", title: "Pamilyang Pilipino", language: "Filipino", level: "Grade 4", testType: "Pre-Test" },
  { id: "15", title: "Climate Change Awareness", language: "English", level: "Grade 6", testType: "Pre-Test" },
]

const PASSAGE_LEVELS = ["All Levels", "Grade 3", "Grade 4", "Grade 5", "Grade 6"]
const TEST_TYPES = ["All", "Pre-Test", "Post-Test"]
const LANGUAGES = ["All Languages", "English", "Filipino"]

interface AddPassageModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPassage: (passage: Passage) => void
}

function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (val: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative flex-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-[10px] px-4 py-3 text-[15px] font-medium"
        style={{
          background: "#EFFDFF",
          border: "1px solid #54A4FF",
          boxShadow: "0px 1px 20px rgba(108, 164, 239, 0.37)",
          color: "#00306E",
        }}
      >
        <span>{value}</span>
        <ChevronDown className="h-4 w-4" style={{ color: "#03438D" }} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div
            className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg bg-white py-1"
            style={{
              border: "1px solid #54A4FF",
              boxShadow: "0px 4px 12px rgba(84, 164, 255, 0.2)",
            }}
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2 text-left text-sm font-medium transition-colors hover:bg-[#E4F4FF]"
                style={{
                  color: value === opt ? "#5D5DFB" : "#00306E",
                  fontWeight: value === opt ? 600 : 500,
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function AddPassageModal({ isOpen, onClose, onSelectPassage }: AddPassageModalProps) {
  const [selectedLevel, setSelectedLevel] = useState(PASSAGE_LEVELS[0])
  const [selectedTestType, setSelectedTestType] = useState(TEST_TYPES[0])
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0])
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  if (!isOpen) return null

  const filteredPassages = mockPassages.filter((p) => {
    if (selectedLevel !== PASSAGE_LEVELS[0] && p.level !== selectedLevel) return false
    if (selectedTestType !== TEST_TYPES[0] && p.testType !== selectedTestType) return false
    if (selectedLanguage !== LANGUAGES[0] && p.language !== selectedLanguage) return false
    return true
  })

  const handleSelect = () => {
    const passage = filteredPassages.find((p) => p.id === selectedPassageId)
    if (passage) {
      onSelectPassage(passage)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(116, 128, 136, 0.53)" }}
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className="relative z-10 flex flex-col overflow-hidden"
        style={{
          width: "820px",
          maxHeight: "85vh",
          background: "#EFFDFF",
          border: "1px solid #54A4FF",
          boxShadow: "0px 1px 20px 20px rgba(108, 164, 239, 0.37)",
          borderRadius: "50px",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-10 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#D5E7FE]"
        >
          <X className="h-6 w-6" style={{ color: "#00306E" }} />
        </button>

        {/* Modal Content */}
        <div className="flex min-h-0 flex-1 flex-col px-12 pb-10 pt-12 pr-20">
          {/* Title Row — title + view toggle */}
          <div className="mb-5 flex shrink-0 items-center justify-between">
            <h2
              className="text-[25px] font-bold"
              style={{ color: "#5D5DFB", fontFamily: "Poppins, sans-serif" }}
            >
              Select a Passage
            </h2>

            {/* View Mode Toggle */}
            <div
              className="flex items-center overflow-hidden rounded-lg"
              style={{ border: "1px solid #54A4FF" }}
            >
              <button
                onClick={() => setViewMode("list")}
                className="flex h-9 w-10 items-center justify-center transition-colors"
                style={{
                  background: viewMode === "list" ? "#5D5DFB" : "#EFFDFF",
                }}
                title="List view"
              >
                <List
                  className="h-[18px] w-[18px]"
                  style={{ color: viewMode === "list" ? "#FFFFFF" : "#00306E" }}
                />
              </button>
              <div className="h-9 w-px" style={{ background: "#54A4FF" }} />
              <button
                onClick={() => setViewMode("grid")}
                className="flex h-9 w-10 items-center justify-center transition-colors"
                style={{
                  background: viewMode === "grid" ? "#5D5DFB" : "#EFFDFF",
                }}
                title="Grid view"
              >
                <LayoutGrid
                  className="h-[18px] w-[18px]"
                  style={{ color: viewMode === "grid" ? "#FFFFFF" : "#00306E" }}
                />
              </button>
            </div>
          </div>

          {/* Filter Dropdowns Row */}
          <div className="mb-4 flex shrink-0 gap-3">
            <FilterDropdown
              label="Passage Level"
              options={PASSAGE_LEVELS}
              value={selectedLevel}
              onChange={setSelectedLevel}
            />
            <FilterDropdown
              label="Test Type"
              options={TEST_TYPES}
              value={selectedTestType}
              onChange={setSelectedTestType}
            />
            <FilterDropdown
              label="Language"
              options={LANGUAGES}
              value={selectedLanguage}
              onChange={setSelectedLanguage}
            />
          </div>

          {/* Results Count */}
          <p
            className="mb-3 shrink-0 text-[20px] font-medium"
            style={{ color: "rgba(34, 34, 139, 0.81)", fontFamily: "Kanit, sans-serif" }}
          >
            Results: {filteredPassages.length}
          </p>

          {/* Passage Items — scrollable area that fills remaining space */}
          <div className="min-h-0 flex-1 overflow-auto pr-1">
            {viewMode === "list" ? (
              /* ── List View ── */
              <div className="flex flex-col gap-2">
                {filteredPassages.map((passage) => {
                  const isSelected = selectedPassageId === passage.id
                  return (
                    <button
                      key={passage.id}
                      onClick={() => setSelectedPassageId(passage.id)}
                      className="flex w-full shrink-0 items-center rounded-[9px] px-8 text-left transition-colors"
                      style={{
                        minHeight: "71px",
                        background: isSelected ? "rgba(74, 74, 252, 0.23)" : "#FFFFFF",
                        border: isSelected ? "2px solid #5D5DFB" : "1px solid #5D5DFB",
                        fontFamily: "Poppins, sans-serif",
                      }}
                    >
                      <span
                        className="text-[20px] font-medium"
                        style={{ color: "#0C1A6D" }}
                      >
                        {passage.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              /* ── Grid View ── */
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
              >
                {filteredPassages.map((passage) => {
                  const isSelected = selectedPassageId === passage.id
                  return (
                    <button
                      key={passage.id}
                      onClick={() => setSelectedPassageId(passage.id)}
                      className="flex flex-col justify-center gap-2 rounded-[12px] p-5 text-left transition-colors"
                      style={{
                        minHeight: "110px",
                        background: isSelected ? "rgba(74, 74, 252, 0.23)" : "#FFFFFF",
                        border: isSelected ? "2px solid #5D5DFB" : "1px solid #5D5DFB",
                        fontFamily: "Poppins, sans-serif",
                      }}
                    >
                      <span
                        className="line-clamp-2 text-[15px] font-semibold leading-tight"
                        style={{ color: "#0C1A6D" }}
                      >
                        {passage.title}
                      </span>
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: "rgba(0, 48, 110, 0.5)" }}
                      >
                        {passage.language} · {passage.level} · {passage.testType}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Select Passage Button */}
          <div className="mt-6 flex shrink-0 justify-center">
            <button
              onClick={handleSelect}
              disabled={!selectedPassageId}
              className="text-[15px] font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                width: "197px",
                height: "48px",
                background: "#2E2E68",
                border: "1px solid #7A7AFB",
                boxShadow: "0px 1px 20px rgba(65, 155, 180, 0.47)",
                borderRadius: "8px",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Select Passage
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
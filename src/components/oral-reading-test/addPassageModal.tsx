"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown, List, LayoutGrid, FileText } from "lucide-react"
import { getAllPassagesAction } from "@/app/actions/admin/getAllPassage"

interface Passage {
  id: string
  title: string
  content: string
  language: string
  level: number
  tags: string
  testType: string
  createdAt: Date
  updatedAt: Date
}

// Helper to display level as "Grade X"
function formatLevel(level: number): string {
  return `Grade ${level}`
}

// Helper to display testType enum as readable string
function formatTestType(testType: string): string {
  switch (testType) {
    case "PRE_TEST":
      return "Pre-Test"
    case "POST_TEST":
      return "Post-Test"
    default:
      return testType
  }
}

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
  const [passages, setPassages] = useState<Passage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch passages from the database when modal opens
  useEffect(() => {
    if (!isOpen) return

    async function fetchPassages() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await getAllPassagesAction()
        if (result.success && result.passages) {
          setPassages(result.passages as Passage[])
        } else {
          setError(result.error || "Failed to load passages")
        }
      } catch (err) {
        setError("An error occurred while loading passages")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPassages()
  }, [isOpen])

  if (!isOpen) return null

  const filteredPassages = passages.filter((p) => {
    if (selectedLevel !== PASSAGE_LEVELS[0] && formatLevel(p.level) !== selectedLevel) return false
    if (selectedTestType !== TEST_TYPES[0] && formatTestType(p.testType) !== selectedTestType) return false
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
      <div
        className="absolute inset-0"
        style={{ background: "rgba(116, 128, 136, 0.53)" }}
        onClick={onClose}
      />

      <div
        className="relative z-10 flex flex-col overflow-hidden"
        style={{
          width: "820px",
          maxHeight: "85vh",
          background: "#EFFDFF",
          border: "1px solid #54A4FF",
          boxShadow: "0px 1px 20px rgba(108, 164, 239, 0.37)",
          borderRadius: "20px",
        }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-8 pt-6 pb-4">
          <h2
            className="text-[25px] font-bold"
            style={{ color: "#5D5DFB", fontFamily: "Poppins, sans-serif" }}
          >
            Select a Passage
          </h2>

          <div className="flex items-center gap-3">
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

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#E4F4FF]"
            >
              <X className="h-5 w-5" style={{ color: "#00306E" }} />
            </button>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex min-h-0 flex-1 flex-col px-8 pb-6">
          {/* Filters */}
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

          {/* Loading / Error / Passage List */}
          <div className="min-h-0 flex-1 overflow-auto pr-1">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-sm text-[#00306E]/60">Loading passages...</p>
              </div>
            ) : error ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            ) : filteredPassages.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-sm text-[#00306E]/40">No passages found</p>
              </div>
            ) : viewMode === "list" ? (
              <div className="flex flex-col gap-2">
                {filteredPassages.map((passage) => (
                  <button
                    key={passage.id}
                    onClick={() => setSelectedPassageId(passage.id)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors"
                    style={{
                      background:
                        selectedPassageId === passage.id
                          ? "rgba(93, 93, 251, 0.1)"
                          : "white",
                      border:
                        selectedPassageId === passage.id
                          ? "1px solid #5D5DFB"
                          : "1px solid rgba(84, 164, 255, 0.3)",
                    }}
                  >
                    <FileText className="h-5 w-5 shrink-0" style={{ color: "#5D5DFB" }} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: "#00306E" }}>
                        {passage.title}
                      </p>
                      <p className="text-xs" style={{ color: "#6B7DB3" }}>
                        {passage.language} • {formatLevel(passage.level)} • {formatTestType(passage.testType)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {filteredPassages.map((passage) => (
                  <button
                    key={passage.id}
                    onClick={() => setSelectedPassageId(passage.id)}
                    className="flex flex-col items-center gap-2 rounded-lg px-4 py-4 text-center transition-colors"
                    style={{
                      background:
                        selectedPassageId === passage.id
                          ? "rgba(93, 93, 251, 0.1)"
                          : "white",
                      border:
                        selectedPassageId === passage.id
                          ? "1px solid #5D5DFB"
                          : "1px solid rgba(84, 164, 255, 0.3)",
                    }}
                  >
                    <FileText className="h-6 w-6" style={{ color: "#5D5DFB" }} />
                    <p className="text-sm font-semibold" style={{ color: "#00306E" }}>
                      {passage.title}
                    </p>
                    <p className="text-xs" style={{ color: "#6B7DB3" }}>
                      {passage.language} • {formatLevel(passage.level)} • {formatTestType(passage.testType)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Select Button */}
          <div className="mt-4 flex shrink-0 justify-end">
            <button
              onClick={handleSelect}
              disabled={!selectedPassageId}
              className="rounded-lg px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ background: "#5D5DFB" }}
            >
              Select Passage
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
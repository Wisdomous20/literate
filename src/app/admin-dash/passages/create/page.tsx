"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, FileText } from "lucide-react"

const languages = ["English", "Filipino"]
const passageLevels = Array.from({ length: 13 }, (_, i) => i) // 0 (K) to 12
const testTypes = ["PRE_TEST", "POST_TEST"]
const tagOptions = ["Literal", "Inferential", "Critical"]

function getLevelLabel(level: number) {
  return level === 0 ? "Kindergarten" : `Grade ${level}`
}

export default function CreatePassagePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [language, setLanguage] = useState("")
  const [level, setLevel] = useState<number | "">("")
  const [testType, setTestType] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !language || level === "" || !testType) return
    console.log("Creating passage:", { title, content, language, level, testType, tags: selectedTags })
    router.push("/superadmin/passages")
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header
        className="flex h-[118px] items-center justify-between px-10"
        style={{
          borderBottom: "1px solid #8D8DEC",
          boxShadow: "0px 4px 4px #54A4FF",
          borderTopLeftRadius: "50px",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 grid-cols-2 grid-rows-2 gap-0.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-sm" style={{ background: "#6666FF", width: 12, height: 12 }} />
            ))}
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#31318A" }}>
            Create Passage
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-auto px-8 py-6">
        {/* Back Button */}
        <button
          onClick={() => router.push("/superadmin/passages")}
          className="mb-6 flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-70"
          style={{ color: "#31318A" }}
        >
          <ChevronLeft className="h-5 w-5" />
          Back to Passages
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-semibold"
              style={{ color: "#00306E" }}
            >
              Passage Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter passage title"
              className="w-full rounded-xl px-4 py-3 text-sm text-[#00306E] outline-none transition-colors placeholder:text-[#00306E]/40"
              style={{
                background: "#EFFDFF",
                border: "1px solid #54A4FF",
                boxShadow: "0px 1px 20px rgba(108, 164, 239, 0.2)",
              }}
            />
          </div>

          {/* Row: Language, Level, Test Type */}
          <div className="grid grid-cols-3 gap-4">
            {/* Language */}
            <div>
              <label
                htmlFor="language"
                className="mb-2 block text-sm font-semibold"
                style={{ color: "#00306E" }}
              >
                Language
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full appearance-none rounded-xl px-4 py-3 text-sm text-[#00306E] outline-none"
                style={{
                  background: "#EFFDFF",
                  border: "1px solid #54A4FF",
                  boxShadow: "0px 1px 20px rgba(108, 164, 239, 0.2)",
                }}
              >
                <option value="">Select Language</option>
                {languages.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Passage Level */}
            <div>
              <label
                htmlFor="level"
                className="mb-2 block text-sm font-semibold"
                style={{ color: "#00306E" }}
              >
                Passage Level
              </label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full appearance-none rounded-xl px-4 py-3 text-sm text-[#00306E] outline-none"
                style={{
                  background: "#EFFDFF",
                  border: "1px solid #54A4FF",
                  boxShadow: "0px 1px 20px rgba(108, 164, 239, 0.2)",
                }}
              >
                <option value="">Select Level</option>
                {passageLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>{getLevelLabel(lvl)}</option>
                ))}
              </select>
            </div>

            {/* Test Type */}
            <div>
              <label
                htmlFor="testType"
                className="mb-2 block text-sm font-semibold"
                style={{ color: "#00306E" }}
              >
                Test Type
              </label>
              <select
                id="testType"
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full appearance-none rounded-xl px-4 py-3 text-sm text-[#00306E] outline-none"
                style={{
                  background: "#EFFDFF",
                  border: "1px solid #54A4FF",
                  boxShadow: "0px 1px 20px rgba(108, 164, 239, 0.2)",
                }}
              >
                <option value="">Select Test Type</option>
                {testTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "PRE_TEST" ? "Pre-Test" : "Post-Test"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label
              className="mb-2 block text-sm font-semibold"
              style={{ color: "#00306E" }}
            >
              Tags (Phil-IRI Classification)
            </label>
            <div className="flex gap-3">
              {tagOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
                  style={{
                    background: selectedTags.includes(tag) ? "#6666FF" : "#EFFDFF",
                    color: selectedTags.includes(tag) ? "#ffffff" : "#00306E",
                    border: `1px solid ${selectedTags.includes(tag) ? "#6666FF" : "#54A4FF"}`,
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="content"
                className="text-sm font-semibold"
                style={{ color: "#00306E" }}
              >
                Passage Content
              </label>
              <span className="text-xs font-medium" style={{ color: "#00306E" }}>
                {wordCount} words
              </span>
            </div>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter passage content..."
              rows={12}
              className="w-full resize-none rounded-xl px-5 py-4 text-sm leading-relaxed text-[#00306E] outline-none placeholder:text-[#00306E]/40"
              style={{
                background: "#EFFDFF",
                border: "1px solid #54A4FF",
                boxShadow: "0px 1px 20px rgba(108, 164, 239, 0.2)",
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pb-4">
            <button
              type="submit"
              className="rounded-xl px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{
                background: "#2E2E68",
                boxShadow: "0px 1px 20px rgba(65, 155, 180, 0.47)",
              }}
            >
              Create Passage
            </button>
            <button
              type="button"
              onClick={() => router.push("/superadmin/passages")}
              className="rounded-xl px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{
                color: "#00306E",
                border: "1px solid #54A4FF",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

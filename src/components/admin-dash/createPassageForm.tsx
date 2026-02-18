"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { createPassageAction } from "@/app/actions/admin/createPassage";

const languages = ["Filipino", "English"];
const tags = ["Literal", "Inferential", "Critical"] as const;
const testTypes = [
  { label: "Pre-Test", value: "PRE_TEST" },
  { label: "Post-Test", value: "POST_TEST" },
];

const levels = [
  { label: "Kindergarten", value: 0 },
  { label: "Grade 1", value: 1 },
  { label: "Grade 2", value: 2 },
  { label: "Grade 3", value: 3 },
  { label: "Grade 4", value: 4 },
  { label: "Grade 5", value: 5 },
  { label: "Grade 6", value: 6 },
  { label: "Grade 7", value: 7 },
  { label: "Grade 8", value: 8 },
  { label: "Grade 9", value: 9 },
  { label: "Grade 10", value: 10 },
  { label: "Grade 11", value: 11 },
  { label: "Grade 12", value: 12 },
];

export function CreatePassageForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [level, setLevel] = useState<number | "">("");
  const [selectedTag, setSelectedTag] = useState("");
  const [testType, setTestType] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-count words
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !title.trim() ||
      !content.trim() ||
      !language ||
      level === "" ||
      !selectedTag ||
      !testType
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await createPassageAction({
        title: title.trim(),
        content: content.trim(),
        language,
        level: Number(level),
        tags: selectedTag as "Literal" | "Inferential" | "Critical",
        testType: testType as "PRE_TEST" | "POST_TEST",
      });
      router.push("/admin/passages");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create passage";
      setError(errorMessage);
      console.error("Error creating passage:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-100 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="flex items-center gap-6">
        <label className="w-[130px] shrink-0 text-base font-semibold text-[#00306E]">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none transition-colors focus:border-[#6666FF] shadow-[inset_0px_2px_4px_rgba(0,48,110,0.08)]"
          placeholder="Enter passage title"
          disabled={isLoading}
        />
      </div>

      {/* Content */}
      <div className="flex gap-6">
        <label className="w-[130px] shrink-0 pt-3 text-base font-semibold text-[#00306E]">
          Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="flex-1 resize-none rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none transition-colors focus:border-[#6666FF] shadow-[inset_0px_2px_4px_rgba(0,48,110,0.08)]"
          placeholder="Enter passage content..."
          disabled={isLoading}
        />
      </div>

      {/* Word Count (read only) */}

      <div className="flex items-center gap-4">
        <label
          htmlFor="wordCount"
          className="w-32 text-base font-medium text-[#00306E]"
        >
          Word Count
        </label>

        <input
          id="wordCount"
          type="text"
          value={wordCount}
          readOnly
          className="flex-1 cursor-not-allowed rounded-lg border-2 border-[#E4F4FF] bg-[#F8FAFC] px-4 py-3 text-base text-[#00306E]/70 outline-none shadow-[inset_0px_2px_4px_rgba(0,48,110,0.08)]"
        />
      </div>

      {/* Language */}
      <div className="flex items-center gap-6">
        <label
          htmlFor="language"
          className="w-[130px] shrink-0 text-base font-semibold text-[#00306E]"
        >
          Language
        </label>

        <div className="relative flex-1">
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full appearance-none rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none transition-colors focus:border-[#6666FF] shadow-[inset_0px_2px_4px_rgba(0,48,110,0.08)]"
            disabled={isLoading}
          >
            <option value="">Select language</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#00306E]/50" />
        </div>
      </div>

      {/* Level (Int) */}
      <div className="flex items-center gap-6">
        <label
          htmlFor="level"
          className="w-[130px] shrink-0 text-base font-semibold text-[#00306E]"
        >
          Level
        </label>

        <div className="relative flex-1">
          <select
            id="level"
            value={level}
            onChange={(e) =>
              setLevel(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full appearance-none rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none transition-colors focus:border-[#6666FF] shadow-[inset_0px_2px_4px_rgba(0,48,110,0.08)]"
            disabled={isLoading}
          >
            <option value="">Select level</option>
            {levels.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#00306E]/50" />
        </div>
      </div>

      {/* Tags (Literal / Inferential / Critical) */}
      <div className="flex items-center gap-6">
        <label className="w-[130px] shrink-0 text-base font-semibold text-[#00306E]">
          Tags
        </label>
        <div className="flex flex-1 gap-3">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              disabled={isLoading}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                selectedTag === tag
                  ? "border-[#6666FF] bg-[#6666FF]/10 text-[#6666FF]"
                  : "border-[#E4F4FF] bg-white text-[#00306E]/60 hover:border-[#6666FF]/30"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Test Type (PRE_TEST / POST_TEST) */}
      <div className="flex items-center gap-6">
        <label className="w-[130px] shrink-0 text-base font-semibold text-[#00306E]">
          Test Type
        </label>
        <div className="flex flex-1 gap-3">
          {testTypes.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTestType(t.value)}
              disabled={isLoading}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                testType === t.value
                  ? "border-[#6666FF] bg-[#6666FF]/10 text-[#6666FF]"
                  : "border-[#E4F4FF] bg-white text-[#00306E]/60 hover:border-[#6666FF]/30"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-center gap-4 pt-8">
        <Link
          href="/admin/passages"
          className="rounded-lg px-10 py-3 text-base font-semibold text-[#00306E] transition-all hover:bg-[#E4F4FF]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-[#2E2E68] px-10 py-3 text-base font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 shadow-[0px_4px_15px_rgba(46,46,104,0.4)]"
        >
          {isLoading ? "Creating..." : "Create Passage"}
        </button>
      </div>
    </form>
  );
}
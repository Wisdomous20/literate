"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { createPassageAction } from "@/app/actions/admin/createPassage";
import { useQueryClient } from "@tanstack/react-query";

const languages = ["Filipino", "English"];
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
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [level, setLevel] = useState<number | "">("");
  const [testType, setTestType] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) return setError("Title is required.");
    if (title.trim().length < 3)
      return setError("Title must be at least 3 characters.");
    if (title.trim().length > 100)
      return setError("Title must be less than 100 characters.");
    if (!content.trim()) return setError("Content is required.");
    if (content.trim().length < 20)
      return setError("Content must be at least 20 characters.");
    if (wordCount < 5) return setError("Content must have at least 5 words.");
    if (!language) return setError("Please select a language.");
    if (level === "") return setError("Please select a level.");
    if (!testType) return setError("Please select a test type.");

    setIsLoading(true);
    try {
      await createPassageAction({
        title: title.trim(),
        content: content.trim(),
        language,
        level: Number(level),
        testType: testType as "PRE_TEST" | "POST_TEST",
      });
      await queryClient.invalidateQueries({ queryKey: ["passages"] });
      router.push("/admin");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create passage";
      setError(errorMessage);
      console.error("Error creating passage:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-xl min-w-[320px] space-y-6 rounded-2xl bg-white p-8 shadow-lg"
    >
      {error && (
        <div className="rounded-lg bg-red-100 p-4 text-sm text-red-700 mb-2">
          {error}
        </div>
      )}

      <div>
        <label className="block mb-2 font-semibold text-[#00306E]">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none shadow focus:border-[#6666FF] transition"
          placeholder="Enter passage title"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block mb-2 font-semibold text-[#00306E]">
          Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="w-full rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none shadow focus:border-[#6666FF] transition"
          placeholder="Enter passage content..."
          disabled={isLoading}
        />
      </div>

      <div>
        <label
          htmlFor="wordCount"
          className="block mb-2 font-semibold text-[#00306E]"
        >
          Word Count
        </label>
        <input
          id="wordCount"
          type="number"
          value={wordCount}
          readOnly
          aria-readonly="true"
          title="Word count"
          className="w-full rounded-lg border-2 border-[#E4F4FF] bg-[#F8FAFC] px-4 py-3 text-base text-[#00306E]/70 outline-none shadow"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label
            htmlFor="language"
            className="block mb-2 font-semibold text-[#00306E]"
          >
            Language
          </label>
          <div className="relative">
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full appearance-none rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none shadow focus:border-[#6666FF] transition"
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
        <div className="flex-1">
          <label
            htmlFor="level"
            className="block mb-2 font-semibold text-[#00306E]"
          >
            Level
          </label>
          <div className="relative">
            <select
              id="level"
              value={level}
              onChange={(e) =>
                setLevel(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full appearance-none rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none shadow focus:border-[#6666FF] transition"
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
      </div>

      <div>
        <label className="block mb-2 font-semibold text-[#00306E]">
          Test Type
        </label>
        <div className="flex gap-3">
          {testTypes.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTestType(t.value)}
              disabled={isLoading}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                testType === t.value
                  ? "border-[#6666FF] bg-[#6666FF]/10 text-[#6666FF] shadow"
                  : "border-[#E4F4FF] bg-white text-[#00306E]/60 hover:border-[#6666FF]/30"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4 gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isLoading}
          className="rounded-lg px-8 py-3 text-base font-semibold text-[#2E2E68] border border-[#2E2E68] bg-white hover:bg-[#F0F4FF] transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-[#2E2E68] rounded-lg px-10 py-3 text-base font-semibold text-white shadow transition-all hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? "Creating..." : "Create Passage"}
        </button>
      </div>
    </form>
  );
}

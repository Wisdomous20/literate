"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { updatePassageAction } from "@/app/actions/admin/updatePassage";
import { useQueryClient } from "@tanstack/react-query";

interface Passage {
  id: string;
  title: string;
  content: string;
  language: string;
  level: number;
  testType: string;
}

interface UpdatePassageFormProps {
  passage: Passage;
  onSuccess?: () => void;
}

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

export function UpdatePassageForm({
  passage,
  onSuccess,
}: UpdatePassageFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(passage.title);
  const [content, setContent] = useState(passage.content);
  const [language, setLanguage] = useState(passage.language);
  const [level, setLevel] = useState<number | "">(passage.level);
  const [testType, setTestType] = useState(passage.testType);
  const [wordCount, setWordCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, [content]);

  useEffect(() => {
    setHasChanges(
      title !== passage.title ||
        content !== passage.content ||
        language !== passage.language ||
        level !== passage.level ||
        testType !== passage.testType,
    );
  }, [title, content, language, level, testType, passage]);

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
      await updatePassageAction({
        id: passage.id,
        title: title.trim(),
        content: content.trim(),
        language,
        level: Number(level),
        testType: testType as "PRE_TEST" | "POST_TEST",
      });
      await queryClient.invalidateQueries({ queryKey: ["passages"] });
      await queryClient.invalidateQueries({
        queryKey: ["passage", passage.id],
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update passage";
      setError(errorMessage);
      console.error("Error updating passage:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin");
  };

  return (
    <div className="flex-1 w-full h-full overflow-auto">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full h-full bg-white rounded-2xl shadow-lg p-8 text-base"
      >
        {error && (
          <div className="rounded-lg bg-red-100 p-3 text-base text-red-700 mb-3">
            {error}
          </div>
        )}

        {!hasChanges && (
          <div className="rounded-lg bg-blue-100 p-3 text-base text-blue-700 mb-3">
            No changes made yet.
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 flex-1">
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <label className="block mb-2 font-semibold text-[#00306E] text-base">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none shadow-sm focus:border-[#6666FF] transition"
                placeholder="Enter passage title"
                disabled={isLoading}
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block mb-2 font-semibold text-[#00306E] text-base">
                Content
              </label>
              <div className="w-full rounded-2xl border border-[#E4F4FF] bg-white overflow-auto max-h-80">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  className="w-full min-h-40 max-h-80 rounded-2xl border-none bg-transparent px-4 py-3 text-base text-[#00306E] outline-none shadow-none focus:ring-0 focus:outline-none resize-none overflow-auto"
                  placeholder="Enter passage content..."
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="rounded-2xl px-6 py-3 text-base font-semibold text-[#2E2E68] border border-[#2E2E68] bg-white hover:bg-[#F0F4FF] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !hasChanges}
                className="bg-[#2E2E68] rounded-2xl px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full md:w-72">
            <div>
              <label
                htmlFor="wordCount"
                className="block mb-2 font-semibold text-[#00306E] text-base"
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
                className="w-full rounded-lg border border-[#E4F4FF] bg-[#F8FAFC] px-4 py-3 text-base text-[#00306E]/70 outline-none shadow-sm"
              />
            </div>

            <div>
              <label
                htmlFor="language"
                className="block mb-2 font-semibold text-[#00306E] text-base"
              >
                Language
              </label>
              <div className="relative">
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none shadow-sm focus:border-[#6666FF] transition"
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
            <div>
              <label
                htmlFor="level"
                className="block mb-2 font-semibold text-[#00306E] text-base"
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
                  className="w-full appearance-none rounded-lg border border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none shadow-sm focus:border-[#6666FF] transition"
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
            <div>
              <label className="block mb-2 font-semibold text-[#00306E] text-base">
                Test Type
              </label>
              <div className="flex gap-3">
                {testTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTestType(t.value)}
                    disabled={isLoading}
                    className={`flex-1 rounded-lg border-2 px-4 py-3 text-base font-medium transition-all ${
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
          </div>
        </div>
      </form>
    </div>
  );
}
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { addQuestionAction } from "@/app/actions/admin/addQuestion";
import { getAllPassageAction } from "@/app/actions/admin/getAllPassage";

interface Passage {
  id: string;
  title: string;
}

interface PassageApiData {
  id: string;
  title: string;
  content: string;
  language: string;
  level: number;
  tags: string;
  testType: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const tagOptions = ["Literal", "Inferential", "Critical"] as const;
const questionTypes = [
  { label: "Multiple Choice", value: "MULTIPLE_CHOICE" },
  { label: "Essay", value: "ESSAY" },
];

export function CreateQuestionForm() {
  const router = useRouter();
  const [questionText, setQuestionText] = useState("");
  const [passageId, setPassageId] = useState("");
  const [tags, setTags] = useState("");
  const [type, setType] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [passages, setPassages] = useState<Passage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPassages, setIsLoadingPassages] = useState(false);
  const [error, setError] = useState("");

  // Load passages on mount
  useEffect(() => {
    const loadPassages = async () => {
      setIsLoadingPassages(true);
      try {
        const data = await getAllPassageAction();
        if (data && Array.isArray(data)) {
          const formattedPassages: Passage[] = data.map(
            (p: PassageApiData) => ({
              id: p.id,
              title: p.title,
            }),
          );
          setPassages(formattedPassages);
        }
      } catch (err) {
        console.error("Error loading passages:", err);
      } finally {
        setIsLoadingPassages(false);
      }
    };
    loadPassages();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!questionText.trim() || !passageId || !tags || !type) {
        setError("Please fill in all required fields");
        return;
      }

      if (type === "MULTIPLE_CHOICE") {
        const filledOptions = options.filter(Boolean);
        if (filledOptions.length < 2) {
          setError(
            "Please provide at least 2 options for multiple choice questions",
          );
          return;
        }
        if (!correctAnswer) {
          setError("Please select a correct answer");
          return;
        }
      }

      setIsLoading(true);
      try {
        await addQuestionAction({
          passageId,
          questionText: questionText.trim(),
          tags: tags as "Literal" | "Inferential" | "Critical",
          type: type as "MULTIPLE_CHOICE" | "ESSAY",
          options:
            type === "MULTIPLE_CHOICE" ? options.filter(Boolean) : undefined,
          correctAnswer: type === "MULTIPLE_CHOICE" ? correctAnswer : undefined,
        });
        router.push("/admin-dash/questions");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create question";
        setError(errorMessage);
        console.error("Error creating question:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [questionText, passageId, tags, type, options, correctAnswer, router],
  );

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctAnswer === options[index]) {
        setCorrectAnswer("");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-100 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Passage */}
      <div className="flex items-center gap-6">
        <label
          htmlFor="passage"
          className="w-[140px] shrink-0 text-base font-semibold text-[#00306E]"
        >
          Passage
        </label>

        <div className="relative flex-1">
          <select
            id="passage"
            value={passageId}
            onChange={(e) => setPassageId(e.target.value)}
            className="w-full appearance-none rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none transition-colors focus:border-[#6666FF] shadow-[inset_0px_2px_4px_rgba(0,48,110,0.08)]"
            disabled={isLoading || isLoadingPassages}
          >
            <option value="">
              {isLoadingPassages ? "Loading passages..." : "Select passage"}
            </option>
            {passages.length === 0 && !isLoadingPassages && (
              <option disabled>No passages available</option>
            )}
            {passages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#00306E]/50" />
        </div>
      </div>

      {/* Question Text */}
      <div className="flex gap-6">
        <label className="w-[140px] shrink-0 pt-3 text-base font-semibold text-[#00306E]">
          Question
        </label>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={3}
          className="flex-1 resize-none rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none transition-colors focus:border-[#6666FF] shadow-[inset_0px_2px_4px_rgba(0,48,110,0.08)]"
          placeholder="Enter the comprehension question..."
          disabled={isLoading}
        />
      </div>

      {/* Tags (Literal / Inferential / Critical) */}
      <div className="flex items-center gap-6">
        <label className="w-[140px] shrink-0 text-base font-semibold text-[#00306E]">
          Tags
        </label>
        <div className="flex flex-1 gap-3">
          {tagOptions.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTags(t)}
              disabled={isLoading}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                tags === t
                  ? "border-[#6666FF] bg-[#6666FF]/10 text-[#6666FF]"
                  : "border-[#E4F4FF] bg-white text-[#00306E]/60 hover:border-[#6666FF]/30"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tag Description */}
      {tags && (
        <div className="ml-[164px] rounded-lg bg-[#E4F4FF]/60 px-4 py-3">
          <p className="text-xs text-[#00306E]/70">
            {tags === "Literal" &&
              "Literal questions ask about information directly stated in the passage."}
            {tags === "Inferential" &&
              "Inferential questions require the reader to draw conclusions beyond what is explicitly stated."}
            {tags === "Critical" &&
              "Critical questions require the reader to evaluate, judge, or form opinions about the text."}
          </p>
        </div>
      )}

      {/* Question Type (MULTIPLE_CHOICE / ESSAY) */}
      <div className="flex items-center gap-6">
        <label className="w-[140px] shrink-0 text-base font-semibold text-[#00306E]">
          Type
        </label>
        <div className="flex flex-1 gap-3">
          {questionTypes.map((qt) => (
            <button
              key={qt.value}
              type="button"
              onClick={() => setType(qt.value)}
              disabled={isLoading}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                type === qt.value
                  ? "border-[#6666FF] bg-[#6666FF]/10 text-[#6666FF]"
                  : "border-[#E4F4FF] bg-white text-[#00306E]/60 hover:border-[#6666FF]/30"
              }`}
            >
              {qt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Multiple Choice Options */}
      {type === "MULTIPLE_CHOICE" && (
        <>
          <div className="flex gap-6">
            <label className="w-[140px] shrink-0 pt-3 text-base font-semibold text-[#00306E]">
              Options
            </label>
            <div className="flex flex-1 flex-col gap-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 text-center text-sm font-semibold text-[#00306E]/50">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    className="flex-1 rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-2.5 text-sm text-[#00306E] outline-none transition-colors focus:border-[#6666FF] shadow-[inset_0px_2px_4px_rgba(0,48,110,0.08)]"
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    disabled={isLoading}
                  />

                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      disabled={isLoading}
                      aria-label={`Remove option ${String.fromCharCode(65 + i)}`}
                      title="Remove option"
                      className="text-[#DE3B40]/60 transition-colors hover:text-[#DE3B40] disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  disabled={isLoading}
                  className="flex items-center gap-1 self-start rounded-lg px-3 py-1.5 text-xs font-medium text-[#6666FF] transition-colors hover:bg-[#6666FF]/10 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Option
                </button>
              )}
            </div>
          </div>

          {/* Correct Answer */}
          <div className="flex items-center gap-6">
            <label
              htmlFor="correctAnswer"
              className="w-[140px] shrink-0 text-base font-semibold text-[#00306E]"
            >
              Correct Answer
            </label>

            <div className="relative flex-1">
              <select
                id="correctAnswer"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full appearance-none rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none transition-colors focus:border-[#6666FF] shadow-inner-soft"
                disabled={isLoading}
              >
                <option value="">Select correct answer</option>
                {options.filter(Boolean).map((opt, i) => (
                  <option key={i} value={opt}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#00306E]/50" />
            </div>
          </div>
        </>
      )}

      {/* Submit */}
      <div className="flex justify-center gap-4 pt-8">
        <Link
          href="/admin-dash/questions"
          className="rounded-lg px-10 py-3 text-base font-semibold text-[#00306E] transition-all hover:bg-[#E4F4FF]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className="submit-btn rounded-lg px-10 py-3 text-base font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? "Creating..." : "Create Question"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { updateQuestionAction } from "@/app/actions/admin/updateQuestion";

interface Question {
  id: string;
  questionText: string;
  tags: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
}

interface UpdateQuestionFormProps {
  question: Question;
  onSuccess?: () => void;
}

const tagOptions = ["Literal", "Inferential", "Critical"] as const;
const questionTypes = [
  { label: "Multiple Choice", value: "MULTIPLE_CHOICE" },
  { label: "Essay", value: "ESSAY" },
];

export function UpdateQuestionForm({
  question,
  onSuccess,
}: UpdateQuestionFormProps) {
  const router = useRouter();
  const [questionText, setQuestionText] = useState(question.questionText);
  const [tags, setTags] = useState(question.tags);
  const [type, setType] = useState(question.type);
  const [options, setOptions] = useState<string[]>(
    question.type === "MULTIPLE_CHOICE" && question.options
      ? question.options
      : ["", "", "", ""],
  );
  const [correctAnswer, setCorrectAnswer] = useState(
    question.correctAnswer || "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const hasTextChanged = questionText !== question.questionText;
    const hasTagsChanged = tags !== question.tags;
    const hasTypeChanged = type !== question.type;
    const hasOptionsChanged =
      question.type === "MULTIPLE_CHOICE" &&
      JSON.stringify(options) !==
        JSON.stringify(question.options || ["", "", "", ""]);
    const hasAnswerChanged =
      question.type === "MULTIPLE_CHOICE" &&
      correctAnswer !== (question.correctAnswer || "");

    setHasChanges(
      hasTextChanged ||
        hasTagsChanged ||
        hasTypeChanged ||
        hasOptionsChanged ||
        hasAnswerChanged,
    );
  }, [questionText, tags, type, options, correctAnswer, question]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!questionText.trim() || !tags || !type) {
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
        await updateQuestionAction({
          id: question.id,
          questionText: questionText.trim(),
          tags: tags as "Literal" | "Inferential" | "Critical",
          type: type as "MULTIPLE_CHOICE" | "ESSAY",
          options:
            type === "MULTIPLE_CHOICE" ? options.filter(Boolean) : undefined,
          correctAnswer: type === "MULTIPLE_CHOICE" ? correctAnswer : undefined,
        });

        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/admin-dash/questions");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update question";
        setError(errorMessage);
        console.error("Error updating question:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [questionText, tags, type, options, correctAnswer, question.id, router, onSuccess],
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

      {!hasChanges && (
        <div className="rounded-lg bg-blue-100 p-4 text-sm text-blue-700">
          No changes made yet.
        </div>
      )}

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
                className="w-full appearance-none rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none transition-colors focus:border-[#6666FF] shadow-[inset_0px_2px_4px_rgba(0,48,110,0.08)]"
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
          disabled={isLoading || !hasChanges}
          className="submit-btn rounded-lg px-10 py-3 text-base font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
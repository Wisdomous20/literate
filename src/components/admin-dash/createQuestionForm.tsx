"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Trash2 } from "lucide-react";

import { addQuestionAction } from "@/app/actions/admin/addQuestion";

const tagOptions = ["Literal", "Inferential", "Critical"] as const;
const questionTypes = [
  { label: "Multiple Choice", value: "MULTIPLE_CHOICE" },
  { label: "Essay", value: "ESSAY" },
];

function validateForm(
  questionText: string,
  tags: string,
  type: string,
  options: string[],
  correctAnswer: string,
) {
  if (!questionText.trim()) return "Question text is required";
  if (questionText.trim().length < 5)
    return "Question must be at least 5 characters";
  if (!tags) return "Please select a tag";
  if (!type) return "Please select a question type";
  if (type === "MULTIPLE_CHOICE") {
    const filledOptions = options.filter(Boolean);
    if (filledOptions.length < 2) return "Provide at least 2 options";
    if (!correctAnswer) return "Select a correct answer";
    if (!filledOptions.includes(correctAnswer))
      return "Correct answer must match one of the options";
  }
  return "";
}

export function CreateQuestionForm({
  passageId,
  onSuccess,
}: {
  passageId: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [questionText, setQuestionText] = useState("");
  const [tags, setTags] = useState("");
  const [type, setType] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      const validationError = validateForm(
        questionText,
        tags,
        type,
        options,
        correctAnswer,
      );
      if (validationError) {
        setError(validationError);
        return;
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
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/admin/passages/${passageId}`);
        }
      } catch (err) {
        setError("Failed to create question");
      } finally {
        setIsLoading(false);
      }
    },
    [
      questionText,
      tags,
      type,
      options,
      correctAnswer,
      passageId,
      onSuccess,
      router,
    ],
  );

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 6) setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctAnswer === options[index]) setCorrectAnswer("");
    }
  };

  const handleCancel = () => {
    router.push(`/admin/passages/${passageId}`);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
        style={{ minWidth: 320 }}
      >
        {error && (
          <div className="rounded-lg bg-red-100 p-4 text-sm text-red-700 mb-2">
            {error}
          </div>
        )}

        {/* Question Text */}
        <div>
          <label className="block mb-2 font-semibold text-[#00306E]">
            Question
          </label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
            className="w-full rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none shadow focus:border-[#6666FF] transition"
            placeholder="Enter the comprehension question..."
            disabled={isLoading}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block mb-2 font-semibold text-[#00306E]">
            Tags
          </label>
          <div className="flex gap-3">
            {tagOptions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTags(t)}
                disabled={isLoading}
                className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                  tags === t
                    ? "border-[#6666FF] bg-[#6666FF]/10 text-[#6666FF] shadow"
                    : "border-[#E4F4FF] bg-white text-[#00306E]/60 hover:border-[#6666FF]/30"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {tags && (
            <div className="mt-2 rounded-lg bg-[#E4F4FF]/60 px-4 py-3 text-xs text-[#00306E]/70">
              {tags === "Literal" &&
                "Literal questions ask about information directly stated in the passage."}
              {tags === "Inferential" &&
                "Inferential questions require the reader to draw conclusions beyond what is explicitly stated."}
              {tags === "Critical" &&
                "Critical questions require the reader to evaluate, judge, or form opinions about the text."}
            </div>
          )}
        </div>

        {/* Question Type */}
        <div>
          <label className="block mb-2 font-semibold text-[#00306E]">
            Type
          </label>
          <div className="flex gap-3">
            {questionTypes.map((qt) => (
              <button
                key={qt.value}
                type="button"
                onClick={() => setType(qt.value)}
                disabled={isLoading}
                className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                  type === qt.value
                    ? "border-[#6666FF] bg-[#6666FF]/10 text-[#6666FF] shadow"
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
            <div>
              <label className="block mb-2 font-semibold text-[#00306E]">
                Options
              </label>
              <div className="flex flex-col gap-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 text-center text-sm font-semibold text-[#00306E]/50">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      className="flex-1 rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-2.5 text-sm text-[#00306E] outline-none shadow focus:border-[#6666FF] transition"
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
            <div>
              <label className="block mb-2 font-semibold text-[#00306E]">
                Correct Answer
              </label>
              <div className="relative">
                <select
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="w-full appearance-none rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none shadow focus:border-[#6666FF] transition"
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

        {/* Submit & Cancel */}
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
            {isLoading ? "Creating..." : "Create Question"}
          </button>
        </div>
      </form>
    </div>
  );
}

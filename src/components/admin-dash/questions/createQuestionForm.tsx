"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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

const emptyQuestion = {
  questionText: "",
  tags: "",
  type: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  error: "",
};

export function CreateQuestionForm({
  passageId,
  onSuccess,
}: {
  passageId: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState([{ ...emptyQuestion }]);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleQuestionChange = (idx: number, field: string, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value, error: "" } : q)),
    );
  };

  const handleOptionChange = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: q.options.map((opt, j) => (j === oIdx ? value : opt)),
              error: "",
            }
          : q,
      ),
    );
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx && q.options.length < 6
          ? { ...q, options: [...q.options, ""] }
          : q,
      ),
    );
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx || q.options.length <= 2) return q;
        const newOptions = q.options.filter((_, j) => j !== oIdx);
        const newCorrect =
          q.correctAnswer === q.options[oIdx] ? "" : q.correctAnswer;
        return { ...q, options: newOptions, correctAnswer: newCorrect };
      }),
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { ...emptyQuestion }]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCancel = () => {
    router.push(`/admin/passages/${passageId}`);
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError("");
      let hasError = false;
      const validated = questions.map((q) => {
        const error = validateForm(
          q.questionText,
          q.tags,
          q.type,
          q.options,
          q.correctAnswer,
        );
        if (error) hasError = true;
        return { ...q, error };
      });
      setQuestions(validated);
      if (hasError) {
        setFormError("Please fix errors in the questions before submitting.");
        return;
      }
      setIsLoading(true);
      try {
        for (const q of validated) {
          await addQuestionAction({
            passageId,
            questionText: q.questionText.trim(),
            tags: q.tags as "Literal" | "Inferential" | "Critical",
            type: q.type as "MULTIPLE_CHOICE" | "ESSAY",
            options:
              q.type === "MULTIPLE_CHOICE"
                ? q.options.filter(Boolean)
                : undefined,
            correctAnswer: q.correctAnswer || undefined,
          });
        }
        await queryClient.invalidateQueries({ queryKey: ["questions"] });
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/admin/passages/${passageId}`);
        }
      } catch (err) {
        setFormError(
          "Failed to create questions. " +
            (err instanceof Error ? err.message : ""),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [questions, passageId, onSuccess, router, queryClient],
  );

  return (
    <div className="w-full flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl flex flex-col gap-6 py-4"
      >
        {formError && (
          <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700 mb-2">
            {formError}
          </div>
        )}
        {questions.map((q, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-white border border-[#E4F4FF] shadow-lg flex flex-col gap-4 relative w-full px-3 py-5 sm:px-6 sm:py-7"
          >
            {questions.length > 1 && (
              <button
                type="button"
                onClick={() => removeQuestion(idx)}
                disabled={isLoading}
                className="absolute top-3 right-3 text-[#DE3B40]/60 hover:text-[#DE3B40] transition"
                title="Remove this question"
                aria-label="Remove question"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            {q.error && (
              <div className="rounded-lg bg-red-100 p-2 text-xs text-red-700 mb-2">
                {q.error}
              </div>
            )}
            <div>
              <label className="block mb-1 font-semibold text-[#00306E] text-[15px]">
                Question
              </label>
              <textarea
                value={q.questionText}
                onChange={(e) =>
                  handleQuestionChange(idx, "questionText", e.target.value)
                }
                rows={3}
                className="w-full rounded-lg border border-[#E4F4FF] bg-white px-3 py-2 text-sm text-[#00306E] outline-none shadow-sm focus:border-[#6666FF] transition"
                placeholder="Enter the comprehension question..."
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-[#00306E] text-[15px]">
                Tags
              </label>
              <div className="flex gap-2 flex-wrap">
                {tagOptions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleQuestionChange(idx, "tags", t)}
                    disabled={isLoading}
                    className={`flex-1 min-w-25 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                      q.tags === t
                        ? "border-[#6666FF] bg-[#6666FF]/10 text-[#6666FF] shadow"
                        : "border-[#E4F4FF] bg-white text-[#00306E]/60 hover:border-[#6666FF]/30"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {q.tags && (
                <div className="mt-1 rounded-lg bg-[#E4F4FF]/60 px-3 py-2 text-xs text-[#00306E]/70">
                  {q.tags === "Literal" &&
                    "Literal questions ask about information directly stated in the passage."}
                  {q.tags === "Inferential" &&
                    "Inferential questions require the reader to draw conclusions beyond what is explicitly stated."}
                  {q.tags === "Critical" &&
                    "Critical questions require the reader to evaluate, judge, or form opinions about the text."}
                </div>
              )}
            </div>
            <div>
              <label className="block mb-1 font-semibold text-[#00306E] text-[15px]">
                Type
              </label>
              <div className="flex gap-2 flex-wrap">
                {questionTypes.map((qt) => (
                  <button
                    key={qt.value}
                    type="button"
                    onClick={() => handleQuestionChange(idx, "type", qt.value)}
                    disabled={isLoading}
                    className={`flex-1 min-w-25 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                      q.type === qt.value
                        ? "border-[#6666FF] bg-[#6666FF]/10 text-[#6666FF] shadow"
                        : "border-[#E4F4FF] bg-white text-[#00306E]/60 hover:border-[#6666FF]/30"
                    }`}
                  >
                    {qt.label}
                  </button>
                ))}
              </div>
            </div>
            {q.type === "ESSAY" && (
              <div>
                <label className="block mb-1 font-semibold text-[#00306E] text-[15px]">
                  Expected Answer
                </label>
                <textarea
                  value={q.correctAnswer}
                  onChange={(e) =>
                    handleQuestionChange(idx, "correctAnswer", e.target.value)
                  }
                  rows={3}
                  className="w-full rounded-lg border border-[#E4F4FF] bg-white px-3 py-2 text-sm text-[#00306E] outline-none shadow-sm focus:border-[#6666FF] transition"
                  placeholder="Enter the expected answer or key points for AI grading..."
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-[#00306E]/50">
                  This will be used as a basis for AI grading of student responses.
                </p>
              </div>
            )}
            {q.type === "MULTIPLE_CHOICE" && (
              <>
                <div>
                  <label className="block mb-1 font-semibold text-[#00306E] text-[15px]">
                    Options
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <span className="w-5 text-center text-xs font-semibold text-[#00306E]/50">
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) =>
                            handleOptionChange(idx, oIdx, e.target.value)
                          }
                          className="flex-1 rounded-lg border border-[#E4F4FF] bg-white px-3 py-1.5 text-xs text-[#00306E] outline-none shadow-sm focus:border-[#6666FF] transition"
                          placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                          disabled={isLoading}
                        />
                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(idx, oIdx)}
                            disabled={isLoading}
                            aria-label={`Remove option ${String.fromCharCode(65 + oIdx)}`}
                            title="Remove option"
                            className="text-[#DE3B40]/60 transition-colors hover:text-[#DE3B40] disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {q.options.length < 6 && (
                      <button
                        type="button"
                        onClick={() => addOption(idx)}
                        disabled={isLoading}
                        className="flex items-center gap-1 self-start rounded-lg px-2 py-1 text-xs font-medium text-[#6666FF] transition-colors hover:bg-[#6666FF]/10 disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Option
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor={`correctAnswer-${idx}`}
                    className="block mb-1 font-semibold text-[#00306E] text-[15px]"
                  >
                    Correct Answer
                  </label>
                  <div className="relative">
                    <select
                      id={`correctAnswer-${idx}`}
                      name="correctAnswer"
                      value={q.correctAnswer}
                      onChange={(e) =>
                        handleQuestionChange(
                          idx,
                          "correctAnswer",
                          e.target.value,
                        )
                      }
                      className="w-full appearance-none rounded-lg border border-[#E4F4FF] bg-white px-3 py-2 text-sm text-[#00306E] outline-none shadow-sm focus:border-[#6666FF] transition"
                      disabled={isLoading}
                    >
                      <option value="">Select correct answer</option>
                      {q.options.filter(Boolean).map((opt, oIdx) => (
                        <option key={oIdx} value={opt}>
                          {String.fromCharCode(65 + oIdx)}. {opt}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#00306E]/50" />
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 px-1 sm:px-2">
          <button
            type="button"
            onClick={addQuestion}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-[#2E2E68] border border-[#2E2E68] bg-white hover:bg-[#F0F4FF] transition-all disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
            Add Another Question
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="rounded-lg px-7 py-2.5 text-sm font-semibold text-[#2E2E68] border border-[#2E2E68] bg-white hover:bg-[#F0F4FF] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#2E2E68] rounded-lg px-8 py-2.5 text-sm font-semibold text-white shadow transition-all hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create All Questions"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

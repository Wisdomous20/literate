"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { updateQuestionAction } from "@/app/actions/admin/updateQuestion";
import { useQueryClient } from "@tanstack/react-query";

interface Question {
  id: string;
  questionText: string;
  tags: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
  passageId?: string;
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
  const queryClient = useQueryClient();
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

  useEffect(() => {
    const hasTextChanged = questionText !== question.questionText;
    const hasTagsChanged = tags !== question.tags;
    const hasTypeChanged = type !== question.type;
    const hasOptionsChanged =
      question.type === "MULTIPLE_CHOICE" &&
      JSON.stringify(options) !==
        JSON.stringify(question.options || ["", "", "", ""]);
    const hasAnswerChanged =
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
          correctAnswer: correctAnswer || undefined,
        });

        await queryClient.invalidateQueries({ queryKey: ["questions"] });
        await queryClient.invalidateQueries({
          queryKey: ["question", question.id],
        });
        if (question.passageId) {
          await queryClient.invalidateQueries({
            queryKey: ["questions", question.passageId],
          });
        }

        if (onSuccess) {
          onSuccess();
        } else if (question.passageId) {
          router.push(`/admin/passages/${question.passageId}`);
        } else {
          setError("Passage ID not found for this question.");
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
    [
      questionText,
      tags,
      type,
      options,
      correctAnswer,
      question.id,
      question.passageId,
      router,
      onSuccess,
      queryClient,
    ],
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
    <div className="w-full flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl flex flex-col gap-6 py-4"
      >
        {error && (
          <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700 mb-2">
            {error}
          </div>
        )}

        {!hasChanges && (
          <div className="rounded-lg bg-blue-100 p-3 text-sm text-blue-700 mb-2">
            No changes made yet.
          </div>
        )}

        <div className="rounded-2xl bg-white border border-[#E4F4FF] shadow-lg flex flex-col gap-4 relative w-full px-3 py-5 sm:px-6 sm:py-7">
          <div>
            <label className="block mb-1 font-semibold text-[#00306E] text-[15px]">
              Question
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
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
                  onClick={() => setTags(t)}
                  disabled={isLoading}
                  className={`flex-1 min-w-25 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
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
              <div className="mt-1 rounded-lg bg-[#E4F4FF]/60 px-3 py-2 text-xs text-[#00306E]/70">
                {tags === "Literal" &&
                  "Literal questions ask about information directly stated in the passage."}
                {tags === "Inferential" &&
                  "Inferential questions require the reader to draw conclusions beyond what is explicitly stated."}
                {tags === "Critical" &&
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
                  onClick={() => setType(qt.value)}
                  disabled={isLoading}
                  className={`flex-1 min-w-25 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
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

          {type === "ESSAY" && (
            <div>
              <label className="block mb-1 font-semibold text-[#00306E] text-[15px]">
                Expected Answer
              </label>
              <textarea
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
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
          {type === "MULTIPLE_CHOICE" && (
            <>
              <div>
                <label className="block mb-1 font-semibold text-[#00306E] text-[15px]">
                  Options
                </label>
                <div className="flex flex-col gap-1.5">
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 text-center text-xs font-semibold text-[#00306E]/50">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(i, e.target.value)}
                        className="flex-1 rounded-lg border border-[#E4F4FF] bg-white px-3 py-1.5 text-xs text-[#00306E] outline-none shadow-sm focus:border-[#6666FF] transition"
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
                  htmlFor="correctAnswer"
                  className="block mb-1 font-semibold text-[#00306E] text-[15px]"
                >
                  Correct Answer
                </label>
                <div className="relative">
                  <select
                    id="correctAnswer"
                    name="correctAnswer"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-[#E4F4FF] bg-white px-3 py-2 text-sm text-[#00306E] outline-none shadow-sm focus:border-[#6666FF] transition"
                    disabled={isLoading}
                  >
                    <option value="">Select correct answer</option>
                    {options.filter(Boolean).map((opt, i) => (
                      <option key={i} value={opt}>
                        {String.fromCharCode(65 + i)}. {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#00306E]/50" />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-end gap-3 px-1 sm:px-2">
          <Link
            href={
              question.passageId
                ? `/admin/passages/${question.passageId}`
                : "/admin/passages"
            }
            className="rounded-lg px-7 py-2.5 text-sm font-semibold text-[#2E2E68] border border-[#2E2E68] bg-white hover:bg-[#F0F4FF] transition-all text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading || !hasChanges}
            className="bg-[#2E2E68] rounded-lg px-8 py-2.5 text-sm font-semibold text-white shadow transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
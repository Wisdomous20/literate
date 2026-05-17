"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronDown,
  FilePenLine,
  ListChecks,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { updateQuestionAction } from "@/app/actions/admin/updateQuestion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  questionText: string;
  passageTitle: string;
  tags: "Literal" | "Inferential" | "Critical";
  type: "MULTIPLE_CHOICE" | "ESSAY";
  passageLevel: number;
  language: "Filipino" | "English";
  options?: string[];
  correctAnswer?: string | null;
}

interface QuestionTableProps {
  questions: Question[];
  onDelete: (id: string) => void;
  isDeleting?: string | null;
}

const tagOptions = ["Literal", "Inferential", "Critical"] as const;
const questionTypes = [
  { label: "Multiple Choice", value: "MULTIPLE_CHOICE" },
  { label: "Essay", value: "ESSAY" },
] as const;

export function QuestionTable({
  questions,
  onDelete,
  isDeleting,
}: QuestionTableProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<
    "all" | "Literal" | "Inferential" | "Critical"
  >("all");
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(
    questions[0]?.id ?? null
  );
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const editingQuestion =
    questions.find((question) => question.id === editingQuestionId) ?? null;

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.questionText
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTag = tagFilter === "all" || q.tags === tagFilter;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4">
        <label htmlFor="questionSearch" className="sr-only">
          Search questions
        </label>
        <input
          id="questionSearch"
          name="questionSearch"
          type="text"
          placeholder="Search question..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-h-11 rounded-full border border-[#D9E6F6] bg-[#F8FBFE] px-4 py-2 text-sm text-[#16324F] outline-none transition focus:border-[#2453A6]"
        />

        <label htmlFor="tagFilter" className="sr-only">
          Filter by tag
        </label>
        <select
          id="tagFilter"
          name="tagFilter"
          value={tagFilter}
          onChange={(e) => {
            const value = e.target.value;
            if (
              value === "all" ||
              value === "Literal" ||
              value === "Inferential" ||
              value === "Critical"
            ) {
              setTagFilter(value);
            }
          }}
          className="min-h-11 rounded-full border border-[#D9E6F6] bg-white px-4 py-2 text-sm text-[#16324F] outline-none transition focus:border-[#2453A6]"
        >
          <option value="all">All Tags</option>
          <option value="Literal">Literal</option>
          <option value="Inferential">Inferential</option>
          <option value="Critical">Critical</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#D2E2F4] bg-[#F8FBFE] px-4 py-10 text-center text-sm text-[#64809F]">
            No questions found.
          </div>
        ) : (
          filteredQuestions.map((question, index) => {
            const isExpanded = expandedQuestionId === question.id;

            return (
              <article
                key={question.id}
                className="overflow-hidden rounded-[24px] border border-[#DCE7F5] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFE_100%)] shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setExpandedQuestionId((current) =>
                      current === question.id ? null : question.id
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setExpandedQuestionId((current) =>
                        current === question.id ? null : question.id
                      );
                    }
                  }}
                  className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#0C2D57] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                        Q{index + 1}
                      </span>
                      <span className="rounded-full bg-[#EEF4FF] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2453A6]">
                        {question.tags}
                      </span>
                      <span className="rounded-full bg-[#EFFBF4] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#15803D]">
                        {question.type === "MULTIPLE_CHOICE"
                          ? "Multiple Choice"
                          : "Essay"}
                      </span>
                    </div>
                    <h4 className="mt-3 text-base font-semibold leading-7 text-[#102A43]">
                      {question.questionText}
                    </h4>
                    <p className="mt-2 text-xs uppercase tracking-[0.08em] text-[#7B92AC]">
                      {question.language} / {question.passageTitle}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-start gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditingQuestionId(question.id);
                      }}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#0C2D57] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163D70]"
                    >
                      <FilePenLine className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(question.id);
                      }}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      disabled={isDeleting === question.id}
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting === question.id ? "Deleting..." : "Delete"}
                    </button>
                    <ChevronDown
                      className={cn(
                        "mt-2 h-5 w-5 shrink-0 text-[#2453A6] transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-[#E8EFF8] px-5 py-5">
                    <div className="space-y-4">
                      {question.type === "MULTIPLE_CHOICE" ? (
                        <div className="rounded-[20px] border border-[#DCE7F5] bg-white p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-[#16324F]">
                            <ListChecks className="h-4 w-4 text-[#2453A6]" />
                            Answer options
                          </div>
                          <ul className="mt-3 space-y-2">
                            {(question.options ?? []).map((option, optionIndex) => {
                              const isCorrect = question.correctAnswer === option;

                              return (
                                <li
                                  key={`${question.id}-${optionIndex}`}
                                  className={cn(
                                    "rounded-2xl border px-3 py-3 text-sm",
                                    isCorrect
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                      : "border-[#E3ECF7] bg-[#F8FBFE] text-[#33507A]"
                                  )}
                                >
                                  <span className="font-semibold">
                                    {String.fromCharCode(65 + optionIndex)}.
                                  </span>{" "}
                                  {option}
                                  {isCorrect && (
                                    <span className="ml-2 text-xs font-bold uppercase tracking-[0.08em]">
                                      Correct
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ) : (
                        <div className="rounded-[20px] border border-[#DCE7F5] bg-white p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-[#16324F]">
                            <BookOpen className="h-4 w-4 text-[#2453A6]" />
                            Expected answer
                          </div>
                          <p className="mt-3 text-sm leading-7 text-[#33507A]">
                            {question.correctAnswer?.trim() || "No expected answer provided."}
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      <Dialog
        open={!!editingQuestion}
        onOpenChange={(open) => {
          if (!open) {
            setEditingQuestionId(null);
          }
        }}
      >
        {editingQuestion && (
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-[28px] border border-[#DCE7F5] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFE_100%)] p-0 shadow-[0_24px_64px_rgba(15,23,42,0.16)]">
            <DialogHeader className="border-b border-[#E8EFF8] px-6 py-5">
              <DialogTitle className="text-xl font-semibold text-[#102A43]">
                Edit question
              </DialogTitle>
              <p className="text-sm leading-7 text-[#64809F]">
                Update the question here without leaving the question page.
              </p>
            </DialogHeader>

            <div className="px-6 py-6">
              <QuestionEditorForm
                question={editingQuestion}
                onCancel={() => setEditingQuestionId(null)}
                onSaved={async () => {
                  setEditingQuestionId(null);
                  await queryClient.invalidateQueries({
                    queryKey: ["questions"],
                  });
                  await queryClient.invalidateQueries({
                    queryKey: ["question", editingQuestion.id],
                  });
                }}
              />
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function QuestionEditorForm({
  question,
  onCancel,
  onSaved,
}: {
  question: Question;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [questionText, setQuestionText] = useState(question.questionText);
  const [tags, setTags] = useState<Question["tags"]>(question.tags);
  const [type, setType] = useState<Question["type"]>(question.type);
  const [options, setOptions] = useState<string[]>(
    question.type === "MULTIPLE_CHOICE" && question.options?.length
      ? question.options
      : ["", "", "", ""]
  );
  const [correctAnswer, setCorrectAnswer] = useState(question.correctAnswer ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setQuestionText(question.questionText);
    setTags(question.tags);
    setType(question.type);
    setOptions(
      question.type === "MULTIPLE_CHOICE" && question.options?.length
        ? question.options
        : ["", "", "", ""]
    );
    setCorrectAnswer(question.correctAnswer ?? "");
  }, [question]);

  const hasChanges =
    questionText !== question.questionText ||
    tags !== question.tags ||
    type !== question.type ||
    JSON.stringify(options) !==
      JSON.stringify(
        question.type === "MULTIPLE_CHOICE" && question.options?.length
          ? question.options
          : ["", "", "", ""]
      ) ||
    correctAnswer !== (question.correctAnswer ?? "");

  function handleOptionChange(index: number, value: string) {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  }

  function addOption() {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  }

  function removeOption(index: number) {
    if (options.length <= 2) {
      return;
    }

    const removed = options[index];
    const next = options.filter((_, optionIndex) => optionIndex !== index);
    setOptions(next);

    if (correctAnswer === removed) {
      setCorrectAnswer("");
    }
  }

  async function handleSave() {
    setError("");

    if (!questionText.trim() || !tags || !type) {
      setError("Please fill in all required fields.");
      return;
    }

    if (type === "MULTIPLE_CHOICE") {
      const filledOptions = options.filter(Boolean);
      if (filledOptions.length < 2) {
        setError("Please provide at least 2 options.");
        return;
      }
      if (!correctAnswer) {
        setError("Please select a correct answer.");
        return;
      }
    }

    setIsSaving(true);

    try {
      await updateQuestionAction({
        id: question.id,
        questionText: questionText.trim(),
        tags,
        type,
        options: type === "MULTIPLE_CHOICE" ? options.filter(Boolean) : undefined,
        correctAnswer:
          type === "MULTIPLE_CHOICE" || correctAnswer.trim()
            ? correctAnswer || undefined
            : undefined,
      });

      await onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update question."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className={cn("grid gap-4", error && "mt-4")}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#16324F]">
            Question
          </label>
          <textarea
            value={questionText}
            onChange={(event) => setQuestionText(event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-[#D6E3F8] bg-white px-4 py-3 text-sm text-[#16324F] outline-none transition focus:border-[#2453A6]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#16324F]">
            Tag
          </label>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map((tagOption) => (
              <button
                key={tagOption}
                type="button"
                onClick={() => setTags(tagOption)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  tags === tagOption
                    ? "border-[#2453A6] bg-[#EEF4FF] text-[#2453A6]"
                    : "border-[#D6E3F8] bg-white text-[#33507A] hover:bg-[#EEF5FF]"
                )}
              >
                {tagOption}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#16324F]">
            Type
          </label>
          <div className="flex flex-wrap gap-2">
            {questionTypes.map((questionType) => (
              <button
                key={questionType.value}
                type="button"
                onClick={() => setType(questionType.value)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  type === questionType.value
                    ? "border-[#2453A6] bg-[#EEF4FF] text-[#2453A6]"
                    : "border-[#D6E3F8] bg-white text-[#33507A] hover:bg-[#EEF5FF]"
                )}
              >
                {questionType.label}
              </button>
            ))}
          </div>
        </div>

        {type === "MULTIPLE_CHOICE" ? (
          <>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#16324F]">
                Options
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={`${question.id}-option-${index}`} className="flex items-center gap-2">
                    <span className="w-6 text-center text-xs font-semibold text-[#64809F]">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(event) =>
                        handleOptionChange(index, event.target.value)
                      }
                      className="min-h-11 flex-1 rounded-2xl border border-[#D6E3F8] bg-white px-4 py-2 text-sm text-[#16324F] outline-none transition focus:border-[#2453A6]"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D6E3F8] bg-white px-4 py-2 text-sm font-semibold text-[#2453A6] transition hover:bg-[#EEF5FF]"
                >
                  <Plus className="h-4 w-4" />
                  Add option
                </button>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#16324F]">
                Correct Answer
              </label>
              <select
                value={correctAnswer}
                onChange={(event) => setCorrectAnswer(event.target.value)}
                className="min-h-11 w-full rounded-2xl border border-[#D6E3F8] bg-white px-4 py-3 text-sm text-[#16324F] outline-none transition focus:border-[#2453A6]"
              >
                <option value="">Select correct answer</option>
                {options.filter(Boolean).map((option, index) => (
                  <option key={`${question.id}-answer-${index}`} value={option}>
                    {String.fromCharCode(65 + index)}. {option}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#16324F]">
              Expected Answer
            </label>
            <textarea
              value={correctAnswer}
              onChange={(event) => setCorrectAnswer(event.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-[#D6E3F8] bg-white px-4 py-3 text-sm text-[#16324F] outline-none transition focus:border-[#2453A6]"
            />
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#D6E3F8] bg-white px-4 py-2 text-sm font-semibold text-[#16324F] transition hover:bg-[#EEF5FF]"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving || !hasChanges}
          className={cn(
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition",
            isSaving || !hasChanges
              ? "cursor-not-allowed bg-[#7C93B2]"
              : "bg-[#0C2D57] hover:bg-[#163D70]"
          )}
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

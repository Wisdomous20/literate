"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, FileText, Plus } from "lucide-react";
import { PassageWorkspaceHeader } from "@/components/admin-dash/passages/passageWorkspaceHeader";
import { QuestionTable } from "@/components/admin-dash/questions/questionTable";
import { usePassageById } from "@/lib/hooks/usePassageById";
import { useQuestionList } from "@/lib/hooks/useQuestionList";
import { deleteQuestionAction } from "@/app/actions/admin/deleteQuestion";
import { addQuestionAction } from "@/app/actions/admin/addQuestion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AllowedTag = "Literal" | "Inferential" | "Critical";
type AllowedLanguage = "Filipino" | "English";

interface RawQuestion {
  id: string;
  questionText: string;
  passageTitle: string;
  tags: string;
  type: "MULTIPLE_CHOICE" | "ESSAY";
  passageLevel: number;
  language: AllowedLanguage;
  passageId?: string | number | null;
  options?: string[];
  correctAnswer?: string | null;
}

interface MappedQuestion {
  id: string;
  questionText: string;
  passageTitle: string;
  tags: AllowedTag;
  type: "MULTIPLE_CHOICE" | "ESSAY";
  passageLevel: number;
  language: AllowedLanguage;
  passageId?: string | number | null;
  options?: string[];
  correctAnswer?: string | null;
}

function isAllowedTag(tag: string): tag is AllowedTag {
  return tag === "Literal" || tag === "Inferential" || tag === "Critical";
}

export default function PassageQuestionsPage() {
  const params = useParams();
  const passageId = params.id as string;
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    data: passage,
    isLoading: isLoadingPassage,
    error: errorPassage,
  } = usePassageById(passageId);

  const {
    data: allQuestions = [],
    isLoading: isLoadingQuestions,
    error: errorQuestions,
  } = useQuestionList();

  const questions = (allQuestions as RawQuestion[]).filter(
    (question) => question.passageId?.toString() === passageId.toString()
  );

  const mappedQuestions: MappedQuestion[] = questions.map((question) => ({
    ...question,
    tags: isAllowedTag(question.tags) ? question.tags : "Literal",
  }));

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    setIsDeleting(id);

    try {
      await deleteQuestionAction({ id });
      await queryClient.invalidateQueries({ queryKey: ["questions"] });
    } catch (err) {
      alert("Failed to delete question. " + (err instanceof Error ? err.message : ""));
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoadingPassage) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-[#F4FCFD]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#31318A] border-t-transparent" />
          <span className="text-sm font-medium text-[#00306E]/60">
            Loading passage...
          </span>
        </div>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4FCFD]">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          {errorPassage?.message || "Passage not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(124,198,254,0.14),transparent_22%),linear-gradient(180deg,#F4F8FC_0%,#EDF3F9_100%)]">
      <PassageWorkspaceHeader
        passageId={passageId}
        title={passage.title}
        active="questions"
        action={
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0C2D57] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#163D70]"
          >
            <Plus className="h-4 w-4" />
            Create Question
          </button>
        }
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[28px] border border-[#D9E5F5] bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7B92AC]">
                Questions
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[#0F2744]">
                Toggle through question details
              </h2>
              <p className="mt-1 text-sm leading-7 text-[#64809F]">
                Each question expands in-place so the list itself acts as the view.
              </p>
            </div>
            <span className="rounded-full bg-[#F4F8FD] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#33507A]">
              {isLoadingQuestions
                ? "Loading..."
                : `${mappedQuestions.length} question${mappedQuestions.length !== 1 ? "s" : ""}`}
            </span>
          </div>
        </section>

        <section className="overflow-hidden rounded-[30px] border border-[#D9E5F5] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
          <div className="border-b border-[#E7EEF7] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2453A6]">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7B92AC]">
                  Question Directory
                </p>
                <p className="text-sm text-[#64809F]">
                  Filter, expand, edit, and delete questions for this passage.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {errorQuestions ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorQuestions.message || "Failed to load questions"}
              </div>
            ) : isLoadingQuestions ? (
              <div className="flex h-40 flex-col items-center justify-center gap-3">
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-[#31318A] border-t-transparent" />
                <span className="text-sm text-[#00306E]/50">Loading questions...</span>
              </div>
            ) : mappedQuestions.length === 0 ? (
              <div className="flex h-44 flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F4FF]">
                  <FileText className="h-6 w-6 text-[#31318A]/40" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#00306E]/60">
                    No questions yet
                  </p>
                  <p className="mt-1 text-xs text-[#00306E]/40">
                    Use create question to add the first one for this passage.
                  </p>
                </div>
              </div>
            ) : (
              <QuestionTable
                questions={mappedQuestions}
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            )}
          </div>
        </section>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-[28px] border border-[#DCE7F5] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFE_100%)] p-0 shadow-[0_24px_64px_rgba(15,23,42,0.16)]">
          <DialogHeader className="border-b border-[#E8EFF8] px-6 py-5">
            <DialogTitle className="text-xl font-semibold text-[#102A43]">
              Create question
            </DialogTitle>
            <p className="text-sm leading-7 text-[#64809F]">
              Add one or more questions without leaving this passage page.
            </p>
          </DialogHeader>

          <div className="px-6 py-6">
            <CreateQuestionModalForm
              passageId={passageId}
              onCancel={() => setIsCreateModalOpen(false)}
              onCreated={async () => {
                setIsCreateModalOpen(false);
                await queryClient.invalidateQueries({ queryKey: ["questions"] });
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const tagOptions = ["Literal", "Inferential", "Critical"] as const;
const questionTypes = [
  { label: "Multiple Choice", value: "MULTIPLE_CHOICE" },
  { label: "Essay", value: "ESSAY" },
] as const;

const emptyQuestion = {
  questionText: "",
  tags: "",
  type: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  error: "",
};

function CreateQuestionModalForm({
  passageId,
  onCancel,
  onCreated,
}: {
  passageId: string;
  onCancel: () => void;
  onCreated: () => Promise<void>;
}) {
  const [questions, setQuestions] = useState([{ ...emptyQuestion }]);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  function handleQuestionChange(
    index: number,
    field: string,
    value: string
  ) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index
          ? { ...question, [field]: value, error: "" }
          : question
      )
    );
  }

  function handleOptionChange(
    questionIndex: number,
    optionIndex: number,
    value: string
  ) {
    setQuestions((current) =>
      current.map((question, currentIndex) =>
        currentIndex === questionIndex
          ? {
              ...question,
              options: question.options.map((option, currentOptionIndex) =>
                currentOptionIndex === optionIndex ? value : option
              ),
              error: "",
            }
          : question
      )
    );
  }

  function addOption(questionIndex: number) {
    setQuestions((current) =>
      current.map((question, currentIndex) =>
        currentIndex === questionIndex && question.options.length < 6
          ? { ...question, options: [...question.options, ""] }
          : question
      )
    );
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    setQuestions((current) =>
      current.map((question, currentIndex) => {
        if (currentIndex !== questionIndex || question.options.length <= 2) {
          return question;
        }

        const nextOptions = question.options.filter(
          (_, currentOptionIndex) => currentOptionIndex !== optionIndex
        );
        const nextCorrectAnswer =
          question.correctAnswer === question.options[optionIndex]
            ? ""
            : question.correctAnswer;

        return {
          ...question,
          options: nextOptions,
          correctAnswer: nextCorrectAnswer,
        };
      })
    );
  }

  function addQuestion() {
    setQuestions((current) => [...current, { ...emptyQuestion }]);
  }

  function removeQuestion(index: number) {
    setQuestions((current) =>
      current.length === 1
        ? current
        : current.filter((_, currentIndex) => currentIndex !== index)
    );
  }

  function validateQuestion(question: (typeof questions)[number]) {
    if (!question.questionText.trim()) return "Question text is required";
    if (question.questionText.trim().length < 5) {
      return "Question must be at least 5 characters";
    }
    if (!question.tags) return "Please select a tag";
    if (!question.type) return "Please select a question type";
    if (question.type === "MULTIPLE_CHOICE") {
      const filledOptions = question.options.filter(Boolean);
      if (filledOptions.length < 2) return "Provide at least 2 options";
      if (!question.correctAnswer) return "Select a correct answer";
      if (!filledOptions.includes(question.correctAnswer)) {
        return "Correct answer must match one of the options";
      }
    }
    return "";
  }

  async function handleSubmit() {
    setFormError("");

    let hasError = false;
    const validated = questions.map((question) => {
      const error = validateQuestion(question);
      if (error) hasError = true;
      return { ...question, error };
    });

    setQuestions(validated);

    if (hasError) {
      setFormError("Please fix the question errors before submitting.");
      return;
    }

    setIsLoading(true);

    try {
      for (const question of validated) {
        await addQuestionAction({
          passageId,
          questionText: question.questionText.trim(),
          tags: question.tags as "Literal" | "Inferential" | "Critical",
          type: question.type as "MULTIPLE_CHOICE" | "ESSAY",
          options:
            question.type === "MULTIPLE_CHOICE"
              ? question.options.filter(Boolean)
              : undefined,
          correctAnswer: question.correctAnswer || undefined,
        });
      }

      await onCreated();
    } catch (error) {
      setFormError(
        "Failed to create questions. " +
          (error instanceof Error ? error.message : "")
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      {formError && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <div className="space-y-5">
        {questions.map((question, index) => (
          <div
            key={index}
            className="rounded-[24px] border border-[#DCE7F5] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7B92AC]">
                  New Question
                </p>
                <h4 className="mt-1 text-lg font-semibold text-[#102A43]">
                  Question {index + 1}
                </h4>
              </div>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100"
                >
                  <span className="sr-only">Remove question</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </button>
              )}
            </div>

            {question.error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {question.error}
              </div>
            )}

            <div className="mt-5 grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#16324F]">
                  Question
                </label>
                <textarea
                  value={question.questionText}
                  onChange={(event) =>
                    handleQuestionChange(index, "questionText", event.target.value)
                  }
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
                      onClick={() => handleQuestionChange(index, "tags", tagOption)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-semibold transition",
                        question.tags === tagOption
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
                      onClick={() =>
                        handleQuestionChange(index, "type", questionType.value)
                      }
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-semibold transition",
                        question.type === questionType.value
                          ? "border-[#2453A6] bg-[#EEF4FF] text-[#2453A6]"
                          : "border-[#D6E3F8] bg-white text-[#33507A] hover:bg-[#EEF5FF]"
                      )}
                    >
                      {questionType.label}
                    </button>
                  ))}
                </div>
              </div>

              {question.type === "ESSAY" && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#16324F]">
                    Expected Answer
                  </label>
                  <textarea
                    value={question.correctAnswer}
                    onChange={(event) =>
                      handleQuestionChange(
                        index,
                        "correctAnswer",
                        event.target.value
                      )
                    }
                    rows={3}
                    className="w-full rounded-2xl border border-[#D6E3F8] bg-white px-4 py-3 text-sm text-[#16324F] outline-none transition focus:border-[#2453A6]"
                  />
                </div>
              )}

              {question.type === "MULTIPLE_CHOICE" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#16324F]">
                      Options
                    </label>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <span className="w-6 text-center text-xs font-semibold text-[#64809F]">
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <input
                            type="text"
                            value={option}
                            onChange={(event) =>
                              handleOptionChange(
                                index,
                                optionIndex,
                                event.target.value
                              )
                            }
                            className="min-h-11 flex-1 rounded-2xl border border-[#D6E3F8] bg-white px-4 py-2 text-sm text-[#16324F] outline-none transition focus:border-[#2453A6]"
                          />
                          {question.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(index, optionIndex)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100"
                            >
                              <span className="sr-only">Remove option</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {question.options.length < 6 && (
                      <button
                        type="button"
                        onClick={() => addOption(index)}
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
                      value={question.correctAnswer}
                      onChange={(event) =>
                        handleQuestionChange(
                          index,
                          "correctAnswer",
                          event.target.value
                        )
                      }
                      className="min-h-11 w-full rounded-2xl border border-[#D6E3F8] bg-white px-4 py-3 text-sm text-[#16324F] outline-none transition focus:border-[#2453A6]"
                    >
                      <option value="">Select correct answer</option>
                      {question.options.filter(Boolean).map((option, optionIndex) => (
                        <option key={optionIndex} value={option}>
                          {String.fromCharCode(65 + optionIndex)}. {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={addQuestion}
          disabled={isLoading}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#D6E3F8] bg-white px-4 py-2 text-sm font-semibold text-[#2453A6] transition hover:bg-[#EEF5FF]"
        >
          <Plus className="h-4 w-4" />
          Add another question
        </button>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#D6E3F8] bg-white px-4 py-2 text-sm font-semibold text-[#16324F] transition hover:bg-[#EEF5FF]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isLoading}
            className={cn(
              "inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white transition",
              isLoading
                ? "cursor-not-allowed bg-[#7C93B2]"
                : "bg-[#0C2D57] hover:bg-[#163D70]"
            )}
          >
            {isLoading ? "Creating..." : "Create questions"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useQuestionById } from "@/lib/hooks/useQuestionById";
import { usePassageById } from "@/lib/hooks/usePassageById";

export function ViewQuestionDetails({
  questionId,
  passageId,
}: {
  questionId: string;
  passageId: string;
}) {
  const {
    data: question,
    isLoading: isLoadingQuestion,
    error: errorQuestion,
  } = useQuestionById(questionId);

  const {
    data: passage,
    isLoading: isLoadingPassage,
    error: errorPassage,
  } = usePassageById(passageId);

  if (isLoadingQuestion) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-[#F4FCFD]">
        <span className="text-[#00306E]/60">Loading question...</span>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-[#F4FCFD]">
        <div className="rounded-lg bg-red-100 p-6 text-sm text-red-700">
          {errorQuestion?.message || "Question not found"}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Question Details */}
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-[#E4F4FF]">
        <h2 className="text-xl font-bold mb-4 text-[#2E2E68]">
          Question Details
        </h2>
        <div className="mb-2">
          <span className="font-semibold text-[#00306E]">Question:</span>
          <div className="mt-1 text-[#00306E]">{question.questionText}</div>
        </div>
        <div className="mb-2">
          <span className="font-semibold text-[#00306E]">Tag:</span>{" "}
          {question.tags}
        </div>
        <div className="mb-2">
          <span className="font-semibold text-[#00306E]">Type:</span>{" "}
          {question.type === "MULTIPLE_CHOICE" ? "Multiple Choice" : "Essay"}
        </div>
        {question.type === "MULTIPLE_CHOICE" && question.options && (
          <div className="mb-2">
            <span className="font-semibold text-[#00306E]">Options:</span>
            <ul className="list-disc ml-6 mt-1">
              {question.options.map((opt: string, idx: number) => (
                <li key={idx}>
                  {String.fromCharCode(65 + idx)}. {opt}
                  {question.correctAnswer === opt && (
                    <span className="ml-2 text-green-600 font-bold">
                      (Correct)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {question.type === "ESSAY" && (
          <div className="mb-2 text-[#00306E]/70 italic">
            Essay question (no options)
          </div>
        )}

        {/* Passage Name (plain text) */}
        <div className="mt-4 pt-4 border-t border-[#E4F4FF]">
          <span className="font-semibold text-[#00306E]">Passage:</span>{" "}
          {isLoadingPassage ? (
            <span className="text-[#00306E]/60">Loading...</span>
          ) : passage ? (
            <span className="text-[#00306E]">{passage.title}</span>
          ) : (
            <span className="text-red-600">
              {errorPassage?.message || "Passage not found."}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

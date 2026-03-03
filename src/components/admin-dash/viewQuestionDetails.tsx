"use client";

import { useEffect, useState } from "react";
import { getQuestionByIdAction } from "@/app/actions/comprehension-Test/getQuestionById";
import { getPassageByIdAction } from "@/app/actions/passage/getPassageById";

export function ViewQuestionDetails({ questionId }: { questionId: string }) {
  const [question, setQuestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [passage, setPassage] = useState<any>(null);
  const [isLoadingPassage, setIsLoadingPassage] = useState(true);

  useEffect(() => {
    if (!questionId) {
      setError("No question ID provided.");
      setIsLoading(false);
      return;
    }
    async function fetchQuestion() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getQuestionByIdAction({ id: questionId });
        if (data) {
          setQuestion(data);
        } else {
          setError("Question not found");
        }
      } catch {
        setError("Failed to load question");
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuestion();
  }, [questionId]);

  useEffect(() => {
    if (question && question.passageId) {
      setIsLoadingPassage(true);
      getPassageByIdAction({ id: question.passageId })
        .then((data) => setPassage(data))
        .finally(() => setIsLoadingPassage(false));
    }
  }, [question]);

  if (isLoading) {
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
          {error || "Question not found"}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Passage Details */}
      {isLoadingPassage ? (
        <div className="mb-4 text-[#00306E]/60">Loading passage details...</div>
      ) : passage ? (
        <div className="mb-4 p-4 rounded-lg bg-[#F4FCFD] border border-[#E4F4FF]">
          <div className="font-bold text-[#2E2E68]">{passage.title}</div>
          <div className="text-xs text-[#00306E]/70">
            {passage.language} •{" "}
            {passage.level === 0 ? "Kindergarten" : `Grade ${passage.level}`}
          </div>
          <div className="text-xs text-[#00306E]/50 mt-1">
            {passage.content?.slice(0, 100)}...
          </div>
        </div>
      ) : (
        <div className="mb-4 text-red-600">Passage not found.</div>
      )}
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
      </div>
    </div>
  );
}

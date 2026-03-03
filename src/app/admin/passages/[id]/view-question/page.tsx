"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getQuestionByIdAction } from "@/app/actions/comprehension-Test/getQuestionById";
import { ChevronLeft } from "lucide-react";

export default function ViewQuestionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionId = searchParams.get("id");

  const [question, setQuestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
        if (data) setQuestion(data);
        else setError("Question not found");
      } catch {
        setError("Failed to load question");
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuestion();
  }, [questionId]);

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
    <div className="min-h-screen bg-[#F4FCFD] px-8 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 px-5 py-3 mb-8 rounded-xl bg-[#F0F4FF] hover:bg-[#E4F4FF] text-[#162DB0] font-bold text-lg shadow transition-all"
      >
        <ChevronLeft className="h-6 w-6" />
        Back
      </button>
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-[#E4F4FF]">
        <h2 className="text-xl font-bold mb-4 text-[#2E2E68]">Question Details</h2>
        <div className="mb-2">
          <span className="font-semibold text-[#00306E]">Question:</span>
          <div className="mt-1 text-[#00306E]">{question.questionText}</div>
        </div>
        <div className="mb-2">
          <span className="font-semibold text-[#00306E]">Tag:</span> {question.tags}
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
                    <span className="ml-2 text-green-600 font-bold">(Correct)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {question.type === "ESSAY" && (
          <div className="mb-2 text-[#00306E]/70 italic">Essay question (no options)</div>
        )}
        <div className="mb-2">
          <span className="font-semibold text-[#00306E]">Language:</span> {question.language}
        </div>
        <div className="mb-2">
          <span className="font-semibold text-[#00306E]">Level:</span> {question.passageLevel === 0 ? "Kindergarten" : `Grade ${question.passageLevel}`}
        </div>
        <div className="mb-2">
          <span className="font-semibold text-[#00306E]">Passage Title:</span> {question.passageTitle}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getQuestionByIdAction } from "@/app/actions/admin/getQuestionById";

interface Question {
  id: string;
  quizId: string;
  questionText: string;
  tags: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ViewQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const id = params.id as string;

  useEffect(() => {
    const loadQuestion = async () => {
      setIsLoading(true);
      try {
        const data = await getQuestionByIdAction({ id });
        if (data) {
          setQuestion(data as Question);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load question";
        setError(errorMessage);
        console.error("Error loading question:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestion();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-lg text-[#00306E]/60">Loading question...</span>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-[118px] items-center px-10 border-b border-[#8D8DEC] shadow-[0px_4px_4px_#54A4FF] bg-transparent rounded-tl-[50px]">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#162DB0] hover:opacity-70 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
        </header>

        <main className="flex flex-1 items-center justify-center">
          <div className="rounded-lg bg-red-100 p-6 text-sm text-red-700">
            {error || "Question not found"}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-[118px] items-center justify-between px-10 border-b border-[#8D8DEC] shadow-[0px_4px_4px_#54A4FF] bg-transparent rounded-tl-[50px]">
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
          </div>
          <h1 className="text-[25px] font-semibold leading-[38px] text-[#31318A]">
            View Question
          </h1>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-[#162DB0] transition-colors hover:bg-[#E4F4FF]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-8 py-8">
          <div className="rounded-lg bg-white border border-[rgba(74,74,252,0.08)] p-8 shadow-sm space-y-6">
            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-[#00306E] mb-3">
                Question Text
              </label>
              <p className="text-base text-[#00306E] bg-[#F4FCFD] rounded-lg p-4 border border-[rgba(84,164,255,0.38)] whitespace-pre-wrap leading-relaxed">
                {question.questionText}
              </p>
            </div>

            {/* Tags and Type */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#00306E] mb-3">
                  Tags
                </label>
                <p className="text-base text-[#00306E] bg-[#F4FCFD] rounded-lg p-4 border border-[rgba(84,164,255,0.38)]">
                  {question.tags}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#00306E] mb-3">
                  Type
                </label>
                <p className="text-base text-[#00306E] bg-[#F4FCFD] rounded-lg p-4 border border-[rgba(84,164,255,0.38)]">
                  {question.type === "MULTIPLE_CHOICE"
                    ? "Multiple Choice"
                    : "Essay"}
                </p>
              </div>
            </div>

            {/* Options (for Multiple Choice) */}
            {question.type === "MULTIPLE_CHOICE" && question.options && (
              <div>
                <label className="block text-sm font-medium text-[#00306E] mb-3">
                  Options
                </label>
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-4 border flex items-start gap-3 ${
                        option === question.correctAnswer
                          ? "bg-[rgba(46,139,87,0.12)] border-[#2E8B57]"
                          : "bg-[#F4FCFD] border-[rgba(84,164,255,0.38)]"
                      }`}
                    >
                      <span className="flex-shrink-0 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium text-[#00306E] bg-white border border-[#00306E]/20">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1 text-base text-[#00306E]">
                        {option}
                      </span>
                      {option === question.correctAnswer && (
                        <span className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2E8B57] text-white">
                          Correct
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-[rgba(74,74,252,0.08)] pt-6">
              <div className="grid grid-cols-2 gap-8 text-sm">
                <div>
                  <span className="text-[#00306E]/60">Created</span>
                  <p className="font-medium text-[#00306E] mt-1">
                    {new Date(question.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-[#00306E]/60">Last Updated</span>
                  <p className="font-medium text-[#00306E] mt-1">
                    {new Date(question.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
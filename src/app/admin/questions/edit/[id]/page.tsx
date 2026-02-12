"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getQuestionByIdAction } from "@/app/actions/admin/getQuestionById";
import { UpdateQuestionForm } from "@/components/admin-dash/updateQuestionForm";

interface Question {
  id: string;
  quizId: string;
  questionText: string;
  tags: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
}

export default function EditQuestionPage() {
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

  if (!question) {
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
      <header className="flex h-[118px] items-center px-10 border-b border-[#8D8DEC] shadow-[0px_4px_4px_#54A4FF] bg-transparent rounded-tl-[50px]">
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
          </div>
          <h1 className="text-[25px] font-semibold leading-[38px] text-[#31318A]">
            Edit Question
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl px-8 py-8">
          <UpdateQuestionForm question={question} />
        </div>
      </main>
    </div>
  );
}
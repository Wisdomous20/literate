"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getQuestionByIdAction } from "@/app/actions/comprehension-Test/getQuestionById";
import { UpdateQuestionForm } from "@/components/admin-dash/updateQuestionForm";

interface Question {
  id: string;
  quizId: string;
  questionText: string;
  tags: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
  passageId?: string;
}

export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const passageId = params.id as string;
  const questionId = searchParams.get("id");

  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!questionId) {
      setError("No question ID provided.");
      setIsLoading(false);
      return;
    }
    const loadQuestion = async () => {
      setIsLoading(true);
      try {
        const data = await getQuestionByIdAction({ id: questionId });
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
  }, [questionId]);

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
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl px-8 py-8">
          <UpdateQuestionForm question={{ ...question, passageId }} />
        </div>
      </main>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuestionTable } from "@/components/admin-dash/questionTable";
import { getAllQuestionsAction } from "@/app/actions/admin/getAllQuestion";
import { deleteQuestionAction } from "@/app/actions/admin/deleteQuestion";

interface RawQuestion {
  id: string;
  questionText: string;
  passageTitle: string;
  tags: string;
  type: string;
  passageLevel: number;
  language: string;
}

interface Question {
  id: string;
  questionText: string;
  passageTitle: string;
  tags: "Literal" | "Inferential" | "Critical";
  type: "MULTIPLE_CHOICE" | "ESSAY";
  passageLevel: number;
  language: "Filipino" | "English";
}

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      try {
        const data = await getAllQuestionsAction();
        if (data && Array.isArray(data)) {
          const formattedQuestions: Question[] = data.map((q: RawQuestion) => ({
            id: q.id,
            questionText: q.questionText,
            passageTitle: q.passageTitle,
            tags: q.tags as "Literal" | "Inferential" | "Critical",
            type: q.type as "MULTIPLE_CHOICE" | "ESSAY",
            passageLevel: q.passageLevel,
            language: q.language as "Filipino" | "English",
          }));
          setQuestions(formattedQuestions);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load questions";
        setError(errorMessage);
        console.error("Error loading questions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, []);

  const handleEdit = (question: Question) => {
    router.push(`/admin/questions/edit/${question.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) {
      return;
    }

    setIsDeleting(id);
    try {
      await deleteQuestionAction({ id });
      setQuestions(questions.filter((q) => q.id !== id));
      setError(""); // Clear any previous errors
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete question";
      setError(errorMessage);
      console.error("Error deleting question:", err);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleView = (question: Question) => {
    router.push(`/admin/questions/view/${question.id}`);
  };

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
            Comprehension Questions
          </h1>
        </div>
        <Link
          href="/admin/questions/create"
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{
            background: "#2E2E68",
            border: "1px solid #7A7AFB",
            boxShadow: "0px 1px 20px rgba(65, 155, 180, 0.47)",
          }}
        >
          Create Question
        </Link>
      </header>

      <main className="flex flex-1 flex-col px-8 py-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <span className="text-lg text-[#00306E]/60">
              Loading questions...
            </span>
          </div>
        ) : (
          <QuestionTable
            questions={questions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            isDeleting={isDeleting}
          />
        )}
      </main>
    </div>
  );
}
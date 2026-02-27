"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getPassageByIdAction } from "@/app/actions/passage/getPassageById";
import { getAllQuestionsAction } from "@/app/actions/comprehension-Test/getAllQuestion";
import { deleteQuestionAction } from "@/app/actions/admin/deleteQuestion";
import { QuestionTable } from "@/components/admin-dash/questionTable";

interface Passage {
  id: string;
  title: string;
  content: string;
  language: string;
  level: number;
  tags: string;
  testType: string;
}

interface Question {
  id: string;
  questionText: string;
  passageTitle: string;
  tags: "Literal" | "Inferential" | "Critical";
  type: "MULTIPLE_CHOICE" | "ESSAY";
  passageLevel: number;
  language: "Filipino" | "English";
  passageId?: string;
}

export default function PassageQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const [passage, setPassage] = useState<Passage | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const passageId = params.id as string;

  // Load passage details
  useEffect(() => {
    const loadPassage = async () => {
      setIsLoading(true);
      try {
        const data = await getPassageByIdAction({ id: passageId });
        if (data) setPassage(data as Passage);
      } catch (err) {
        setError("Failed to load passage");
      } finally {
        setIsLoading(false);
      }
    };
    loadPassage();
  }, [passageId]);

  // Load questions for this passage
  const fetchQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const data = await getAllQuestionsAction();
      // ...existing code...
if (Array.isArray(data)) {
  setQuestions(
    data
      .filter((q: any) => q.passageId?.toString() === passageId.toString())
      .map((q: any) => ({
        ...q,
        tags: q.tags as "Literal" | "Inferential" | "Critical",
        type: q.type as "MULTIPLE_CHOICE" | "ESSAY",
        language: q.language as "Filipino" | "English",
      }))
  );
}
// ...existing code...
    } catch (err) {
      setError("Failed to load questions");
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line
  }, [passageId]);

  // Delete question
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    setIsDeleting(id);
    try {
      await deleteQuestionAction({ id });
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      setError("Failed to delete question");
    } finally {
      setIsDeleting(null);
    }
  };

  // Edit/view question
  const handleEdit = (question: Question) => {
  router.push(`/admin/passages/${question.passageId}/edit-question?id=${question.id}`);
  };
  const handleView = (question: Question) => {
    router.push(`/admin/questions/view/${question.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-lg text-[#00306E]/60">Loading passage...</span>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="rounded-lg bg-red-100 p-6 text-sm text-red-700">
          {error || "Passage not found"}
        </div>
      </div>
    );
  }

  const wordCount = passage.content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F4FCFD] flex flex-col px-0 py-0">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-10 pt-10 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#162DB0] hover:opacity-70 transition-opacity"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold text-[#31318A] ml-4">
          Passage Details
        </h1>
      </div>

      {/* Passage Details */}
      <div className="mx-10 mb-8 rounded-2xl bg-white border border-[#E4F4FF] shadow p-6 flex flex-col gap-3">
        <div className="flex flex-wrap gap-4 items-center">
          <h2 className="text-xl font-bold text-[#31318A]">{passage.title}</h2>
          <span className="rounded-full bg-[#6666FF]/10 text-[#6666FF] px-3 py-1 text-xs font-medium">
            {passage.testType === "PRE_TEST" ? "Pre-Test" : "Post-Test"}
          </span>
          <span className="rounded-full bg-[#E4F4FF] text-[#00306E] px-3 py-1 text-xs font-medium">
            {passage.tags}
          </span>
          <span className="rounded-full bg-[#2E8B57]/10 text-[#2E8B57] px-3 py-1 text-xs font-medium">
            {passage.level === 0 ? "Kindergarten" : `Grade ${passage.level}`}
          </span>
          <span className="rounded-full bg-[#54A4FF]/10 text-[#54A4FF] px-3 py-1 text-xs font-medium">
            {passage.language}
          </span>
          <span className="rounded-full bg-[#00306E]/10 text-[#00306E] px-3 py-1 text-xs font-medium">
            {wordCount} words
          </span>
        </div>
        <div className="mt-2 text-[#00306E]/80 text-base whitespace-pre-wrap">{passage.content}</div>
      </div>

      {/* Create Question Button */}
      <div className="mx-10 mb-4 flex justify-end">
        <button
          className="rounded-lg px-6 py-3 text-base font-semibold text-white bg-[#2E2E68] hover:opacity-90 shadow"
          onClick={() => router.push(`/admin/passages/${passage.id}/create-question`)}
        >
          + Create Question
        </button>
      </div>

      {/* Questions Table */}
      <div className="mx-10 mb-10">
        <div className="rounded-2xl bg-white border border-[#E4F4FF] shadow p-6">
          <h2 className="text-lg font-semibold text-[#31318A] mb-4">Questions for this Passage</h2>
          {isLoadingQuestions ? (
            <div className="flex items-center justify-center h-32">
              <span className="text-[#00306E]/60">Loading questions...</span>
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
        </div>
      </div>
    </div>
  );
}
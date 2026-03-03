"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  FileText,
  BarChart2,
  Globe,
  BookOpen,
  Plus,
  Eye,
} from "lucide-react";
import { QuestionTable } from "@/components/admin-dash/questions/questionTable";
import { usePassageById } from "@/lib/hooks/usePassageById";
import { useQuestionList } from "@/lib/hooks/useQuestionList";
import { deleteQuestionAction } from "@/app/actions/admin/deleteQuestion";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function PassageQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const passageId = params.id as string;
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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
  const questions = allQuestions.filter(
    (q: any) => q.passageId?.toString() === passageId.toString(),
  );

  // Fix: Map tags to expected union type
  const allowedTags = ["Literal", "Inferential", "Critical"] as const;
  type AllowedTag = typeof allowedTags[number];
  const mappedQuestions = questions.map((q: any) => ({
    ...q,
    tags: allowedTags.includes(q.tags) ? q.tags as AllowedTag : "Literal",
  }));

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    setIsDeleting(id);
    try {
      await deleteQuestionAction({ id });
      await queryClient.invalidateQueries({ queryKey: ["questions"] });
      // Redirect if currently viewing or editing this question
      const url = new URL(window.location.href);
      const editing =
        url.pathname.endsWith(`/edit-question`) &&
        url.searchParams.get("id") === id;
      const viewing =
        url.pathname.endsWith(`/view-question`) &&
        url.searchParams.get("id") === id;
      if (editing || viewing) {
        router.push(`/admin/passages/${passageId}`);
      }
    } catch (err) {
      // Optionally show error
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEdit = (question: any) => {
    router.push(
      `/admin/passages/${question.passageId}/edit-question?id=${question.id}`,
    );
  };

  const handleView = (question: any) => {
    router.push(
      `/admin/passages/${question.passageId}/view-question?id=${question.id}`,
    );
  };

  if (isLoadingPassage) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-[#F4FCFD]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#31318A] border-t-transparent" />
          <span className="text-sm text-[#00306E]/60 font-medium">
            Loading passage...
          </span>
        </div>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen bg-[#F4FCFD]">
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-sm text-red-700 shadow-sm">
          {errorPassage?.message || "Passage not found"}
        </div>
      </div>
    );
  }

  const wordCount = passage.content.trim().split(/\s+/).filter(Boolean).length;

  const badgeConfig = [
    {
      icon: <FileText className="h-3 w-3" />,
      label: passage.testType === "PRE_TEST" ? "Pre-Test" : "Post-Test",
      color: "bg-violet-100 text-violet-700 border border-violet-200",
    },
    {
      icon: <BarChart2 className="h-3 w-3" />,
      label: passage.level === 0 ? "Kindergarten" : `Grade ${passage.level}`,
      color: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    {
      icon: <Globe className="h-3 w-3" />,
      label: passage.language,
      color: "bg-sky-50 text-sky-700 border border-sky-200",
    },
    {
      icon: <BookOpen className="h-3 w-3" />,
      label: `${wordCount} words`,
      color: "bg-slate-100 text-slate-600 border border-slate-200",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4FCFD]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F4FCFD]/95 backdrop-blur border-b border-[#E4F4FF] px-8 py-4">
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-1.5 text-sm text-[#162DB0] hover:opacity-70 transition-opacity font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Passages
        </button>
      </div>

      <div className="px-8 py-6 space-y-5">
        {/* Passage Info Card */}
        <div className="rounded-2xl bg-white border border-[#E4F4FF] shadow-sm overflow-hidden">
          {/* Card Header Row: Title + Create Button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4F4FF] bg-gradient-to-r from-[#F0F4FF] to-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#31318A]/10">
                <FileText className="h-4 w-4 text-[#31318A]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#00306E]/40 mb-0.5">
                  Passage
                </p>
                <button
                  onClick={() =>
                    router.push(`/admin/passages/${passage.id}/view`)
                  }
                  className="group flex items-center gap-1.5 text-left"
                >
                  <h2 className="text-lg font-bold text-[#31318A] group-hover:text-[#162DB0] transition-colors truncate max-w-[480px]">
                    {passage.title}
                  </h2>
                  <Eye className="h-4 w-4 text-[#162DB0] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              </div>
            </div>

            {/* Create Question Button */}
            <button
              onClick={() =>
                router.push(`/admin/passages/${passage.id}/create-question`)
              }
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-[#2E2E68] hover:bg-[#31318A] transition-colors shadow-sm shrink-0 ml-4"
            >
              <Plus className="h-4 w-4" />
              Create Question
            </button>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2 px-6 py-3">
            {badgeConfig.map((badge, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${badge.color}`}
              >
                {badge.icon}
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        {/* Questions Section */}
        <div className="rounded-2xl bg-white border border-[#E4F4FF] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4F4FF]">
            <div>
              <h3 className="text-base font-bold text-[#31318A]">Questions</h3>
              <p className="text-xs text-[#00306E]/50 mt-0.5">
                {isLoadingQuestions
                  ? "Loading..."
                  : `${mappedQuestions.length} question${mappedQuestions.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
          </div>

          <div className="p-6">
            {errorQuestions ? (
              <div className="rounded-lg bg-red-100 p-4 text-sm text-red-700 mb-4">
                {errorQuestions.message || "Failed to load questions"}
              </div>
            ) : isLoadingQuestions ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-[#31318A] border-t-transparent" />
                <span className="text-sm text-[#00306E]/50">
                  Loading questions...
                </span>
              </div>
            ) : mappedQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F4FF]">
                  <BookOpen className="h-6 w-6 text-[#31318A]/40" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#00306E]/60">
                    No questions yet
                  </p>
                  <p className="text-xs text-[#00306E]/40 mt-1">
                    Click{" "}
                    <button
                      onClick={() =>
                        router.push(
                          `/admin/passages/${passage.id}/create-question`,
                        )
                      }
                      className="text-[#162DB0] hover:underline font-medium"
                    >
                      Create Question
                    </button>{" "}
                    to add the first one.
                  </p>
                </div>
              </div>
            ) : (
              <QuestionTable
                questions={mappedQuestions}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                isDeleting={isDeleting}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
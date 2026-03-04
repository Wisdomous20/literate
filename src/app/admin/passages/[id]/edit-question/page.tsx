"use client";

import { useParams, useSearchParams } from "next/navigation";
import { UpdateQuestionForm } from "@/components/admin-dash/questions/updateQuestionForm";
import { useQuestionById } from "@/lib/hooks/useQuestionById";

export default function EditQuestionPage() {
  const params = useParams();
  // const router = useRouter();
  const searchParams = useSearchParams();
  const passageId = params.id as string;
  const questionId = searchParams.get("id") || "";

  const { data: question, isLoading, error } = useQuestionById(questionId);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#31318A] border-t-transparent" />
          <span className="ml-3 text-sm text-[#00306E]/60 font-medium">
            Loading question...
          </span>
        </main>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex h-full flex-col">
        <main className="flex flex-1 items-center justify-center">
          <div className="rounded-lg bg-red-100 p-6 text-sm text-red-700">
            {error?.message || "Question not found"}
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

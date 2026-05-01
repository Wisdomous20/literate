"use client";

import { useRouter, useSearchParams, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ViewQuestionDetails } from "@/components/admin-dash/questions/viewQuestionDetails";

export default function ViewQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const passageId = params.id as string;
  const questionId = searchParams.get("id");

  return (
    <div className="min-h-screen bg-[#F4FCFD] px-8 py-8">
      <button
        onClick={() => router.back()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6666FF] text-white shadow-[0_4px_12px_rgba(102,102,255,0.35)] mb-8 transition-all hover:bg-[#5555EE] hover:shadow-[0_6px_16px_rgba(102,102,255,0.45)] active:scale-95"
        aria-label="Go back"
        title="Go back"
      >
        <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
      </button>
      {questionId ? (
        <ViewQuestionDetails questionId={questionId} passageId={passageId} />
      ) : (
        <div className="rounded-lg bg-red-100 p-6 text-sm text-red-700">
          No question ID provided.
        </div>
      )}
    </div>
  );
}
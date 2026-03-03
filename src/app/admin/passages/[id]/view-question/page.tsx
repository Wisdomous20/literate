"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ViewQuestionDetails } from "@/components/admin-dash/viewQuestionDetails";

export default function ViewQuestionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionId = searchParams.get("id");

  return (
    <div className="min-h-screen bg-[#F4FCFD] px-8 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 px-5 py-3 mb-8 rounded-xl bg-[#F0F4FF] hover:bg-[#E4F4FF] text-[#162DB0] font-bold text-lg shadow transition-all"
      >
        <ChevronLeft className="h-6 w-6" />
        Back
      </button>
      {questionId && <ViewQuestionDetails questionId={questionId} />}
      {!questionId && (
        <div className="rounded-lg bg-red-100 p-6 text-sm text-red-700">
          No question ID provided.
        </div>
      )}
    </div>
  );
}

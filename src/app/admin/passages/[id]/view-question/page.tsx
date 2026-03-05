"use client";

import { useRouter, useSearchParams, useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
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
        className="flex items-center gap-2 px-5 py-3 mb-8 rounded-xl bg-[#F0F4FF] hover:bg-[#E4F4FF] text-[#162DB0] font-bold text-lg shadow transition-all"
      >
        <ChevronLeft className="h-6 w-6" />
        Back
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

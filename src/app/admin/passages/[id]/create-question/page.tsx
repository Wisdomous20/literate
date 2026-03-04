"use client";

import { useParams, useRouter } from "next/navigation";
import { CreateQuestionForm } from "@/components/admin-dash/questions/createQuestionForm";
import { ChevronLeft } from "lucide-react";
import { usePassageById } from "@/lib/hooks/usePassageById";

export default function CreateQuestionForPassagePage() {
  const params = useParams();
  const router = useRouter();
  const passageId = params.id as string;

  const { data: passage, isLoading, error } = usePassageById(passageId);

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl px-8 py-8">
          <div className="flex items-center mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F0F4FF] hover:bg-[#E4F4FF] text-[#162DB0] font-bold text-lg shadow transition-all"
              style={{ marginLeft: 0 }}
            >
              <ChevronLeft className="h-6 w-6" />
              Back
            </button>
          </div>
          <div className="mb-8">
            <p className="text-base text-[#00306E]/70">
              Create a comprehension question for this passage
            </p>
          </div>
          {isLoading && <p>Loading passage...</p>}
          {error && (
            <div className="rounded-lg bg-red-100 p-4 text-sm text-red-700">
              {error.message || "Failed to load passage"}
            </div>
          )}
          {passage && <CreateQuestionForm passageId={passageId} />}
        </div>
      </main>
    </div>
  );
}

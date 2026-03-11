
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
    <div className="min-h-screen h-screen w-full overflow-auto bg-[#F4FCFD] flex flex-col">
      <main className="flex-1 w-full">
        <div className="w-full flex flex-col items-center px-2 sm:px-4 py-8">
          <div className="flex items-center mb-8 w-full max-w-2xl">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F0F4FF] hover:bg-[#E4F4FF] text-[#162DB0] font-bold text-lg shadow transition-all ml-0"
            >
              <ChevronLeft className="h-6 w-6" />
              Back
            </button>
          </div>
          <div className="mb-8 w-full max-w-2xl">
            <p className="text-base text-[#00306E]/70">
              Create a comprehension question for this passage
            </p>
          </div>
          {isLoading && <p>Loading passage...</p>}
          {error && (
            <div className="rounded-lg bg-red-100 p-4 text-sm text-red-700 w-full max-w-2xl">
              {error.message || "Failed to load passage"}
            </div>
          )}
          {passage && (
            <div className="w-full max-w-2xl">
              <CreateQuestionForm passageId={passageId} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

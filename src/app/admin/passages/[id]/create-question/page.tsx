
"use client";

import { useParams, useRouter } from "next/navigation";
import { CreateQuestionForm } from "@/components/admin-dash/questions/createQuestionForm";
import { ArrowLeft } from "lucide-react";
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6666FF] text-white shadow-[0_4px_12px_rgba(102,102,255,0.35)] transition-all hover:bg-[#5555EE] hover:shadow-[0_6px_16px_rgba(102,102,255,0.45)] active:scale-95 ml-0"
              aria-label="Go back"
              title="Go back"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
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

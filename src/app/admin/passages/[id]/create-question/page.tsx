"use client";

import { useParams, useRouter } from "next/navigation";
import { CreateQuestionForm } from "@/components/admin-dash/createQuestionForm";
import { ChevronLeft } from "lucide-react";

export default function CreateQuestionForPassagePage() {
  const params = useParams();
  const router = useRouter();
  const passageId = params.id as string;

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl px-8 py-8">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-[#162DB0] hover:opacity-70 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <div className="mb-8">
            <p className="text-base text-[#00306E]/70">
              Create a comprehension question for this passage
            </p>
          </div>
          <CreateQuestionForm passageId={passageId} />
        </div>
      </main>
    </div>
  );
}
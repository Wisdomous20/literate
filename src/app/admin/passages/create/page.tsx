"use client";

import { CreatePassageForm } from "@/components/admin-dash/passages/createPassageForm";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function CreatePassagePage() {
  const router = useRouter();

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
              Create a new graded reading passage for assessments
            </p>
          </div>
          <CreatePassageForm />
        </div>
      </main>
    </div>
  );
}

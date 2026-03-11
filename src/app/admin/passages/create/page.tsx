"use client";

import { CreatePassageForm } from "@/components/admin-dash/passages/createPassageForm";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function CreatePassagePage() {
  const router = useRouter();

  return (
    <div className="h-full min-h-screen w-full flex flex-col overflow-auto bg-[#F4FCFD]">
      <div className="flex items-center gap-4 px-8 pt-8 pb-4">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F0F4FF] hover:bg-[#E4F4FF] text-[#162DB0] font-semibold text-base shadow transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>
        <span className="text-base text-[#00306E]/70 font-medium">
          Create a new graded reading passage for assessments
        </span>
      </div>
      <div className="flex-1 flex flex-col px-8 pb-8">
        <CreatePassageForm />
      </div>
    </div>
  );
}
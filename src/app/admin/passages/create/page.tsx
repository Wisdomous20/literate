"use client";

import { CreatePassageForm } from "@/components/admin-dash/passages/createPassageForm";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function CreatePassagePage() {
  const router = useRouter();

  return (
    <div className="h-full min-h-screen w-full flex flex-col overflow-auto bg-[#F4FCFD]">
      <div className="flex items-center gap-4 px-8 pt-8 pb-4">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.back()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6666FF] text-white shadow-[0_4px_12px_rgba(102,102,255,0.35)] transition-all hover:bg-[#5555EE] hover:shadow-[0_6px_16px_rgba(102,102,255,0.45)] active:scale-95"
          title="Go back"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
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
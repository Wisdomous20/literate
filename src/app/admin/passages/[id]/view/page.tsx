"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PassageDetailsCard } from "@/components/admin-dash/passages/passageDetailsCard";
import { usePassageById } from "@/lib/hooks/usePassageById";

export default function PassageViewPage() {
  const params = useParams();
  const router = useRouter();
  const passageId = params.id as string;

  const { data: passage, isLoading, error } = usePassageById(passageId);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-[#F4FCFD]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#31318A] border-t-transparent" />
          <span className="text-sm text-[#00306E]/60 font-medium">
            Loading passage...
          </span>
        </div>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen bg-[#F4FCFD]">
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-sm text-red-700 shadow-sm">
          {error?.message || "Passage not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4FCFD]">
      <div className="sticky top-0 z-10 bg-[#F4FCFD]/95 backdrop-blur border-b border-[#E4F4FF] px-8 py-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border border-[#6666FF]/40 text-[#6666FF] shadow-sm transition-all hover:bg-[#F0F4FF] hover:border-[#6666FF] active:scale-95"
          aria-label="Go back"
          title="Go back"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>

      <div className="px-8 py-8 flex justify-center">
        <PassageDetailsCard passageId={passageId} />
      </div>
    </div>
  );
}

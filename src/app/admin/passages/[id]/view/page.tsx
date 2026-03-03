"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PassageDetailsCard } from "@/components/admin-dash/passageDetailsCard";
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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F4FCFD]/95 backdrop-blur border-b border-[#E4F4FF] px-8 py-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-[#162DB0] hover:opacity-70 transition-opacity font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="px-8 py-8 flex justify-center">
        <PassageDetailsCard passageId={passageId} />
      </div>
    </div>
  );
}

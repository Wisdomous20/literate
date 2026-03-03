"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getPassageByIdAction } from "@/app/actions/passage/getPassageById";
import { PassageDetailsCard } from "@/components/admin-dash/passageDetailsCard";

interface Passage {
  id: string;
  title: string;
  content: string;
  language: string;
  level: number;
  testType: string;
}

export default function PassageViewPage() {
  const params = useParams();
  const router = useRouter();
  const [passage, setPassage] = useState<Passage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const passageId = params.id as string;

  useEffect(() => {
    const loadPassage = async () => {
      setIsLoading(true);
      try {
        const data = await getPassageByIdAction({ id: passageId });
        if (data) setPassage(data as Passage);
      } catch (err) {
        setError("Failed to load passage");
      } finally {
        setIsLoading(false);
      }
    };
    loadPassage();
  }, [passageId]);

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
          {error || "Passage not found"}
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
        <PassageDetailsCard passage={passage} />
      </div>
    </div>
  );
}

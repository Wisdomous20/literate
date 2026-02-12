"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getPassageByIdAction } from "@/app/actions/admin/getPassageById";
import { UpdatePassageForm } from "@/components/admin-dash/updatePassageForm";

interface Passage {
  id: string;
  title: string;
  content: string;
  language: string;
  level: number;
  tags: string;
  testType: string;
}

export default function EditPassagePage() {
  const params = useParams();
  const router = useRouter();
  const [passage, setPassage] = useState<Passage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const id = params.id as string;

  useEffect(() => {
    const loadPassage = async () => {
      setIsLoading(true);
      try {
        const data = await getPassageByIdAction({ id });
        if (data) {
          setPassage(data as Passage);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load passage";
        setError(errorMessage);
        console.error("Error loading passage:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPassage();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-lg text-[#00306E]/60">Loading passage...</span>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-[118px] items-center px-10 border-b border-[#8D8DEC] shadow-[0px_4px_4px_#54A4FF] bg-transparent rounded-tl-[50px]">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#162DB0] hover:opacity-70 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
        </header>

        <main className="flex flex-1 items-center justify-center">
          <div className="rounded-lg bg-red-100 p-6 text-sm text-red-700">
            {error || "Passage not found"}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-[118px] items-center px-10 border-b border-[#8D8DEC] shadow-[0px_4px_4px_#54A4FF] bg-transparent rounded-tl-[50px]">
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
          </div>
          <h1 className="text-[25px] font-semibold leading-[38px] text-[#31318A]">
            Edit Passage
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl px-8 py-8">
          <p className="mb-8 text-base text-[#00306E]/70">
            Update comprehension passage details
          </p>
          <UpdatePassageForm passage={passage} />
        </div>
      </main>
    </div>
  );
}
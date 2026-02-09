"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getPassageByIdAction } from "@/app/actions/admin/getPassageById";

interface Passage {
  id: string;
  title: string;
  content: string;
  language: string;
  level: number;
  tags: string;
  testType: string;
  createdAt: Date;
  updatedAt: Date;
}

function getLevelLabel(level: number): string {
  if (level === 0) return "K";
  return `Grade ${level}`;
}

export default function ViewPassagePage() {
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

  if (error || !passage) {
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

  const wordCount = passage.content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-[118px] items-center justify-between px-10 border-b border-[#8D8DEC] shadow-[0px_4px_4px_#54A4FF] bg-transparent rounded-tl-[50px]">
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
          </div>
          <h1 className="text-[25px] font-semibold leading-[38px] text-[#31318A]">
            View Passage
          </h1>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-[#162DB0] transition-colors hover:bg-[#E4F4FF]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-8 py-8">
          <div className="rounded-lg bg-white border border-[rgba(74,74,252,0.08)] p-8 shadow-sm space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[#00306E] mb-3">
                Title
              </label>
              <p className="text-base text-[#00306E] bg-[#F4FCFD] rounded-lg p-4 border border-[rgba(84,164,255,0.38)]">
                {passage.title}
              </p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-[#00306E] mb-3">
                Content
              </label>
              <p className="text-base text-[#00306E] bg-[#F4FCFD] rounded-lg p-4 border border-[rgba(84,164,255,0.38)] whitespace-pre-wrap leading-relaxed">
                {passage.content}
              </p>
            </div>

            {/* Word Count */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#00306E] mb-3">
                  Word Count
                </label>
                <p className="text-base text-[#00306E] bg-[#F4FCFD] rounded-lg p-4 border border-[rgba(84,164,255,0.38)]">
                  {wordCount}
                </p>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-[#00306E] mb-3">
                  Language
                </label>
                <p className="text-base text-[#00306E] bg-[#F4FCFD] rounded-lg p-4 border border-[rgba(84,164,255,0.38)]">
                  {passage.language}
                </p>
              </div>
            </div>

            {/* Level, Tags, Test Type */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#00306E] mb-3">
                  Level
                </label>
                <p className="text-base text-[#00306E] bg-[#F4FCFD] rounded-lg p-4 border border-[rgba(84,164,255,0.38)]">
                  {getLevelLabel(passage.level)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#00306E] mb-3">
                  Tags
                </label>
                <p className="text-base text-[#00306E] bg-[#F4FCFD] rounded-lg p-4 border border-[rgba(84,164,255,0.38)]">
                  {passage.tags}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#00306E] mb-3">
                  Test Type
                </label>
                <p className="text-base text-[#00306E] bg-[#F4FCFD] rounded-lg p-4 border border-[rgba(84,164,255,0.38)]">
                  {passage.testType === "PRE_TEST" ? "Pre-Test" : "Post-Test"}
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t border-[rgba(74,74,252,0.08)] pt-6">
              <div className="grid grid-cols-2 gap-8 text-sm">
                <div>
                  <span className="text-[#00306E]/60">Created</span>
                  <p className="font-medium text-[#00306E] mt-1">
                    {new Date(passage.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-[#00306E]/60">Last Updated</span>
                  <p className="font-medium text-[#00306E] mt-1">
                    {new Date(passage.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
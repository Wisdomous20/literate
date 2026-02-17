"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PassageTable } from "@/components/admin-dash/passageTable";
import { getAllPassagesAction } from "@/app/actions/admin/getAllPassage";
import { deletePassageAction } from "@/app/actions/admin/deletePassage";

interface PassageApiData {
  id: string;
  title: string;
  content: string;
  language: string;
  level: number;
  tags: string;
  testType: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Passage {
  id: string;
  title: string;
  language: "Filipino" | "English";
  level: number;
  tags: "Literal" | "Inferential" | "Critical";
  testType: "PRE_TEST" | "POST_TEST";
  content: string;
  wordCount: number;
  questionsCount: number;
}

export default function PassagesPage() {
  const router = useRouter();
  const [passages, setPassages] = useState<Passage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPassages = async () => {
      setIsLoading(true);
      try {
        const data = await getAllPassagesAction();
        if (data && Array.isArray(data)) {
          const formattedPassages: Passage[] = data.map(
            (p: PassageApiData) => ({
              id: p.id,
              title: p.title,
              language: (p.language as "Filipino" | "English") || "English",
              level: p.level,
              tags:
                (p.tags as "Literal" | "Inferential" | "Critical") || "Literal",
              testType: (p.testType as "PRE_TEST" | "POST_TEST") || "PRE_TEST",
              content: p.content,
              wordCount: p.content?.split(/\s+/).filter(Boolean).length || 0,
              questionsCount: 0,
            }),
          );
          setPassages(formattedPassages);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load passages";
        setError(errorMessage);
        console.error("Error loading passages:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPassages();
  }, []);

  const handleEdit = (passage: Passage) => {
    router.push(`/admin-dash/passages/edit/${passage.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this passage?")) {
      return;
    }

    try {
      await deletePassageAction({ id });
      setPassages(passages.filter((p) => p.id !== id));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete passage";
      setError(errorMessage);
      console.error("Error deleting passage:", err);
    }
  };

  const handleView = (passage: Passage) => {
    router.push(`/admin-dash/passages/view/${passage.id}`);
  };

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
            Graded Passages
          </h1>
        </div>
        <Link
          href="/admin-dash/passages/create"
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{
            background: "#2E2E68",
            border: "1px solid #7A7AFB",
            boxShadow: "0px 1px 20px rgba(65, 155, 180, 0.47)",
          }}
        >
          Create Passage
        </Link>
      </header>

      <main className="flex flex-1 flex-col px-8 py-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <span className="text-lg text-[#00306E]/60">
              Loading passages...
            </span>
          </div>
        ) : (
          <PassageTable
            passages={passages}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
          />
        )}
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllPassagesAction } from "@/app/actions/passage/getAllPassage";
import { deletePassageAction } from "@/app/actions/admin/deletePassage";
import { FileText, MoreVertical } from "lucide-react";

interface Passage {
  id: string;
  title: string;
  language: string;
  level: number;
  tags: string;
  testType: string;
  content: string;
  wordCount: number;
}

export default function PassageInventory() {
  const [passages, setPassages] = useState<Passage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPassages = async () => {
      setIsLoading(true);
      try {
        const { success, passages: apiPassages } = await getAllPassagesAction();
        if (success && Array.isArray(apiPassages)) {
          setPassages(
            apiPassages.map((p: any) => ({
              ...p,
              wordCount: p.content?.split(/\s+/).filter(Boolean).length || 0,
            }))
          );
        }
      } catch (err) {
        // handle error
      } finally {
        setIsLoading(false);
      }
    };
    loadPassages();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpenId(null);
      }
    }
    if (menuOpenId) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpenId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this passage?")) return;
    setDeletingId(id);
    try {
      await deletePassageAction({ id });
      setPassages((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Failed to delete passage.");
    } finally {
      setDeletingId(null);
      setMenuOpenId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4FCFD] flex flex-col px-0 py-0">
      {/* Header row */}
      <div className="flex items-center justify-between px-10 pt-10 pb-6">
        <h1 className="text-2xl font-bold text-[#31318A]">Passage Inventory</h1>
        <Link
          href="/admin/passages/create"
          className="rounded-lg px-6 py-3 text-base font-semibold text-white bg-[#2E2E68] hover:opacity-90 shadow"
        >
          + Create Passage
        </Link>
      </div>

      {/* Passage Inventory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 px-10 pb-10">
        {isLoading ? (
          <div className="col-span-full flex justify-center items-center h-40">
            <span className="text-[#00306E]/60 text-lg">Loading passages...</span>
          </div>
        ) : passages.length === 0 ? (
          <div className="col-span-full flex justify-center items-center h-40">
            <span className="text-[#00306E]/60 text-lg">No passages found.</span>
          </div>
        ) : (
          passages.map((p) => (
            <div
              key={p.id}
              className="group flex flex-col justify-between rounded-2xl bg-white border border-[#E4F4FF] shadow hover:shadow-lg transition-all p-6 cursor-pointer hover:scale-[1.02] relative"
            >
              {/* Three vertical dots menu */}
              <div className="absolute right-4 top-4 z-10" ref={menuRef}>
                <button
                  type="button"
                  className="p-1"
                  onClick={() =>
                    setMenuOpenId(menuOpenId === p.id ? null : p.id)
                  }
                  aria-label="More options"
                >
                  <MoreVertical className="w-5 h-5 text-[#2E2E68]" />
                </button>
                {menuOpenId === p.id && (
                  <div className="absolute right-0 mt-2 w-32 rounded-lg bg-white border shadow-lg flex flex-col z-20">
                    <button
                      type="button"
                      className="px-4 py-2 text-left hover:bg-[#E4F4FF] text-[#00306E]"
                      onClick={() => {
                        setMenuOpenId(null);
                        router.push(`/admin/passages/edit/${p.id}`);
                      }}
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-left hover:bg-red-100 text-red-700"
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                    >
                      {deletingId === p.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                )}
              </div>
              {/* End menu */}

              <Link
                href={`/admin/passages/${p.id}`}
                className="flex-1 flex flex-col justify-between"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4F4FF]">
                    <FileText className="h-5 w-5 text-[#6666FF]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-[#31318A] truncate">{p.title}</h2>
                    <div className="text-xs text-[#00306E]/60">{p.language} • {p.wordCount} words</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="rounded-full bg-[#6666FF]/10 text-[#6666FF] px-3 py-1 text-xs font-medium">
                    {p.testType === "PRE_TEST" ? "Pre-Test" : "Post-Test"}
                  </span>
                  <span className="rounded-full bg-[#E4F4FF] text-[#00306E] px-3 py-1 text-xs font-medium">
                    {p.tags}
                  </span>
                  <span className="rounded-full bg-[#2E8B57]/10 text-[#2E8B57] px-3 py-1 text-xs font-medium">
                    {p.level === 0 ? "Kindergarten" : `Grade ${p.level}`}
                  </span>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
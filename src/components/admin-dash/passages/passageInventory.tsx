"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deletePassageAction } from "@/app/actions/admin/deletePassage";
import { FileText, MoreVertical } from "lucide-react";
import { usePassageList } from "@/lib/hooks/usePassageList";
import { useQueryClient } from "@tanstack/react-query";

export default function PassageInventory() {
  const { data: passages = [], isLoading } = usePassageList();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }

    if (!menuOpenId) return;

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpenId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this passage?")) return;
    setDeletingId(id);

    try {
      await deletePassageAction({ id });
      await queryClient.invalidateQueries({ queryKey: ["passages"] });
    } catch {
      alert("Failed to delete passage.");
    } finally {
      setDeletingId(null);
      setMenuOpenId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4FCFD] flex flex-col px-0 py-0">
      <div className="flex items-center justify-between px-6 pt-8 pb-4">
        <h1 className="text-xl font-bold text-[#31318A]">Passage Inventory</h1>
        <Link
          href="/admin/passages/create"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-[#2E2E68] hover:opacity-90 shadow"
        >
          + Create Passage
        </Link>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 px-6 pb-8">
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center h-32">
              <span className="text-[#00306E]/60 text-base">Loading passages...</span>
            </div>
          ) : passages.length === 0 ? (
            <div className="col-span-full flex justify-center items-center h-32">
              <span className="text-[#00306E]/60 text-base">No passages found.</span>
            </div>
          ) : (
            passages.map((p) => (
              <div
                key={p.id}
                className="group flex flex-col justify-between rounded-xl bg-white border border-[#E4F4FF] shadow hover:shadow-lg transition-all p-3 cursor-pointer hover:scale-[1.02] relative min-h-3 max-w-xs"
              >
                <div
                  className="absolute right-2 top-2 z-10"
                  ref={menuOpenId === p.id ? menuRef : null}
                >
                  <button
                    type="button"
                    className="p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === p.id ? null : p.id);
                    }}
                    aria-label="More options"
                  >
                    <MoreVertical className="w-4 h-4 text-[#2E2E68]" />
                  </button>

                  {menuOpenId === p.id && (
                    <div
                      className="absolute right-0 mt-2 w-28 rounded-lg bg-white border shadow-lg flex flex-col z-20"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="px-3 py-2 text-left hover:bg-[#E4F4FF] text-[#00306E] text-sm"
                        onClick={() => {
                          setMenuOpenId(null);
                          router.push(`/admin/passages/edit/${p.id}`);
                        }}
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 text-left hover:bg-red-100 text-red-700 text-sm"
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                      >
                        {deletingId === p.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>

                <Link
                  href={`/admin/passages/${p.id}`}
                  className="flex-1 flex flex-col justify-between min-w-0"
                >
                  <div className="flex items-center gap-2 mb-2 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E4F4FF]">
                      <FileText className="h-4 w-4 text-[#6666FF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2
                        className="text-base font-bold text-[#31318A] truncate max-w-37.5"
                        title={p.title}
                      >
                        {p.title}
                      </h2>
                      <div className="text-xs text-[#00306E]/60 truncate">
                        {p.language} • {p.content?.split(/\s+/).filter(Boolean).length || 0} words
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="rounded-full bg-[#6666FF]/10 text-[#6666FF] px-2 py-0.5 text-[11px] font-medium">
                      {p.testType === "PRE_TEST" ? "Pre-Test" : "Post-Test"}
                    </span>
                    <span className="rounded-full bg-[#2E8B57]/10 text-[#2E8B57] px-2 py-0.5 text-[11px] font-medium">
                      {p.level === 0 ? "Kindergarten" : `Grade ${p.level}`}
                    </span>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
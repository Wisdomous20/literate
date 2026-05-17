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
    <div className="flex min-h-screen flex-col bg-[#F4FCFD] px-0 py-0">
      <div className="flex items-center justify-between px-6 pb-4 pt-8">
        <h1 className="text-xl font-bold text-[#31318A]">Passage Inventory</h1>
        <Link
          href="/admin/passages/create"
          className="rounded-lg bg-[#2E2E68] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
        >
          + Create Passage
        </Link>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-4 px-6 pb-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {isLoading ? (
            <div className="col-span-full flex h-32 items-center justify-center">
              <span className="text-base text-[#00306E]/60">Loading passages...</span>
            </div>
          ) : passages.length === 0 ? (
            <div className="col-span-full flex h-32 items-center justify-center">
              <span className="text-base text-[#00306E]/60">No passages found.</span>
            </div>
          ) : (
            passages.map((p) => (
              <div
                key={p.id}
                className="group relative flex max-w-xs cursor-pointer flex-col justify-between rounded-xl border border-[#E4F4FF] bg-white p-3 shadow transition-all hover:scale-[1.02] hover:shadow-lg"
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
                    <MoreVertical className="h-4 w-4 text-[#2E2E68]" />
                  </button>

                  {menuOpenId === p.id && (
                    <div
                      className="absolute right-0 z-20 mt-2 flex w-28 flex-col rounded-lg border bg-white shadow-lg"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="px-3 py-2 text-left text-sm text-[#00306E] hover:bg-[#E4F4FF]"
                        onClick={() => {
                          setMenuOpenId(null);
                          router.push(`/admin/passages/edit/${p.id}`);
                        }}
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 text-left text-sm text-red-700 hover:bg-red-100"
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
                  className="flex min-w-0 flex-1 flex-col justify-between"
                >
                  <div className="mb-2 flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E4F4FF]">
                      <FileText className="h-4 w-4 text-[#6666FF]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2
                        className="max-w-37.5 truncate text-base font-bold text-[#31318A]"
                        title={p.title}
                      >
                        {p.title}
                      </h2>
                      <div className="truncate text-xs text-[#00306E]/60">
                        {`${p.language} • ${
                          p.content?.split(/\s+/).filter(Boolean).length || 0
                        } words`}
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="whitespace-nowrap rounded-full bg-[#6666FF]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#6666FF]">
                      {p.testType === "PRE_TEST" ? "Pre-Test" : "Post-Test"}
                    </span>
                    <span className="rounded-full bg-[#2E8B57]/10 px-2 py-0.5 text-[11px] font-medium text-[#2E8B57]">
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

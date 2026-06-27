"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, MoreVertical, Plus, Search } from "lucide-react";
import { deletePassageAction } from "@/app/actions/admin/deletePassage";
import { usePassageList } from "@/lib/hooks/usePassageList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function PassageInventory() {
  const { data: passages = [], isLoading } = usePassageList();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
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

  const filteredPassages = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return passages;

    return passages.filter((passage) =>
      [passage.title, passage.language, passage.testType, passage.level]
        .map((value) => String(value ?? "").toLowerCase())
        .some((value) => value.includes(normalizedSearch)),
    );
  }, [passages, search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this passage? Its quiz and questions will also be removed.")) {
      return;
    }

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
    <section className="space-y-6">
      <header className="rounded-[28px] border border-[#E1DDFB] bg-[linear-gradient(135deg,#FFFFFF_0%,#F7F4FF_100%)] p-5 shadow-[0_20px_60px_rgba(50,55,67,0.08)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6C4EEB]">
              Content Workspace
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#323743]">
              Passage inventory
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#575E6B]">
              Manage reading passages and their comprehension questions from one
              focused workspace.
            </p>
          </div>
          <Button
            asChild
            className="h-11 rounded-[14px] bg-[#6C4EEB] px-5 text-white shadow-[0_14px_32px_rgba(108,78,235,0.18)] hover:bg-[#5D43DE]"
          >
            <Link href="/admin/passages/create">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Passage
            </Link>
          </Button>
        </div>
      </header>

      <div className="rounded-[24px] border border-[#E4E8F5] bg-white/92 p-4 shadow-[0_16px_44px_rgba(50,55,67,0.06)]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B91A3]"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, language, test type, or grade"
            className="h-12 rounded-[14px] border-[#D6DDFB] bg-[#F8FAFF] pl-11 text-[#323743] placeholder:text-[#8B91A3] focus-visible:border-[#6C4EEB] focus-visible:ring-[#6C4EEB]/20"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-[#E4E8F5] bg-white">
          <div className="flex flex-col items-center gap-3 text-sm font-medium text-[#575E6B]">
            <Loader2 className="h-7 w-7 animate-spin text-[#6C4EEB]" />
            Loading passages...
          </div>
        </div>
      ) : filteredPassages.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#CFC7FA] bg-[#FCFBFF] px-6 py-14 text-center">
          <FileText className="mx-auto h-10 w-10 text-[#B3A4F1]" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-[#323743]">
            No passages found
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#575E6B]">
            Create a passage or adjust your search to review existing reading
            content.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPassages.map((passage) => {
            const wordCount =
              passage.content?.split(/\s+/).filter(Boolean).length || 0;

            return (
              <article
                key={passage.id}
                className="relative rounded-[22px] border border-[#E4E8F5] bg-white p-5 shadow-[0_14px_36px_rgba(50,55,67,0.06)] transition hover:-translate-y-0.5 hover:border-[#D6DDFB] hover:shadow-[0_20px_46px_rgba(50,55,67,0.09)]"
              >
                <div
                  className="absolute right-4 top-4 z-10"
                  ref={menuOpenId === passage.id ? menuRef : null}
                >
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-[12px] text-[#575E6B] transition hover:bg-[#F3F0FF] hover:text-[#6C4EEB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6C4EEB]/20"
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuOpenId(menuOpenId === passage.id ? null : passage.id);
                    }}
                    aria-label="Passage options"
                  >
                    <MoreVertical className="h-4 w-4" aria-hidden="true" />
                  </button>

                  {menuOpenId === passage.id && (
                    <div
                      className="absolute right-0 mt-2 w-36 overflow-hidden rounded-[14px] border border-[#E4E8F5] bg-white py-1 shadow-[0_18px_48px_rgba(50,55,67,0.14)]"
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-[#323743] transition hover:bg-[#F8FAFF]"
                        onClick={() => {
                          setMenuOpenId(null);
                          router.push(`/admin/passages/edit/${passage.id}`);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-700 transition hover:bg-red-50"
                        onClick={() => void handleDelete(passage.id)}
                        disabled={deletingId === passage.id}
                      >
                        {deletingId === passage.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>

                <Link
                  href={`/admin/passages/${passage.id}`}
                  className="block pr-9 outline-none focus-visible:rounded-[16px] focus-visible:ring-4 focus-visible:ring-[#6C4EEB]/20"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#F3F0FF] text-[#6C4EEB]">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 line-clamp-2 text-lg font-semibold leading-7 text-[#323743]">
                    {passage.title}
                  </h2>
                  <p className="mt-3 text-sm text-[#575E6B]">
                    {passage.language} content with {wordCount} words
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge>
                      {passage.testType === "PRE_TEST" ? "Pre-Test" : "Post-Test"}
                    </Badge>
                    <Badge variant="green">
                      {passage.level === 0
                        ? "Kindergarten"
                        : `Grade ${passage.level}`}
                    </Badge>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Badge({
  children,
  variant = "purple",
}: {
  children: React.ReactNode;
  variant?: "purple" | "green";
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
        variant === "purple"
          ? "border-[#DCD5FF] bg-[#F3F0FF] text-[#6C4EEB]"
          : "border-emerald-100 bg-emerald-50 text-emerald-700",
      )}
    >
      {children}
    </span>
  );
}

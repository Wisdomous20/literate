"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PassageWorkspaceHeader({
  passageId,
  title,
  active,
  action,
}: {
  passageId: string;
  title: string;
  active: "passage" | "questions";
  action?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-10 border-b border-[#D7E3F2] bg-white/94 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            onClick={() => router.push("/admin")}
            className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0C2D57] text-white shadow-[0_10px_24px_rgba(12,45,87,0.24)] transition hover:bg-[#163D70]"
            aria-label="Back to passages"
            title="Back to passages"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6F87A4]">
              Passage Workspace
            </p>
            <h1 className="mt-1 break-words text-xl font-semibold leading-tight text-[#0F2744] sm:text-2xl">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <ViewToggle passageId={passageId} active={active} />
          {action}
        </div>
      </div>
    </div>
  );
}

function ViewToggle({
  passageId,
  active,
}: {
  passageId: string;
  active: "passage" | "questions";
}) {
  const items = [
    {
      id: "passage" as const,
      label: "Passage",
      href: `/admin/passages/${passageId}/view`,
    },
    {
      id: "questions" as const,
      label: "Questions",
      href: `/admin/passages/${passageId}`,
    },
  ];

  return (
    <div className="inline-flex rounded-full border border-[#CFDDED] bg-[#F8FBFE] p-1 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            active === item.id
              ? "bg-[#0C2D57] text-white shadow-[0_6px_16px_rgba(12,45,87,0.18)]"
              : "text-[#33507A] hover:bg-white"
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

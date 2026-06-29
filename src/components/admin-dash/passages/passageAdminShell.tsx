"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText } from "lucide-react";
import { AccountMenu } from "@/components/admin-dash/accountMenu";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Passages",
    href: "/admin/passages",
    icon: BookOpenText,
    active: (pathname: string) =>
      pathname === "/admin/passages" ||
      pathname.startsWith("/admin/passages/"),
  },
];

export function PassageAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(179,164,241,0.22),transparent_24%),linear-gradient(180deg,#FCFBFF_0%,#F5F2FF_100%)]">
      <header className="sticky top-0 z-30 border-b border-[#E1DDFB]/90 bg-white">
        <div className="mx-auto flex min-h-[4.75rem] max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6C4EEB]">
              LiteRate Content
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#323743]">
              Passage Workspace
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <nav className="inline-flex rounded-[16px] border border-[#E1DDFB] bg-[#F8F6FF] p-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.active(pathname);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex h-10 items-center gap-2 rounded-[12px] px-3 text-sm font-semibold transition",
                      isActive
                        ? "bg-white text-[#6C4EEB] shadow-[0_8px_22px_rgba(50,55,67,0.08)]"
                        : "text-[#575E6B] hover:bg-white/70 hover:text-[#323743]",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <AccountMenu accent="violet" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}

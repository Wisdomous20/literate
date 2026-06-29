"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LayoutDashboard } from "lucide-react";
import { PassageAdminShell } from "@/components/admin-dash/passages/passageAdminShell";
import { AccountMenu } from "@/components/admin-dash/accountMenu";
import { cn } from "@/lib/utils";

const adminNavItems = [
  {
    label: "Control Center",
    href: "/admin",
    icon: LayoutDashboard,
    active: (pathname: string) => pathname === "/admin",
  },
  {
    label: "Activity Logs",
    href: "/admin/activity",
    icon: Activity,
    active: (pathname: string) => pathname === "/admin/activity",
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin/passages")) {
    return <PassageAdminShell>{children}</PassageAdminShell>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(124,198,254,0.22),transparent_24%),radial-gradient(circle_at_top_right,rgba(36,83,166,0.14),transparent_20%),linear-gradient(180deg,#F4F8FC_0%,#ECF3FA_100%)]">
      <header className="sticky top-0 z-30 border-b border-[#D6E3F8]/90 bg-white">
        <div className="mx-auto flex min-h-[4.75rem] max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#64809F]">
              Literate Platform
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#0C2D57]">
              Admin Console
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav
              className="inline-flex rounded-[16px] border border-[#D6E3F8] bg-[#F4F8FD] p-1"
              aria-label="Admin navigation"
            >
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.active(pathname);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex h-10 items-center gap-2 rounded-[12px] px-3 text-sm font-semibold transition",
                      isActive
                        ? "bg-white text-[#0C2D57] shadow-[0_8px_22px_rgba(15,23,42,0.08)]"
                        : "text-[#64809F] hover:bg-white/70 hover:text-[#16324F]",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <AccountMenu accent="navy" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}

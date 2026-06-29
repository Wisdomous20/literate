"use client";

import { usePathname } from "next/navigation";
import { PassageAdminShell } from "@/components/admin-dash/passages/passageAdminShell";
import { AccountMenu } from "@/components/admin-dash/accountMenu";

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
      <header className="sticky top-0 z-30 border-b border-[#D6E3F8]/90 bg-white/88 backdrop-blur">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#64809F]">
              Literate Platform
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#0C2D57]">
              Admin Console
            </h1>
          </div>
          <AccountMenu accent="navy" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}

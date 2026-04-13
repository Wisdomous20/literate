"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  ClipboardList,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

function getCurrentSchoolYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

const menuItems = [
  {
    label: "My Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Oral Reading Test",
    href: "/dashboard/oral-reading-test",
    icon: FileText,
  },
  {
    label: "Reading Fluency Test",
    href: "/dashboard/reading-fluency-test",
    icon: BookOpen,
  },
  {
    label: "Reading Comprehension Test",
    href: "/dashboard/reading-comprehension-test",
    icon: ClipboardList,
  },
];

const generalItems = [
  {
    label: "Settings",
    href: "/dashboard/settings-page",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const firstName = session?.user?.name?.split(" ")[0] || "User";
  const schoolYear = getCurrentSchoolYear();

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col shadow-[4px_0_20px_rgba(102,102,255,0.3)] transition-all duration-300 overflow-hidden",
        collapsed ? "w-20 min-w-20" : "w-65 min-w-65",
      )}
    >
      {/* Background: pure vector SVG wave pattern — scales perfectly at any size */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/LiteRate_Background.svg')" }}
      />

      {/* Collapse/expand toggle */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-[#6666FF] text-white shadow-lg ring-2 ring-white hover:bg-[#5555ee] transition-colors"
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
      </button>

      {/* Layer 3: All sidebar content sits above the background layers */}
      <div className="relative z-10 flex h-full flex-col">
        <div
          className={cn(
            "flex items-center gap-3 pb-2 pt-6",
            collapsed ? "justify-center px-2" : "px-8",
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center">
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
            >
              <path d="M16 4L6 10V22L16 28L26 22V10L16 4Z" fill="white" />
              <path
                d="M16 4L6 10M16 4L26 10M16 4V16M6 10V22L16 28M6 10L16 16M26 10V22L16 28M26 10L16 16M16 28V16"
                stroke="#6666FF"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          {!collapsed && <span className="text-xl font-bold tracking-[0.02em] text-white">LiteRate</span>}
        </div>

        {!collapsed ? (
          <div className="px-8 pb-4 pt-4">
            <h2 className="text-lg font-semibold text-white">Hi, Teacher {firstName}!</h2>
            <p className="text-sm text-white/70">S.Y {schoolYear}</p>
          </div>
        ) : (
          <div className="pb-4 pt-4" />
        )}

        <div className={cn("flex-1", collapsed ? "px-3" : "px-6")}>
          {!collapsed && <p className="mb-3 px-2 text-[11px] font-semibold tracking-[0.25em] text-white/90">MENU</p>}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all duration-200",
                    collapsed ? "justify-center px-0" : "px-2",
                    isActive ? "bg-[rgba(93,93,251,0.6)] text-white" : "text-white/90 hover:text-white",
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5D5DFB]">
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  {!collapsed && <span className="text-[13px]">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className={cn("my-5 h-px bg-white/30", collapsed ? "mx-1" : "mx-2")} />

          {!collapsed && (
            <p className="mb-3 px-2 text-[11px] font-semibold tracking-[0.25em] text-white/90">GENERAL</p>
          )}
          <nav className="space-y-1">
            {generalItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all duration-200",
                    collapsed ? "justify-center px-0" : "px-2",
                    isActive ? "bg-[rgba(93,93,251,0.6)] text-white" : "text-white/90 hover:text-white",
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5D5DFB]">
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  {!collapsed && <span className="text-[13px]">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={cn("h-px bg-white/30", collapsed ? "mx-3" : "mx-8")} />

        <div className={cn("p-6", collapsed && "flex justify-center")}>
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Logout Account" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-white/90 transition-all duration-200 hover:text-white",
              collapsed ? "w-auto justify-center" : "w-full",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5D5DFB]">
              <LogOut className="h-4 w-4 text-white" />
            </div>
            {!collapsed && <span className="text-[13px]">Logout Account</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
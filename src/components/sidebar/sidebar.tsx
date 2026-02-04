"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { getSchoolYear } from "@/utils/getSchoolYear";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  ClipboardList,
  Settings,
  LogOut,
} from "lucide-react";

const menuItems = [
  {
    label: "My Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Oral Reading Test",
    href: "/dashboard/oral-reading",
    icon: FileText,
  },
  {
    label: "Reading Fluency Test",
    href: "/dashboard/reading-fluency",
    icon: BookOpen,
  },
  {
    label: "Reading Comprehension Test",
    href: "/dashboard/reading-comprehension",
    icon: ClipboardList,
  },
];

const generalItems = [
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Get user's first name from session
  const firstName = session?.user?.name?.split(" ")[0] || "User";

  // Get the current school year from utility
  const schoolYear = getSchoolYear();

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/login" });
  };

  return (
    <aside className="relative flex h-screen flex-col w-[260px] min-w-[260px] bg-[#6666FF] shadow-[4px_0_20px_rgba(102,102,255,0.3)]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-8 pt-6 pb-2">
        <div className="flex h-8 w-8 items-center justify-center">
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
        <span className="text-xl font-bold text-white tracking-[0.02em]">
          LiteRate
        </span>
      </div>

      {/* User Greeting */}
      <div className="px-8 pt-4 pb-4">
        <h2 className="text-lg font-semibold text-white">
          Hi, Teacher {firstName}!
        </h2>
        <p className="text-sm text-white/70">S.Y {schoolYear}</p>
      </div>

      {/* Menu Section */}
      <div className="flex-1 px-6">
        <p className="mb-3 px-2 text-[11px] font-semibold text-white/90 tracking-[0.25em]">
          MENU
        </p>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-white bg-[rgba(93,93,251,0.6)]"
                    : "text-white/90 hover:text-white",
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5D5DFB]">
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-[13px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="my-5 mx-2 h-px bg-white/30" />

        {/* General Section */}
        <p className="mb-3 px-2 text-[11px] font-semibold text-white/90 tracking-[0.25em]">
          GENERAL
        </p>
        <nav className="space-y-1">
          {generalItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-white bg-[rgba(93,93,251,0.6)]"
                    : "text-white/90 hover:text-white",
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5D5DFB]">
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-[13px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Divider */}
      <div className="mx-8 h-px bg-white/30" />

      {/* Logout */}
      <div className="p-6">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-white/90 transition-all duration-200 hover:text-white"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5D5DFB]">
            <LogOut className="h-4 w-4 text-white" />
          </div>
          <span className="text-[13px]">Logout Account</span>
        </button>
      </div>
    </aside>
  );
}
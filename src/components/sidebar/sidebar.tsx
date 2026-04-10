"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Mic,
  Zap,
  BookOpen,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const menuItems = [
  {
    label: "My Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Oral Reading Test",
    href: "/dashboard/oral-reading-test",
    icon: Mic,
  },
  {
    label: "Reading Fluency Test",
    href: "/dashboard/reading-fluency-test",
    icon: Zap,
  },
  {
    label: "Reading Comprehension Test",
    href: "/dashboard/reading-comprehension-test",
    icon: BookOpen,
  },
];

const generalItems = [
  {
    label: "Settings",
    href: "/dashboard/settings-page",
    icon: Settings,
  },
];

function BookLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M32 12C24 12 18 14 12 18V52C18 48 24 46 32 46C40 46 46 48 52 52V18C46 14 40 12 32 12Z"
        fill="white"
        stroke="white"
        strokeWidth="2"
      />
      <path d="M32 12V46" stroke="#6666FF" strokeWidth="2" />
      <path
        d="M12 18C18 14 24 12 32 12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M52 18C46 14 40 12 32 12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col overflow-hidden bg-[#5D5DFB] transition-all duration-300",
        isCollapsed ? "w-20 min-w-20" : "w-64 min-w-64"
      )}
      style={{
        backgroundImage: "url('/images/sidebar-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Collapse Toggle Button */}
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-0 top-1/2 z-20 -translate-y-1/2 translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#5D5DFB] shadow-lg transition-colors hover:bg-gray-100"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Logo Section */}
      <div className="flex flex-col items-center pt-6 pb-4 px-4">
        <BookLogo className={cn("text-white transition-all duration-300", isCollapsed ? "h-10 w-10" : "h-14 w-14")} />
        {!isCollapsed && (
          <span className="mt-2 text-xl font-bold tracking-wide text-white">
            LiteRate
          </span>
        )}
      </div>

      {/* Menu Section */}
      <div className="flex-1 overflow-y-auto px-3">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-full py-2.5 px-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white text-[#5D5DFB] shadow-md"
                    : "text-white hover:bg-white/10",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-[#5D5DFB] text-white"
                      : "bg-white/20 text-white group-hover:bg-white/30"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="my-4 h-px bg-white/20 mx-2" />

        {/* General Section */}
        {!isCollapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-white/60">
            General
          </p>
        )}
        <nav className="space-y-1">
          {generalItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-full py-2.5 px-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white text-[#5D5DFB] shadow-md"
                    : "text-white hover:bg-white/10",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-[#5D5DFB] text-white"
                      : "bg-white/20 text-white group-hover:bg-white/30"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Upgrade to Premium Section */}
      {!isCollapsed && (
        <div className="px-3 pb-3">
          <div className="rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur-sm">
            <h3 className="text-sm font-bold text-[#00306E]">Upgrade to Premium</h3>
            <p className="mt-1 text-xs text-[#00306E]/70">
              Unlock unlimited assessments!
            </p>
            <button
              type="button"
              className="mt-3 w-full rounded-lg bg-[#5D5DFB] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#4a47c7]"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-white/20 mx-3" />

      {/* Logout Section */}
      <div className="p-3">
        <button
          type="button"
          onClick={handleLogout}
          title={isCollapsed ? "Logout Account" : undefined}
          className={cn(
            "group flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-all duration-200 text-white hover:bg-white/10",
            isCollapsed && "justify-center px-2"
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white group-hover:bg-white/30">
            <LogOut className="h-4 w-4" />
          </span>
          {!isCollapsed && <span>Logout Account</span>}
        </button>
      </div>
    </aside>
  );
}

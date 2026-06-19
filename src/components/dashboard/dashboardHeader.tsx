"use client";

import { useState } from "react";
import {
  BookOpenCheck,
  ChartNoAxesColumn,
  FileBarChart2,
  FileText,
  History,
  LayoutDashboard,
  Settings,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { QuickActions } from "./quickActions";

interface DashboardHeaderProps {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  schoolYear?: string;
}

export function DashboardHeader({
  title,
  icon,
  action,
  schoolYear = "",
}: DashboardHeaderProps) {
  const [showDrawer, setShowDrawer] = useState(false);

  const defaultIconByTitle: Record<string, React.ReactNode> = {
    "My Dashboard": <LayoutDashboard className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />,
    "Oral Reading Test": <BookOpenCheck className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />,
    "Reading Fluency Test": <Sparkles className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />,
    "Reading Comprehension Test": <FileText className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />,
    "Reading Level": <ChartNoAxesColumn className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />,
    "Assessment Report": <FileBarChart2 className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />,
    "Oral Fluency Test Report": <FileBarChart2 className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />,
    "Reading Comprehension Test Report": <FileBarChart2 className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />,
    Organization: <Users className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />,
    Subscription: <UserRound className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />,
    Settings: <Settings className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />,
  };

  const resolvedIcon = icon ?? defaultIconByTitle[title] ?? (
    <FileText className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />
  );

  return (
    <>
      <header
        data-tour-target="dashboard-header"
        className="relative flex min-h-16 items-center justify-between gap-3 overflow-hidden border-b-2 border-[#DED7FF] bg-white px-3 py-3 sm:px-4 md:px-6"
      >
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          {resolvedIcon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#DED7FF] bg-[#F3F0FF] md:h-10 md:w-10">
              {resolvedIcon}
            </div>
          )}
          <h1 className="min-w-0 truncate text-base font-bold tracking-tight text-[#4F46E5] sm:text-lg md:text-xl">
            {title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          {action && <div>{action}</div>}
          <button
            type="button"
            data-tour-target="recent-assessments-button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DDFB] bg-[#F1F5FF] text-[#6C4EEB] transition duration-200 hover:border-[#6C4EEB]/40 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6C4EEB]/20 md:h-10 md:w-10"
            aria-label="History"
            onClick={() => setShowDrawer(true)}
          >
            <History className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>
      </header>

      {/* Drawer/Sidebar */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setShowDrawer(false)}
          />
          <aside className="relative ml-auto flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#E0E7FF]">
              <h2 className="text-lg font-semibold text-[#00306E]">
                Recent Assessment
              </h2>
              <button
                className="rounded-full p-1 hover:bg-[#F0F4FF]"
                onClick={() => setShowDrawer(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5 text-[#5D5DFB]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#A855F7] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              <QuickActions schoolYear={schoolYear} minimal />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

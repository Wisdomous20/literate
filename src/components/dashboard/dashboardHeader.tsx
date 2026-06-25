"use client";

import { useState } from "react";
import {
  BookOpen,
  ChartNoAxesColumn,
  FileBarChart2,
  FileText,
  Gauge,
  HelpCircle,
  History,
  LayoutDashboard,
  Mic,
  Settings,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { OPEN_ONBOARDING_GUIDE_EVENT } from "@/components/onboarding/onboardingGuide";
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
    "Oral Reading Test": <Mic className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />,
    "Reading Fluency Test": <Gauge className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />,
    "Reading Comprehension Test": <BookOpen className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />,
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
        <div className="flex min-w-0 items-center gap-1.5 md:gap-2">
          {resolvedIcon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center md:h-10 md:w-10">
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
            className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#D6DDFB] bg-[#F1F5FF] px-3 text-xs font-semibold text-[#6C4EEB] transition duration-200 hover:border-[#6C4EEB]/40 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6C4EEB]/20 md:h-10 md:px-3.5 md:text-sm"
            aria-label="Open guide"
            onClick={() =>
              window.dispatchEvent(new Event(OPEN_ONBOARDING_GUIDE_EVENT))
            }
          >
            <HelpCircle className="h-4 w-4" />
            <span>Guide</span>
          </button>
          <button
            type="button"
            data-tour-target="recent-assessments-button"
            className="flex h-9 items-center gap-2 rounded-xl border border-[#D6DDFB] bg-[#F5F1FF] px-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#6C4EEB]/40 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6C4EEB]/20 md:h-10 md:px-3.5"
            aria-label="Recent assessment"
            onClick={() => setShowDrawer(true)}
          >
            <History className="h-4 w-4 shrink-0 text-[#6C4EEB] md:h-5 md:w-5" />
          </button>
        </div>
      </header>

      {/* Drawer/Sidebar */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#140C3A]/30 backdrop-blur-[2px]"
            onClick={() => setShowDrawer(false)}
          />
          <aside className="relative ml-auto flex h-full w-full max-w-sm animate-in slide-in-from-right-8 duration-300 flex-col bg-white shadow-2xl">
            <div className="border-b border-[#E0E7FF] bg-[#F7F2FF] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#6C4EEB]">
                    Recent Assessment
                  </h2>
                  <p className="mt-1 text-xs text-[#7C3AED]/70">
                    Review the latest student records
                  </p>
                </div>
                <button
                  className="rounded-full p-1 transition-colors hover:bg-white/80"
                  onClick={() => setShowDrawer(false)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-[#5D5DFB]" />
                </button>
              </div>
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

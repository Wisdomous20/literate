"use client";

import { useState } from "react";
import { LayoutDashboard, History, X } from "lucide-react";
import { QuickActions } from "./quickActions";

interface DashboardHeaderProps {
  title: string;
  action?: React.ReactNode;
  schoolYear?: string;
}

export function DashboardHeader({
  title,
  action,
  schoolYear = "",
}: DashboardHeaderProps) {
  const [showDrawer, setShowDrawer] = useState(false);

  return (
    <>
      <header
        data-tour-target="dashboard-header"
        className="flex h-16 md:h-17.5 items-center justify-between border-b-[3px] border-[#5D5DFB] bg-white px-4 md:px-6"
      >
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-[#5D5DFB]/10">
            <LayoutDashboard className="h-4 w-4 md:h-5 md:w-5 text-[#5D5DFB]" />
          </div>
          <h1 className="text-base md:text-lg font-semibold text-[#483efa]">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {action && <div>{action}</div>}
          <button
            type="button"
            data-tour-target="recent-assessments-button"
            className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full border border-[#5D5DFB]/30 text-[#5D5DFB] transition-colors hover:bg-[#5D5DFB]/10"
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
          <aside className="relative ml-auto h-full w-full max-w-sm bg-white shadow-2xl flex flex-col">
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
            <div className="flex-1 overflow-y-auto p-4">
              <QuickActions schoolYear={schoolYear} minimal />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { LayoutDashboard, Bell, HelpCircle, X } from "lucide-react";
import { QuickActions } from "./quickActions";

interface DashboardHeaderProps {
  title: string;
  action?: React.ReactNode;
  schoolYear?: string;
}

export function DashboardHeader({ title, action, schoolYear = "" }: DashboardHeaderProps) {
  const [showDrawer, setShowDrawer] = useState(false);

  return (
    <>
      <header className="flex h-16 md:h-17.5 items-center justify-between border-b border-[#8D8DEC] bg-white px-4 md:px-6 shadow-[0_4px_4px_#54A4FF]">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-[#5D5DFB]/10">
            <LayoutDashboard className="h-4 w-4 md:h-5 md:w-5 text-[#5D5DFB]" />
          </div>
          <h1 className="text-lg md:text-xl lg:text-2xl font-semibold text-[#31318A]">
            {title}
          </h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          {action && <div>{action}</div>}
          <button
            type="button"
            className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full border border-[#5D5DFB]/30 text-[#5D5DFB] transition-colors hover:bg-[#5D5DFB]/10"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full border border-[#5D5DFB]/30 text-[#5D5DFB] transition-colors hover:bg-[#5D5DFB]/10"
            aria-label="Help"
            onClick={() => setShowDrawer(true)}
          >
            <HelpCircle className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>
      </header>

      {/* Drawer/Sidebar */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setShowDrawer(false)}
          />
          {/* Sidebar */}
          <aside className="relative ml-auto h-full w-full max-w-sm bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#E0E7FF]">
              <h2 className="text-lg font-semibold text-[#00306E]">Recent Histories</h2>
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
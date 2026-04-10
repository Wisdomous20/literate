"use client";

import { LayoutDashboard, Bell, HelpCircle } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function DashboardHeader({ title, action }: DashboardHeaderProps) {
  return (
    <header className="flex h-16 md:h-[70px] items-center justify-between border-b border-[#8D8DEC] bg-white px-4 md:px-6 shadow-[0_4px_4px_#54A4FF]">
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
        >
          <HelpCircle className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      </div>
    </header>
  );
}

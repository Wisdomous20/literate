// "use client";

// import { LayoutDashboard } from "lucide-react";
// import React from "react";

// interface DashboardHeaderProps {
//   title: string;
//   action?: React.ReactNode;
// }

// export function DashboardHeader({ title, action }: DashboardHeaderProps) {
//   return (
//     <header className="flex h-13 items-center justify-between border-b border-primary/20 bg-card/80 px-4 shadow-[0_4px_24px_0_rgba(102,102,255,0.18)] md:h-15 md:px-6 lg:h-17.5 lg:px-8">
//       <div className="flex items-center gap-2">
//         <LayoutDashboard className="h-4 w-4 text-[#6666FF]" />
//         <h1 className="text-base font-semibold text-[#31318A] md:text-lg">{title}</h1>
//       </div>
//       {action && <div>{action}</div>}
//     </header>
//   );
// }

"use client";

import { LayoutDashboard, Clock } from "lucide-react";
import React, { useState } from "react";
import { RecentAssessmentsSidePanel } from "./recentAssessmentsSidePanel";

interface DashboardHeaderProps {
  title: string;
  action?: React.ReactNode;
  showRecentIcon?: boolean;
}

export function DashboardHeader({ title, action, showRecentIcon = true }: DashboardHeaderProps) {
  const [showRecentPanel, setShowRecentPanel] = useState(false);

  return (
    <>
      <header className="flex h-13 items-center justify-between border-b border-primary/20 bg-card/80 px-4 shadow-[0_4px_24px_0_rgba(102,102,255,0.18)] md:h-15 md:px-6 lg:h-17.5 lg:px-8">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4 text-[#6666FF]" />
          <h1 className="text-base font-semibold text-[#31318A] md:text-lg">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {showRecentIcon && (
            <button
              onClick={() => setShowRecentPanel(true)}
              className="rounded-full bg-[#6666FF]/10 p-2.5 text-[#6666FF] transition-all hover:bg-[#6666FF]/20 active:scale-95"
              title="Recent Assessments"
              aria-label="Recent Assessments"
              type="button"
            >
              <Clock className="h-5 w-5" />
            </button>
          )}
          {action && <div>{action}</div>}
        </div>
      </header>

      {showRecentPanel && (
        <RecentAssessmentsSidePanel
          onClose={() => setShowRecentPanel(false)}
        />
      )}
    </>
  );
}
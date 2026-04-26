"use client";

import type { ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import { ToastNotification } from "@/components/oral-reading-test/toastNotification";

interface TestPageLayoutProps {
  title: string;
  toast: { message: string; type: "success" | "error" } | null;
  onCloseToast: () => void;
  passageExpanded: boolean;
  sidebar?: ReactNode;
  children: ReactNode;
  overlay?: ReactNode;
  modal?: ReactNode;
}

export function TestPageLayout({
  title,
  toast,
  onCloseToast,
  passageExpanded,
  sidebar,
  children,
  overlay,
  modal,
}: TestPageLayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DashboardHeader title={title} />

      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={onCloseToast}
        />
      )}

      {overlay}

      <main className="flex min-h-0 flex-1 px-4 py-4 md:px-6 lg:px-8">
        <div className="flex min-h-0 flex-1 gap-4">
          <div
            data-tour-target="assessment-workspace"
            className={`flex min-h-0 flex-1 flex-col overflow-y-auto rounded-2xl border-t border-l border-r-2 border-b-2 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9] border-b-[#6653F9] bg-white shadow-[0_8px_32px_rgba(168,85,247,0.18)] ${
              passageExpanded ? "gap-0 p-2" : "gap-3 p-5"
            }`}
          >
            {children}
          </div>

          {sidebar && (
            <div
              data-tour-target="assessment-sidebar"
              className="w-60 shrink-0 md:w-67.5 lg:w-75 xl:w-[320px]"
            >
              {sidebar}
            </div>
          )}
        </div>
      </main>

      {modal}
    </div>
  );
}

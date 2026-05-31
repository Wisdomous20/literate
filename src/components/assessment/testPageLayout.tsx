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
    <div className="flex min-h-full flex-col bg-white md:h-full md:min-h-0 md:overflow-hidden">
      <DashboardHeader title={title} />

      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={onCloseToast}
        />
      )}

      {overlay}

      <main className="flex flex-1 overflow-y-auto bg-[#FBFAFF] px-3 py-3 pb-18 md:min-h-0 md:overflow-hidden md:bg-white md:px-6 md:py-4 lg:px-8">
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:min-h-0 lg:flex-row">
          <div
            data-tour-target="assessment-workspace"
            className={`flex min-w-0 flex-1 flex-col ${
              passageExpanded
                ? "min-h-[calc(100dvh-11rem)] overflow-hidden gap-0 lg:min-h-0"
                : "gap-3 lg:min-h-0 lg:overflow-y-auto"
            }`}
          >
            {children}
          </div>

          {sidebar && (
            <div
              data-tour-target="assessment-sidebar"
              className="min-w-0 shrink-0 lg:w-75 xl:w-[320px]"
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

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
            className={`flex min-h-0 flex-1 flex-col overflow-y-auto rounded-2xl border border-[#E8ECF4] bg-white shadow-[0px_2px_20px_rgba(108,164,239,0.12)] ${
              passageExpanded ? "gap-0 p-2" : "gap-3 p-5"
            }`}
          >
            {children}
          </div>

          {sidebar && (
            <div className="w-60 shrink-0 md:w-67.5 lg:w-75 xl:w-[320px]">
              {sidebar}
            </div>
          )}
        </div>
      </main>

      {modal}
    </div>
  );
}
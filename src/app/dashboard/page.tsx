"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import { WelcomeSection } from "@/components/dashboard/welcomeSection";
import { ClassInventory } from "@/components/dashboard/classInventory";
import { ClassificationChart } from "@/components/dashboard/classificationChart";
import { WordOfTheDay } from "@/components/dashboard/wordOfTheDay";
import { X, CheckCircle, XCircle, LayoutDashboard } from "lucide-react";

function getCurrentSchoolYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState<string>(
    getCurrentSchoolYear(),
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="flex min-h-full flex-col">
      {toast && (
        <div
          className={`fixed left-4 right-4 top-20 z-50 flex items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all duration-300 sm:left-auto sm:top-6 sm:w-full sm:max-w-sm ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0 text-red-500" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Close notification"
            title="Close notification"
            className="ml-1 rounded-full p-0.5 transition-colors hover:bg-gray-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <DashboardHeader title="My Dashboard" schoolYear={selectedYear} icon={<LayoutDashboard className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />} />

      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-4 md:gap-6 xl:flex-row">
          <div className="min-w-0 flex-1 space-y-4 md:space-y-6">
            <WelcomeSection schoolYear={selectedYear} />

            <ClassInventory
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              showToast={showToast}
            />
          </div>

          <div className="w-full shrink-0 space-y-4 md:space-y-6 xl:flex xl:h-full xl:w-95 xl:flex-col 2xl:w-105">
            <div className="min-h-80" data-tour-target="classification-chart">
              <ClassificationChart schoolYear={selectedYear} />
            </div>

            {/* Word of the Day */}
            <div className="xl:flex-1">
              <WordOfTheDay />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

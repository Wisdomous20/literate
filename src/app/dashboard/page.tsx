"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import { WelcomeSection } from "@/components/dashboard/welcomeSection";
import { ClassInventory } from "@/components/dashboard/classInventory";
import { ClassificationChart } from "@/components/dashboard/classificationChart";
import { WordOfTheDay } from "@/components/dashboard/wordOfTheDay";
import { LayoutDashboard } from "lucide-react";
import { ToastNotification } from "@/components/oral-reading-test/toastNotification";
import { getSchoolYear } from "@/utils/getSchoolYear";

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState<string>(
    getSchoolYear(),
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
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
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

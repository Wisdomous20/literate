"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import { WelcomeSection } from "@/components/dashboard/welcomeSection";
import { ClassInventory } from "@/components/dashboard/classInventory";
import { ClassificationChart } from "@/components/dashboard/classificationChart";
import { WordOfTheDay } from "@/components/dashboard/wordOfTheDay";
import { X, CheckCircle, XCircle } from "lucide-react";

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

  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "Teacher";

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="flex min-h-full flex-col overflow-y-auto">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg transition-all duration-300 ${
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

      <DashboardHeader title="My Dashboard" schoolYear={selectedYear} />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 space-y-6 min-w-0">
            <WelcomeSection
              teacherName={firstName}
              schoolYear={selectedYear}
              planType="Free User Plan"
            />

            <ClassInventory
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              showToast={showToast}
            />
          </div>

          <div className="w-full xl:w-95 2xl:w-[420px]2xl:w-105 space-y-6 shrink-0">
            <div className="min-h-80">
              <ClassificationChart schoolYear={selectedYear} />
            </div>

            {/* Word of the Day */}
            <WordOfTheDay />
          </div>
        </div>
      </main>
    </div>
  );
}

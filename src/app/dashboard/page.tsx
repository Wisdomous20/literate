"use client";

import { useState } from "react";
import { ClassInventory } from "@/components/dashboard/classInventory";
import { ClassificationChart } from "@/components/dashboard/classificationChart";
import { QuickActions } from "@/components/dashboard/quickActions";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
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
      <DashboardHeader title="My Dashboard" />
      <main className="flex flex-col gap-5 px-6 py-5 lg:px-8 lg:py-6">
        <ClassInventory
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          showToast={showToast}
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="min-h-90 lg:h-100">
            <ClassificationChart schoolYear={selectedYear} />
          </div>
          <div className="min-h-90 lg:h-100">
            <QuickActions schoolYear={selectedYear} />
          </div>
        </div>
      </main>
    </div>
  );
}

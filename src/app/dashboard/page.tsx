"use client";

import { useState } from "react";
import { ClassInventory } from "@/components/dashboard/classInventory";
import { ClassificationChart } from "@/components/dashboard/classificationChart";
import { QuickActions } from "@/components/dashboard/quickActions";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";

function getCurrentSchoolYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState<string>(
    getCurrentSchoolYear(),
  );

  return (
    <div className="flex min-h-full flex-col overflow-y-auto">
      <DashboardHeader title="My Dashboard" />
      <main className="flex flex-col gap-5 px-6 py-5 lg:px-8 lg:py-6">
        <ClassInventory
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
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

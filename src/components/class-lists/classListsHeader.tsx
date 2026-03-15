"use client";

import { DashboardHeader } from "@/components/dashboard/dashboardHeader";

interface ClassListsHeaderProps {
  onCreateStudent: () => void;
}

export function ClassListsHeader({ }: ClassListsHeaderProps) {
  return (
    <DashboardHeader
      title="Class Lists"
    />
  );
}
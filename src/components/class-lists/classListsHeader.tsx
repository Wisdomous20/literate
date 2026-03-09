"use client";

import { DashboardHeader } from "@/components/dashboard/dashboardHeader";

interface ClassListsHeaderProps {
  onCreateStudent: () => void;
}

export function ClassListsHeader({ onCreateStudent }: ClassListsHeaderProps) {
  return (
    <DashboardHeader
      title="Class Lists"
      action={
        <button
          onClick={onCreateStudent}
          type="button"
          className="rounded-md border border-[#7A7AFB] bg-[#6666FF] px-3.5 py-1.5 text-xs font-medium text-white shadow-[0px_1px_12px_rgba(65,155,180,0.35)] transition-opacity hover:opacity-90"
        >
          Create Student
        </button>
      }
    />
  );
}
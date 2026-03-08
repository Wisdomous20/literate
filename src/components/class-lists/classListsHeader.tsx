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
          className="rounded-lg border border-[#7A7AFB] bg-[#6666FF] px-5 py-2 text-sm font-medium text-white shadow-[0px_1px_20px_rgba(65,155,180,0.47)] transition-opacity hover:opacity-90"
        >
          Create Student
        </button>
      }
    />
  );
}
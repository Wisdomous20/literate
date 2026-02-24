"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ChevronDown } from "lucide-react";
import { ClassCard } from "@/components/auth/dashboard/classCard";
import { DashboardHeader } from "@/components/auth/dashboard/dashboardHeader";

type ClassCardVariant = "blue" | "yellow" | "cyan";

function getVariant(index: number): ClassCardVariant {
  const variants: ClassCardVariant[] = ["blue", "yellow", "cyan"];
  return variants[index % variants.length];
}

export interface ClassItem {
  id: string;
  name: string;
  studentCount: number;
  createdAt?: string;
  schoolYear?: string;
}

interface AllClassesPageProps {
  allClasses: ClassItem[];
  isLoading: boolean;
  error: string | null;
  refetch?: () => Promise<void>;
  schoolYears: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  onCreateClass?: () => void;
}

export default function AllClassesPage({
  allClasses,
  isLoading,
  error,
  refetch,
  schoolYears,
  selectedYear,
  onYearChange,
  onCreateClass,
}: AllClassesPageProps) {
  const router = useRouter();
  const [showLatest, setShowLatest] = useState(true);
  const [showOld, setShowOld] = useState(false);

  // Split classes into latest (3) and old (rest)
  const latestClasses = allClasses.slice(0, 3);
  const oldClasses = allClasses.slice(3);

  const handleClassClick = (classId: string) => {
    router.push(`/dashboard/class/${classId}`);
  };

  return (
    <div className="w-full min-h-screen bg-[#eaf6ff]">
      {/* Dashboard Header */}
      <DashboardHeader title="Class Inventory" />

      <div className="w-full px-2 sm:px-4 py-6">
        {/* Header Row */}
        <div className="flex flex-row items-center justify-between gap-4 mb-6">
          {/* Back to Dashboard */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 rounded-full p-2 hover:bg-gray-100 transition-colors"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5 text-[#00306E]" />
              <span className="text-[#00306E] font-medium text-sm">
                Back to Dashboard
              </span>
            </button>
          </div>
          {/* School Year Dropdown and Create Class Button */}
          <div className="flex items-center gap-3">
            <select
              className="rounded-lg border border-[#54a4ff] bg-[#f4fcfd] px-3 py-2 text-[#00306E] focus:outline-none"
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
            >
              {schoolYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {onCreateClass && (
              <button
                type="button"
                onClick={onCreateClass}
                className="rounded-full bg-[#2e2e68] hover:bg-[#2e2e68]/90 text-white font-medium px-6 py-2"
              >
                Create Class
              </button>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#6666FF]" />
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!isLoading && !error && allClasses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-[#00306E]/70 mb-2">No classes found.</p>
          </div>
        )}

        {!isLoading && !error && allClasses.length > 0 && (
          <div className="space-y-8">
            {/* Latest Classes */}
            <div>
              <button
                className="flex items-center gap-2 mb-2 text-lg font-semibold text-[#00306E] focus:outline-none"
                onClick={() => setShowLatest((v) => !v)}
              >
                Latest Classes
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${showLatest ? "rotate-180" : ""}`}
                />
              </button>
              {showLatest && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                  {latestClasses.map((c, idx) => (
                    <ClassCard
                      key={c.id}
                      classId={c.id}
                      name={c.name}
                      studentCount={c.studentCount}
                      variant={getVariant(idx)}
                      onClick={() => handleClassClick(c.id)}
                      onClassUpdated={refetch || (() => {})}
                    />
                  ))}
                </div>
              )}
            </div>
            {/* Old Classes */}
            {oldClasses.length > 0 && (
              <div>
                <button
                  className="flex items-center gap-2 mb-2 text-lg font-semibold text-[#00306E] focus:outline-none"
                  onClick={() => setShowOld((v) => !v)}
                >
                  Old Classes
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${showOld ? "rotate-180" : ""}`}
                  />
                </button>
                {showOld && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                    {oldClasses.map((c, idx) => (
                      <ClassCard
                        key={c.id}
                        classId={c.id}
                        name={c.name}
                        studentCount={c.studentCount}
                        variant={getVariant(idx + latestClasses.length)}
                        onClick={() => handleClassClick(c.id)}
                        onClassUpdated={refetch || (() => {})}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

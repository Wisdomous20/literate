"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ChevronDown } from "lucide-react";
import { ClassCard } from "@/components/dashboard/classCard";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";

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
  schoolYears,
  selectedYear,
  onYearChange,
  onCreateClass,
  refetch,
}: AllClassesPageProps) {
  const router = useRouter();
  const [showLatest, setShowLatest] = useState(true);
  const [showOld, setShowOld] = useState(false);

  const latestClasses = allClasses.slice(0, 3);
  const oldClasses = allClasses.slice(3);

  const handleClassClick = (classId: string) => {
    router.push(`/dashboard/class/${classId}`);
  };

  return (
    <div className="flex min-h-full flex-col overflow-y-auto">
      <DashboardHeader title="Class Inventory" />

      <div className="w-full px-4 sm:px-6 py-6 lg:px-8">
        <div className="flex flex-row items-center justify-between gap-4 mb-6">
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
         <div className="flex items-center gap-3">
  <div className="relative">
    <select
      id="schoolYear"
      name="schoolYear"
      className="rounded-full border border-dashed border-[#6666FF]/60 bg-[#afafef3e] px-4 py-1.5 text-sm text-[#00306E] font-medium min-w-28 h-9 transition-all focus:outline-none focus:border-[#6666FF]"
      value={selectedYear}
      onChange={(e) => onYearChange(e.target.value)}
      aria-label="Select school year"
    >
      {schoolYears.map((year) => (
        <option key={year} value={year} className="text-[#00306E]">
          {year}
        </option>
      ))}
    </select>
  </div>
  {onCreateClass && (
    <button
      type="button"
      onClick={onCreateClass}
      className="rounded-full border border-[#7A7AFB] bg-[#6666FF] px-6 py-2 text-sm font-semibold text-white shadow-[0px_1px_20px_rgba(65,155,180,0.47)] transition-opacity hover:opacity-90"
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
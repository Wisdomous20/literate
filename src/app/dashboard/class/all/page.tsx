"use client";
import AllClassesPage, { ClassItem } from "@/components/dashboard/allClasses";
import { createClass } from "@/app/actions/class/createClass";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CreateClassModal } from "@/components/dashboard/createClassModal";
import { useClassList } from "@/lib/hooks/useClassList";

function getCurrentSchoolYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function getNextSchoolYear(): string {
  const [startYear] = getCurrentSchoolYear().split("-").map(Number);
  return `${startYear + 1}-${startYear + 2}`;
}

const currentYear = getCurrentSchoolYear();
const nextYear = getNextSchoolYear();
const now = new Date();
const nextYearStart = new Date(Number(nextYear.split("-")[0]), 7, 1); // August 1st
const isNextYearDisabled = now < nextYearStart;

const yearsWithData = [currentYear];
if (!yearsWithData.includes(nextYear)) yearsWithData.push(nextYear);
yearsWithData.sort((a, b) => b.localeCompare(a));

export default function Page() {
  const years = useMemo(
    () => [getCurrentSchoolYear(), getNextSchoolYear()],
    [],
  );
  const [selectedYear, setSelectedYear] = useState<string>(years[0]);
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const {
    data: rawClasses,
    isLoading,
    error: fetchError,
  } = useClassList(selectedYear);

  const allClassesData: ClassItem[] = useMemo(() => {
    if (!rawClasses) return [];
    return rawClasses.map(
      (
        c: {
          id: string;
          name: string;
          studentCount: number;
          createdAt?: string | Date;
        },
        idx: number,
      ) => ({
        id: c.id,
        name: c.name,
        studentCount: c.studentCount,
        createdAt: c.createdAt
          ? typeof c.createdAt === "string"
            ? c.createdAt
            : new Date(c.createdAt).toISOString()
          : undefined,
        variant: (["blue", "yellow", "cyan"] as const)[idx % 3],
      }),
    );
  }, [rawClasses]);

  const error = fetchError?.message ?? null;

  const refetch = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["classes", selectedYear],
    });
  };

  const handleCreateClass = async (data: {
    className: string;
    schoolYear: string;
  }) => {
    const result = await createClass(data.className);
    if (result.success) {
      await queryClient.invalidateQueries({
        queryKey: ["classes", selectedYear],
      });
      setShowCreate(false);
      showToast("Class created successfully!", "success");
    } else {
      showToast(result.error || "Failed to create class.", "error");
    }
    return result;
  };

  return (
    <div>
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg transition-all duration-300 ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
          role="alert"
        >
          {toast.type === "success" ? (
            <svg
              className="h-4 w-4 shrink-0 text-green-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 shrink-0 text-red-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 9l-6 6m0-6l6 6"
              />
            </svg>
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Close notification"
            title="Close notification"
            className="ml-1 rounded-full p-0.5 transition-colors hover:bg-gray-200"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
      {showCreate && (
        <CreateClassModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onCreateClass={handleCreateClass}
          schoolYear={selectedYear} 
        />
      )}
      <AllClassesPage
        allClasses={allClassesData}
        isLoading={isLoading}
        error={error}
        schoolYears={years}
        refetch={refetch}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        onCreateClass={() => setShowCreate(true)}
        nextYear={nextYear}
        isNextYearDisabled={isNextYearDisabled}
        showToast={showToast}
        currentYear={currentYear}
      />
    </div>
  );
}

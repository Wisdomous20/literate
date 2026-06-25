"use client";
import AllClassesPage, { ClassItem } from "@/components/dashboard/allClasses";
import { createClass } from "@/app/actions/class/createClass";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CreateClassModal } from "@/components/dashboard/createClassModal";
import { useClassList } from "@/lib/hooks/useClassList";
import { ToastNotification } from "@/components/oral-reading-test/toastNotification";

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
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
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

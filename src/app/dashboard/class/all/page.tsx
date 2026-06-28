"use client";
import AllClassesPage, { ClassItem } from "@/components/dashboard/allClasses";
import { createClass } from "@/app/actions/class/createClass";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CreateClassModal } from "@/components/dashboard/createClassModal";
import { useClassList } from "@/lib/hooks/useClassList";
import { ToastNotification } from "@/components/oral-reading-test/toastNotification";
import { getSchoolYear } from "@/utils/getSchoolYear";

function getNextSchoolYear(): string {
  const [startYear] = getSchoolYear().split("-").map(Number);
  return `${startYear + 1}-${startYear + 2}`;
}

function getPreviousSchoolYear(): string {
  const [startYear] = getSchoolYear().split("-").map(Number);
  return `${startYear - 1}-${startYear}`;
}

const currentYear = getSchoolYear();
const nextYear = getNextSchoolYear();
const previousYear = getPreviousSchoolYear();
const now = new Date();
// The school year starts in June, so the next year only becomes selectable
// once June 1 of its starting year arrives. (Month index 5 = June.)
const nextYearStart = new Date(Number(nextYear.split("-")[0]), 5, 1);
const isNextYearDisabled = now < nextYearStart;

export default function Page() {
  const years = useMemo(
    () =>
      Array.from(
        new Set([
          getNextSchoolYear(),
          getSchoolYear(),
          getPreviousSchoolYear(),
        ]),
      ).sort((a, b) => b.localeCompare(a)),
    [],
  );
  const [selectedYear, setSelectedYear] = useState<string>(getSchoolYear());
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
        previousYear={previousYear}
      />
    </div>
  );
}

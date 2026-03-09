"use client";
import AllClassesPage, {
  ClassItem,
} from "@/components/dashboard/allClasses";
import { createClass } from "@/app/actions/class/createClass";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CreateClassModal } from "@/components/dashboard/createClassModal";
import { useClassList } from "@/lib/hooks/useClassList";

function getAllSchoolYears(): string[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const startYear = currentMonth >= 7 ? currentYear : currentYear - 1;
  const years: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const y = startYear - i;
    years.push(`${y}-${y + 1}`);
  }
  return years;
}

export default function Page() {
  const years = useMemo(() => getAllSchoolYears(), []);
  const [selectedYear, setSelectedYear] = useState<string>(years[0]);
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  // TanStack Query replaces useState + useEffect + useCallback
  const { data: rawClasses, isLoading, error: fetchError } = useClassList(selectedYear);

  // Transform the raw data into the shape AllClassesPage expects
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
        idx: number
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
      })
    );
  }, [rawClasses]);

  // Convert TanStack Query error to string | null for AllClassesPage
  const error = fetchError?.message ?? null;

  // Invalidate cache instead of manually refetching
  const refetch = async () => {
    await queryClient.invalidateQueries({ queryKey: ["classes", selectedYear] });
  };

  const handleCreateClass = async (data: {
    className: string;
    schoolYear: string;
  }) => {
    const result = await createClass(data.className);
    if (result.success) {
      await queryClient.invalidateQueries({ queryKey: ["classes", selectedYear] });
      setShowCreate(false);
    }
    return result;
  };

  return (
    <div>
      {showCreate && (
        <CreateClassModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onCreateClass={handleCreateClass}
        />
      )}
      <AllClassesPage
        allClasses={allClassesData}
        isLoading={isLoading}
        error={error}
        refetch={refetch}
        schoolYears={years}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        onCreateClass={() => setShowCreate(true)}
      />
    </div>
  );
}
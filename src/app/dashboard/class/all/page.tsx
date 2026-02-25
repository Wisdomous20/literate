"use client";
import AllClassesPage, { ClassItem } from "@/components/auth/dashboard/allClasses";
import { getClassListBySchoolYear } from "@/app/actions/class/getClassList";
import { createClass } from "@/app/actions/class/createClass";
import { useMemo, useState, useEffect, useCallback } from "react";
import { CreateClassModal } from "@/components/auth/dashboard/createClassModal";

function getAllSchoolYears(): string[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const baseYear = currentMonth >= 7 ? currentYear : currentYear - 1;
  const years: string[] = [];
  for (let i = 0; i < 3; i++) {
    years.push(`${baseYear - i}-${baseYear - i + 1}`);
  }
  return years;
}

type ApiClassItem = {
  id: string;
  name: string;
  studentCount: number;
  createdAt?: string | Date;
  schoolYear?: string;
};

export default function Page() {
  const years = useMemo(() => getAllSchoolYears(), []);
  const [selectedYear, setSelectedYear] = useState<string>(years[0]);
  const [showCreate, setShowCreate] = useState(false);

  // Remove caching: use local state for loading, error, and data
  const [allClassesData, setAllClassesData] = useState<ClassItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let result: ApiClassItem[] = [];
      const res = await getClassListBySchoolYear(selectedYear);
      if (res.success && Array.isArray(res.classes)) {
        result = result.concat(
          res.classes.map((c: ApiClassItem) => ({
            ...c,
            createdAt: c.createdAt
              ? typeof c.createdAt === "string"
                ? c.createdAt
                : new Date(c.createdAt).toISOString()
              : undefined,
            schoolYear: selectedYear,
          })),
        );
      }
      result.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return b.id.localeCompare(a.id);
      });
      setAllClassesData(
        result.map((item) => ({
          ...item,
          createdAt: item.createdAt
            ? typeof item.createdAt === "string"
              ? item.createdAt
              : new Date(item.createdAt).toISOString()
            : undefined,
        })) as ClassItem[],
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch classes");
      setAllClassesData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const refetch = fetchClasses;

  const handleCreateClass = async (data: {
    className: string;
    schoolYear: string;
  }) => {
    const result = await createClass(data.className);
    if (result.success) {
      await refetch();
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
        allClasses={allClassesData || []}
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
"use client";

import { useQuery } from "@tanstack/react-query";
import { getArchivedClassListBySchoolYear } from "@/app/actions/class/getArchivedClassList";

export function useArchivedClassList(schoolYear: string) {
  return useQuery({
    queryKey: ["archived-classes", schoolYear],
    queryFn: async () => {
      const result = await getArchivedClassListBySchoolYear(schoolYear);
      if (!result.success || !result.classes) {
        throw new Error(result.error || "Failed to fetch archived classes");
      }
      return result.classes;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!schoolYear,
  });
}

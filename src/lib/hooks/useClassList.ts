"use client"

import { useQuery } from "@tanstack/react-query"
import { getClassListBySchoolYear } from "@/app/actions/class/getClassList"

export function useClassList(schoolYear: string) {
  return useQuery({
    queryKey: ["classes", schoolYear],
    queryFn: async () => {
      const result = await getClassListBySchoolYear(schoolYear)
      if (!result.success || !result.classes) {
        throw new Error(result.error || "Failed to fetch classes")
      }
      return result.classes
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!schoolYear,
  })
}
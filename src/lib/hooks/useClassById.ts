"use client"

import { useQuery } from "@tanstack/react-query"
import { getClassById } from "@/app/actions/class/getClassById"

export function useClassById(classRoomId: string) {
  return useQuery({
    queryKey: ["class", classRoomId],
    queryFn: async () => {
      const result = await getClassById(classRoomId)
      if (!result.success || !result.classItem) {
        throw new Error(result.error || "Failed to fetch class")
      }
      return result.classItem
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!classRoomId,
  })
}
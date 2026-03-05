"use client"

import { useQuery } from "@tanstack/react-query"
import { getAllPassagesAction } from "@/app/actions/passage/getAllPassage"

export function usePassageList() {
  return useQuery({
    queryKey: ["passages"],
    queryFn: async () => {
      const result = await getAllPassagesAction()
      if (!result.success || !result.passages) {
        throw new Error(result.error || "Failed to fetch passages")
      }
      return result.passages
    },
    staleTime: 5 * 60 * 1000,
  })
}
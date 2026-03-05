"use client"

import { useQuery } from "@tanstack/react-query"
import { getPassageByIdAction } from "@/app/actions/passage/getPassageById"

export function usePassageById(passageId: string) {
  return useQuery({
    queryKey: ["passage", passageId],
    queryFn: async () => {
      const result = await getPassageByIdAction({ id: passageId })
      if (!result || !result.id) {
        throw new Error("Failed to fetch passage")
      }
      return result
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!passageId,
  })
}
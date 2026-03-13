"use client"

import { useQuery } from "@tanstack/react-query"
import { getAssessmentByIdAction } from "@/app/actions/assessment/getAssessmentById"

export function useAssessmentById(assessmentId: string | null) {
  return useQuery({
    queryKey: ["assessment", assessmentId],
    queryFn: async () => {
      const result = await getAssessmentByIdAction(assessmentId!)
      if (!result) {
        throw new Error("Failed to fetch assessment")
      }
      return result as Record<string, unknown>
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!assessmentId,
  })
}
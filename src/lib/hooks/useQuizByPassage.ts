"use client"

import { useQuery } from "@tanstack/react-query"
import { getQuizByPassageAction } from "@/app/actions/comprehension-Test/getQuizByPassage"

export function useQuizByPassage(passageId: string | undefined) {
  return useQuery({
    queryKey: ["quiz", passageId],
    queryFn: async () => {
      const result = await getQuizByPassageAction(passageId!)
      if (!result.success || !("quiz" in result) || !result.quiz) {
        throw new Error(
          ("error" in result && result.error) || "Failed to load quiz questions."
        )
      }
      return result.quiz
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!passageId,
  })
}
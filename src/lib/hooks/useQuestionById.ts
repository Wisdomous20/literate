"use client"

import { useQuery } from "@tanstack/react-query"
import { getQuestionByIdAction } from "@/app/actions/comprehension-Test/getQuestionById"

export function useQuestionById(questionId: string) {
  return useQuery({
    queryKey: ["question", questionId],
    queryFn: async () => {
      const result = await getQuestionByIdAction({ id: questionId })
      if (!result || !result.id) {
        throw new Error("Failed to fetch question")
      }
      return result
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!questionId,
  })
}
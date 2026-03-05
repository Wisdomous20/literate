"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllQuestionsAction } from "@/app/actions/comprehension-Test/getAllQuestion";

export function useQuestionList() {
  return useQuery({
    queryKey: ["questions"],
    queryFn: async () => {
      const result = await getAllQuestionsAction();
      if (!Array.isArray(result)) {
        throw new Error("Failed to fetch questions");
      }
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });
}

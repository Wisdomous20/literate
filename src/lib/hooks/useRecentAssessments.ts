"use client";

import { useQuery } from "@tanstack/react-query";
import { getRecentAssessments } from "@/app/actions/assessment/getRecentAssessments";
import type { RecentAssessmentItem } from "@/service/assessment/getRecentAssessmentsService";

export function useRecentAssessments(schoolYear?: string) {
  return useQuery({
    queryKey: ["recentAssessments", schoolYear],
    queryFn: async () => {
      const result = await getRecentAssessments(schoolYear);
      if (!result.success || !result.assessments) {
        throw new Error(result.error || "Failed to fetch recent assessments");
      }
      return result.assessments as RecentAssessmentItem[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
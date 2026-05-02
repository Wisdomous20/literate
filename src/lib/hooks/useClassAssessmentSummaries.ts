"use client";

import { useQuery } from "@tanstack/react-query";
import { getAssessmentSummariesByClass } from "@/app/actions/assessment/getAssessmentSummariesByClass";
import type { AssessmentSummaryData } from "@/types/assessment";

function deduplicateAssessments(assessments: AssessmentSummaryData[]) {
  const seen = new Set<string>();
  return assessments.filter((assessment) => {
    if (seen.has(assessment.id)) return false;
    seen.add(assessment.id);
    return true;
  });
}

export function useClassAssessmentSummaries(classRoomId: string) {
  return useQuery({
    queryKey: ["assessment-summaries", classRoomId],
    queryFn: async () => {
      const result = await getAssessmentSummariesByClass(classRoomId);
      return deduplicateAssessments(
        (result || []).map((assessment) => ({
          ...assessment,
          dateTaken: new Date(assessment.dateTaken).toISOString(),
        })),
      );
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled: !!classRoomId,
  });
}

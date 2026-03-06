// src/lib/hooks/useStudentAssessments.ts
"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { getAssessmentsByStudent } from "@/app/actions/assessment/getAssessment";
import type { AssessmentData } from "@/types/assessment";

/**
 * Fetch assessments for a single student. Used on report pages.
 */
export function useAssessmentsByStudent(studentId: string) {
  return useQuery({
    queryKey: ["assessments", studentId],
    queryFn: async () => {
      const result = await getAssessmentsByStudent(studentId);
      return (result || []) as AssessmentData[];
    },
    staleTime: 0, // Always refetch in background so newly submitted data (e.g. comprehension) appears immediately
    refetchOnWindowFocus: true,
    enabled: !!studentId,
  });
}

/**
 * Fetch assessments for multiple students at once. Used on the class page.
 * Each student gets its own cache entry so navigating back is instant.
 */
export function useStudentAssessments(studentIds: string[]) {
  const queries = useQueries({
    queries: studentIds.map((id) => ({
      queryKey: ["assessments", id],
      queryFn: async () => {
        const result = await getAssessmentsByStudent(id);
        return (result || []) as AssessmentData[];
      },
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      enabled: !!id,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);

  const data: Record<string, AssessmentData[]> = {};
  studentIds.forEach((id, index) => {
    data[id] = (queries[index]?.data || []) as AssessmentData[];
  });

  return { data, isLoading };
}
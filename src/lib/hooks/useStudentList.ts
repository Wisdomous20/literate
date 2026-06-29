"use client"

import { useQuery } from "@tanstack/react-query"
import { getStudentsByClassName } from "@/app/actions/student/getAllStudentByClass"

export interface Student {
  id: string
  name: string
  classId: string
  level?: number
}

export function useStudentList(className: string) {
  return useQuery({
    queryKey: ["students", className],
    queryFn: async () => {
      const result = await getStudentsByClassName(className)
      if (!result.success || !("students" in result) || !result.students) {
        throw new Error(result.error || "Failed to fetch students")
      }
      return result.students
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!className,
  })
}
"use client"

import { useQueries } from "@tanstack/react-query"
import { getStudentsByClassName } from "@/app/actions/student/getAllStudentByClass"

export interface StudentOption {
  id: string
  name: string
  level: number
  className: string
}

export function useAllStudentsByClasses(classes: string[]) {
  const queries = useQueries({
    queries: classes.map((cls) => ({
      queryKey: ["students", cls],
      queryFn: async () => {
        const result = await getStudentsByClassName(cls)
        if (result.success && "students" in result && result.students) {
          return result.students.map((s) => ({
            id: s.id,
            name: s.name,
            level: s.level ?? 0,
            className: cls,
          }))
        }
        return [] as StudentOption[]
      },
      staleTime: 5 * 60 * 1000,
      enabled: !!cls,
    })),
  })

  const isLoading = queries.some((q) => q.isLoading)
  const allStudents: StudentOption[] = queries.flatMap((q) => q.data ?? [])

  return { data: allStudents, isLoading }
}
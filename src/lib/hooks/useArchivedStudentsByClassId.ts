"use client";

import { useQuery } from "@tanstack/react-query";
import { getArchivedStudentsByClassId } from "@/app/actions/student/getArchivedStudentsByClassId";

export function useArchivedStudentsByClassId(classRoomId: string) {
  return useQuery({
    queryKey: ["archived-students", classRoomId],
    queryFn: async () => {
      const result = await getArchivedStudentsByClassId(classRoomId);
      if (!result.success || !result.students) {
        throw new Error(result.error || "Failed to fetch archived students");
      }
      return result.students;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!classRoomId,
  });
}

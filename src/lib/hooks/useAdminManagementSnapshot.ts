"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminManagementSnapshotAction } from "@/app/actions/admin/getManagementSnapshot";

export function useAdminManagementSnapshot() {
  return useQuery({
    queryKey: ["admin", "management-snapshot"],
    queryFn: async () => {
      const result = await getAdminManagementSnapshotAction();

      if (!result.success || !result.snapshot) {
        throw new Error(result.error ?? "Failed to load admin data");
      }

      return result.snapshot;
    },
    staleTime: 60 * 1000,
  });
}

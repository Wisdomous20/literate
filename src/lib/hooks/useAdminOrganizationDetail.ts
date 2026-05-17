"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminOrganizationDetailAction } from "@/app/actions/admin/getOrganizationDetail";

export function useAdminOrganizationDetail(organizationId: string) {
  return useQuery({
    queryKey: ["admin", "organization", organizationId],
    queryFn: async () => {
      const result = await getAdminOrganizationDetailAction(organizationId);

      if (!result.success || !result.organization) {
        throw new Error(result.error ?? "Failed to load organization");
      }

      return result.organization;
    },
    enabled: !!organizationId,
    staleTime: 60 * 1000,
  });
}

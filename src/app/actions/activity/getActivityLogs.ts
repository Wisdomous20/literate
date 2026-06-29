"use server";

import { getActivityLogs } from "@/service/activity/activityLogService";
import { requireRole } from "@/utils/roleCheck";

export async function getActivityLogsAction() {
  const session = await requireRole("SUPER_ADMIN");
  const logs = await getActivityLogs({
    actor: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    },
  });

  return logs.map((log) => ({
    id: log.id,
    actorEmail: log.actorEmail,
    actorRole: log.actorRole,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    entityTitle: log.entityTitle,
    metadata: log.metadata,
    createdAt: log.createdAt,
  }));
}

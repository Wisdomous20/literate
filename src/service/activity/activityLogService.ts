import { prisma } from "@/lib/prisma";
import type { userType } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { Prisma as PrismaRuntime } from "@/generated/prisma/client";

export type ActivityLogAction =
  | "PASSAGE_CREATED"
  | "PASSAGE_UPDATED"
  | "PASSAGE_DELETED"
  | "QUIZ_CREATED"
  | "QUIZ_UPDATED"
  | "QUESTION_CREATED"
  | "QUESTION_UPDATED"
  | "QUESTION_DELETED"
  | "USER_ROLE_UPDATED"
  | "USER_DISABLED"
  | "USER_ENABLED"
  | "ORGANIZATION_RENAMED"
  | "MEMBERSHIP_REMOVED"
  | "PASSAGE_ADMIN_INVITED"
  | "SUPER_ADMIN_INVITED";

export type ActivityLogEntityType =
  | "passage"
  | "quiz"
  | "question"
  | "user"
  | "organization"
  | "membership"
  | "invitation";

export interface ActivityLogActor {
  id: string;
  email?: string | null;
  role: userType;
}

interface RecordActivityLogInput {
  actor: ActivityLogActor;
  action: ActivityLogAction;
  entityType: ActivityLogEntityType;
  entityId?: string | null;
  entityTitle?: string | null;
  metadata?: Prisma.InputJsonValue;
}

type ActivityLogRecord = {
  id: string;
  actorUserId: string;
  actorEmail: string | null;
  actorRole: userType;
  action: string;
  entityType: string;
  entityId: string | null;
  entityTitle: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
};

type ActivityLogDelegate = {
  create(args: {
    data: {
      actorUserId: string;
      actorEmail?: string | null;
      actorRole: userType;
      action: ActivityLogAction;
      entityType: ActivityLogEntityType;
      entityId?: string | null;
      entityTitle?: string | null;
      metadata?: Prisma.InputJsonValue;
    };
  }): Promise<ActivityLogRecord>;
  findMany(args: {
    where?: { actorUserId: string };
    orderBy: { createdAt: "desc" };
    take: number;
  }): Promise<ActivityLogRecord[]>;
};

function getActivityLogDelegate() {
  return (prisma as unknown as { activityLog?: ActivityLogDelegate }).activityLog;
}

export async function recordActivityLog(input: RecordActivityLogInput) {
  try {
    const activityLog = getActivityLogDelegate();

    if (activityLog) {
      await activityLog.create({
        data: {
          actorUserId: input.actor.id,
          actorEmail: input.actor.email,
          actorRole: input.actor.role,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          entityTitle: input.entityTitle,
          metadata: input.metadata,
        },
      });
      return;
    }

    await prisma.$executeRaw(
      PrismaRuntime.sql`
        INSERT INTO "activity_logs" (
          "id",
          "actorUserId",
          "actorEmail",
          "actorRole",
          "action",
          "entityType",
          "entityId",
          "entityTitle",
          "metadata"
        )
        VALUES (
          ${crypto.randomUUID()},
          ${input.actor.id},
          ${input.actor.email ?? null},
          ${input.actor.role}::"userType",
          ${input.action},
          ${input.entityType},
          ${input.entityId ?? null},
          ${input.entityTitle ?? null},
          ${JSON.stringify(input.metadata ?? null)}::jsonb
        )
      `,
    );
  } catch (error) {
    console.error("Failed to record activity log:", error);
  }
}

export async function getActivityLogs(input: {
  actor?: ActivityLogActor;
  limit?: number;
}) {
  const limit = Math.min(Math.max(input.limit ?? 80, 1), 200);
  const where =
    input.actor?.role === "PASSAGE_MANAGER"
      ? { actorUserId: input.actor.id }
      : undefined;

  try {
    const activityLog = getActivityLogDelegate();

    if (activityLog) {
      return await activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    }

    if (where) {
      return await prisma.$queryRaw<ActivityLogRecord[]>(
        PrismaRuntime.sql`
          SELECT
            "id",
            "actorUserId",
            "actorEmail",
            "actorRole",
            "action",
            "entityType",
            "entityId",
            "entityTitle",
            "metadata",
            "createdAt"
          FROM "activity_logs"
          WHERE "actorUserId" = ${where.actorUserId}
          ORDER BY "createdAt" DESC
          LIMIT ${limit}
        `,
      );
    }

    return await prisma.$queryRaw<ActivityLogRecord[]>(
      PrismaRuntime.sql`
        SELECT
          "id",
          "actorUserId",
          "actorEmail",
          "actorRole",
          "action",
          "entityType",
          "entityId",
          "entityTitle",
          "metadata",
          "createdAt"
        FROM "activity_logs"
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `,
    );
  } catch (error) {
    console.error("Failed to load activity logs:", error);
    return [];
  }
}

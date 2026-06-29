"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Loader2 } from "lucide-react";
import { getActivityLogsAction } from "@/app/actions/activity/getActivityLogs";
import { cn } from "@/lib/utils";

const actionLabels: Record<string, string> = {
  PASSAGE_CREATED: "Created passage",
  PASSAGE_UPDATED: "Updated passage",
  PASSAGE_DELETED: "Deleted passage",
  QUIZ_CREATED: "Created quiz",
  QUIZ_UPDATED: "Updated quiz",
  QUESTION_CREATED: "Created question",
  QUESTION_UPDATED: "Updated question",
  QUESTION_DELETED: "Deleted question",
  USER_ROLE_UPDATED: "Updated user role",
  USER_DISABLED: "Disabled user",
  USER_ENABLED: "Enabled user",
  ORGANIZATION_RENAMED: "Renamed organization",
  MEMBERSHIP_REMOVED: "Removed membership",
  PASSAGE_ADMIN_INVITED: "Invited passage admin",
  SUPER_ADMIN_INVITED: "Invited super admin",
};

export function ActivityLogView({ showHeader = true }: { showHeader?: boolean }) {
  const activityQuery = useQuery({
    queryKey: ["activity-logs"],
    queryFn: getActivityLogsAction,
  });
  const logs = activityQuery.data ?? [];

  return (
    <section className="space-y-6">
      {showHeader && (
        <header className="rounded-[28px] border border-[#E1DDFB] bg-[linear-gradient(135deg,#FFFFFF_0%,#F7F4FF_100%)] p-5 shadow-[0_20px_60px_rgba(50,55,67,0.08)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6C4EEB]">
            Activity
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#323743]">
            Activity logs
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#575E6B]">
            Review content changes and super admin movement from one audit trail.
          </p>
        </header>
      )}

      <div className="overflow-hidden rounded-[24px] border border-[#E4E8F5] bg-white shadow-[0_16px_44px_rgba(50,55,67,0.06)]">
        {activityQuery.isLoading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-sm font-medium text-[#575E6B]">
              <Loader2 className="h-7 w-7 animate-spin text-[#6C4EEB]" />
              Loading activity...
            </div>
          </div>
        ) : activityQuery.isError ? (
          <div className="px-6 py-8 text-sm font-medium text-red-700">
            Activity is unavailable.
          </div>
        ) : logs.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Activity className="mx-auto h-10 w-10 text-[#B3A4F1]" />
            <h2 className="mt-4 text-xl font-semibold text-[#323743]">
              No activity yet
            </h2>
            <p className="mt-2 text-sm text-[#575E6B]">
              Admin and content changes will appear here once movement begins.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EEF1F7]">
            {logs.map((log) => (
              <article
                key={log.id}
                className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
                        log.action.includes("DELETED") ||
                          log.action.includes("REMOVED") ||
                          log.action.includes("DISABLED")
                          ? "bg-red-50 text-red-700"
                          : "bg-[#F3F0FF] text-[#6C4EEB]",
                      )}
                    >
                      {actionLabels[log.action] ?? log.action}
                    </span>
                    <span className="text-xs font-medium text-[#8B91A3]">
                      {log.actorEmail ?? "Unknown user"}
                    </span>
                    <span className="rounded-full bg-[#F7FAFD] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6E85A0]">
                      {formatRole(log.actorRole)}
                    </span>
                  </div>
                  <p className="mt-2 truncate font-semibold text-[#323743]">
                    {log.entityTitle ??
                      `${formatEntity(log.entityType)} ${log.entityId ?? ""}`}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#8B91A3]">
                    {formatEntity(log.entityType)}
                  </p>
                </div>
                <time className="text-sm font-medium text-[#575E6B] sm:text-right">
                  {formatDateTime(log.createdAt)}
                </time>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function formatDateTime(value: Date | string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEntity(value: string) {
  return value
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatRole(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

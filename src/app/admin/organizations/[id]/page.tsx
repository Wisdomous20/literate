"use client";

import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, ShieldCheck, Users } from "lucide-react";
import { toggleAdminUserStatusAction } from "@/app/actions/admin/toggleUserStatus";
import { useAdminOrganizationDetail } from "@/lib/hooks/useAdminOrganizationDetail";

export default function AdminOrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const organizationId = params.id as string;

  const organizationQuery = useAdminOrganizationDetail(organizationId);
  const organization = organizationQuery.data;

  async function refresh() {
    await queryClient.invalidateQueries({
      queryKey: ["admin", "organization", organizationId],
    });
    await queryClient.invalidateQueries({
      queryKey: ["admin", "management-snapshot"],
    });
  }

  if (organizationQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2453A6]" />
      </div>
    );
  }

  if (organizationQuery.isError || !organization) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        {organizationQuery.error instanceof Error
          ? organizationQuery.error.message
          : "Organization unavailable."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-[30px] border border-[#D9E5F5] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-6">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0C2D57] text-white transition hover:bg-[#163D70]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7B92AC]">
                Organization
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#0F2744]">
                {organization.name}
              </h1>
              <p className="mt-2 text-sm leading-7 text-[#64809F]">
                Owner: {organization.ownerName} ({organization.ownerEmail})
              </p>
            </div>
          </div>

          <div className="grid min-w-[280px] grid-cols-2 gap-3">
            <SummaryCard label="Members" value={String(organization.totalMemberCount)} />
            <SummaryCard label="Active" value={String(organization.activeMemberCount)} />
            <SummaryCard label="Pending" value={String(organization.pendingInvitations)} />
            <SummaryCard label="Plan" value={organization.subscriptionPlan ?? "No plan"} />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[30px] border border-[#D9E5F5] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
        <div className="border-b border-[#E7EEF7] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2453A6]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7B92AC]">
                Members
              </p>
              <p className="text-sm text-[#64809F]">
                Review all organization members and enable or disable them here.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {organization.members.map((member) => (
            <article
              key={member.membershipId}
              className="rounded-[24px] border border-[#DCE7F5] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFE_100%)] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-[#102A43]">
                      {member.name}
                    </h3>
                    {member.isOwner && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF4FF] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2453A6]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Owner
                      </span>
                    )}
                    <span className="rounded-full bg-[#F4F8FD] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#33507A]">
                      {member.role}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                        member.isDisabled
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {member.isDisabled ? "Disabled" : "Active"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#64809F]">{member.email}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#7B92AC]">
                    Joined {formatDate(member.joinedAt)}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={member.isOwner}
                  onClick={async () => {
                    const result = await toggleAdminUserStatusAction(
                      member.userId,
                      !member.isDisabled
                    );

                    if (!result.success) {
                      alert(result.error ?? "Failed to update member");
                      return;
                    }

                    await refresh();
                  }}
                  className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    member.isDisabled
                      ? "bg-[#0C2D57] text-white hover:bg-[#163D70]"
                      : "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  }`}
                >
                  {member.isOwner
                    ? "Owner locked"
                    : member.isDisabled
                      ? "Enable member"
                      : "Disable member"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[#DDE7F4] bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B92AC]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#16324F]">
        {value}
      </p>
    </div>
  );
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

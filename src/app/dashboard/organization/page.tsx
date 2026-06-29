"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import { AddMemberCard } from "@/components/dashboard/organization/addMemberCard";
import {
  CreateOrgPanel,
  ErrorBanner,
} from "@/components/dashboard/organization/organizationEmptyStates";
import { OrganizationHero } from "@/components/dashboard/organization/organizationHero";
import {
  InvitationSentDialog,
  ResetPasswordDialog,
  TempPasswordDialog,
} from "@/components/dashboard/organization/organizationDialogs";
import { OrgSummaryCard } from "@/components/dashboard/organization/orgSummaryCard";
import { MembersCard } from "@/components/dashboard/organization/membersCard";
import type {
  InvitationSentInfo,
  Member,
  OrgSummary,
  TempPasswordInfo,
} from "@/components/dashboard/organization/types";
import { getMembersAction } from "@/app/actions/org/getMembers";
import { toggleMemberAction } from "@/app/actions/org/toggleMember";
import { generateMemberPasswordAction } from "@/app/actions/org/generateMemberPassword";
import { updateMemberRoleAction } from "@/app/actions/org/updateMemberRole";
import { removeMemberAction } from "@/app/actions/org/removeMember";

const organizationQueryKey = ["organization", "members"];

export default function OrganizationPage() {
  const [tempPassword, setTempPassword] = useState<TempPasswordInfo | null>(null);
  const [invitationSent, setInvitationSent] = useState<InvitationSentInfo | null>(
    null
  );
  const [passwordTarget, setPasswordTarget] = useState<Member | null>(null);
  const queryClient = useQueryClient();

  const organizationQuery = useQuery({
    queryKey: organizationQueryKey,
    queryFn: async () => {
      const res = await getMembersAction();

      if (!res.success) {
        if (res.error === "No organization found") {
          return {
            needsOrgCreation: true,
            organization: null,
            members: [],
          };
        }

        throw new Error(res.error ?? "Failed to load organization");
      }

      return {
        needsOrgCreation: false,
        organization: ("organization" in res ? res.organization : null) as OrgSummary | null,
        members: (("members" in res ? res.members : []) as Member[]) ?? [],
      };
    },
  });

  const toggleMemberMutation = useMutation({
    mutationFn: async ({
      memberId,
      disable,
      organizationId,
    }: {
      memberId: string;
      disable: boolean;
      organizationId: string;
    }) => {
      const res = await toggleMemberAction(memberId, disable, organizationId);
      if (!res.success) {
        throw new Error(res.error ?? "Failed to update member");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationQueryKey });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      memberId,
      role,
      organizationId,
    }: {
      memberId: string;
      role: "ADMIN" | "USER";
      organizationId: string;
    }) => {
      const res = await updateMemberRoleAction(memberId, role, organizationId);
      if (!res.success) {
        throw new Error(res.error ?? "Failed to update member role");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationQueryKey });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({
      memberId,
      organizationId,
    }: {
      memberId: string;
      organizationId: string;
    }) => {
      const res = await removeMemberAction(memberId, organizationId);
      if (!res.success) {
        throw new Error(res.error ?? "Failed to remove member");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationQueryKey });
    },
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: organizationQueryKey });
  };

  if (organizationQuery.isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <DashboardHeader title="Organization" />
        <main className="flex min-h-0 flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#6666FF]" />
        </main>
      </div>
    );
  }

  if (organizationQuery.isError) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <DashboardHeader title="Organization" />
        <main className="flex min-h-0 flex-1 items-center justify-center px-6">
          <ErrorBanner
            message={organizationQuery.error.message ?? "Organization not available"}
          />
        </main>
      </div>
    );
  }

  const needsOrgCreation = organizationQuery.data?.needsOrgCreation ?? false;
  const org = organizationQuery.data?.organization ?? null;
  const members = organizationQuery.data?.members ?? [];

  if (needsOrgCreation) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <DashboardHeader title="Organization" />
        <CreateOrgPanel onCreated={refresh} />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <DashboardHeader title="Organization" />
        <main className="flex min-h-0 flex-1 items-center justify-center px-6">
          <ErrorBanner message="Organization not available" />
        </main>
      </div>
    );
  }

  const seatsRemaining = Math.max(org.maxMembers - org.currentMembers, 0);
  const disabledMembers = Math.max(org.totalMembers - org.currentMembers, 0);

  const generatePassword = async (member: Member) => {
    const res = await generateMemberPasswordAction(member.id, org.id);
    if (!res.success) {
      alert(res.error);
      return;
    }

    if (
      "password" in res &&
      res.password &&
      "email" in res &&
      res.email
    ) {
      setTempPassword({
        email: res.email,
        password: res.password,
      });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DashboardHeader title="Organization" />

      <main className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(102,102,255,0.14),transparent_28%),linear-gradient(180deg,#F8F9FF_0%,#EFF3FF_100%)] px-4 py-5 sm:px-6 sm:py-6 xl:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <OrganizationHero
            disabledMembers={disabledMembers}
            org={org}
            seatsRemaining={seatsRemaining}
          />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.82fr)] xl:items-start">
            <OrgSummaryCard org={org} onRenamed={refresh} />

            <AddMemberCard
              organizationId={org.id}
              seatsRemaining={seatsRemaining}
              onInvited={(info) => {
                setInvitationSent(info);
                void refresh();
              }}
            />
          </div>

          <MembersCard
            members={members}
            onRoleChange={async (member, role) => {
              try {
                await updateRoleMutation.mutateAsync({
                  memberId: member.id,
                  organizationId: org.id,
                  role,
                });
              } catch (error) {
                alert(
                  error instanceof Error
                    ? error.message
                    : "Failed to update member role"
                );
              }
            }}
            onToggle={async (member, disable) => {
              try {
                await toggleMemberMutation.mutateAsync({
                  memberId: member.id,
                  organizationId: org.id,
                  disable,
                });
              } catch (error) {
                alert(
                  error instanceof Error ? error.message : "Failed to update member"
                );
              }
            }}
            onRemove={async (member) => {
              try {
                await removeMemberMutation.mutateAsync({
                  memberId: member.id,
                  organizationId: org.id,
                });
              } catch (error) {
                alert(
                  error instanceof Error
                    ? error.message
                    : "Failed to remove member"
                );
              }
            }}
            onResetPassword={(member) => setPasswordTarget(member)}
            onGeneratePassword={generatePassword}
          />
        </div>
      </main>

      <TempPasswordDialog
        info={tempPassword}
        onClose={() => setTempPassword(null)}
      />
      <InvitationSentDialog
        info={invitationSent}
        onClose={() => setInvitationSent(null)}
      />
      <ResetPasswordDialog
        member={passwordTarget}
        organizationId={org.id}
        onClose={() => setPasswordTarget(null)}
      />
    </div>
  );
}

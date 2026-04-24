"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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

export default function OrganizationPage() {
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [needsOrgCreation, setNeedsOrgCreation] = useState(false);

  const [org, setOrg] = useState<OrgSummary | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  const [tempPassword, setTempPassword] = useState<TempPasswordInfo | null>(null);
  const [invitationSent, setInvitationSent] = useState<InvitationSentInfo | null>(
    null
  );
  const [passwordTarget, setPasswordTarget] = useState<Member | null>(null);

  const refresh = useCallback(async () => {
    const res = await getMembersAction();
    if (!res.success) {
      if (res.error === "No organization found") {
        setNeedsOrgCreation(true);
        setOrg(null);
        setMembers([]);
      } else {
        setPageError(res.error ?? "Failed to load organization");
      }
      setLoading(false);
      return;
    }

    setNeedsOrgCreation(false);
    setPageError(null);

    if ("organization" in res) {
      setOrg(res.organization ?? null);
    }
    if ("members" in res) {
      setMembers((res.members as Member[]) ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex min-h-full flex-col">
        <DashboardHeader title="Organization" />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#6666FF]" />
        </main>
      </div>
    );
  }

  if (needsOrgCreation) {
    return (
      <div className="flex min-h-full flex-col">
        <DashboardHeader title="Organization" />
        <CreateOrgPanel onCreated={refresh} />
      </div>
    );
  }

  if (pageError || !org) {
    return (
      <div className="flex min-h-full flex-col">
        <DashboardHeader title="Organization" />
        <main className="flex flex-1 items-center justify-center px-6">
          <ErrorBanner message={pageError ?? "Organization not available"} />
        </main>
      </div>
    );
  }

  const seatsRemaining = Math.max(org.maxMembers - org.currentMembers, 0);
  const disabledMembers = Math.max(org.totalMembers - org.currentMembers, 0);

  return (
    <div className="flex min-h-full flex-col">
      <DashboardHeader title="Organization" />

      <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top_left,rgba(102,102,255,0.14),transparent_28%),linear-gradient(180deg,#F8F9FF_0%,#EFF3FF_100%)] px-4 py-5 sm:px-6 sm:py-6 xl:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <OrganizationHero
            disabledMembers={disabledMembers}
            org={org}
            seatsRemaining={seatsRemaining}
          />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.82fr)] xl:items-start">
            <OrgSummaryCard org={org} onRenamed={refresh} />

            <AddMemberCard
              seatsRemaining={seatsRemaining}
              onInvited={(info) => {
                setInvitationSent(info);
                void refresh();
              }}
            />
          </div>

          <MembersCard
            members={members}
            onToggle={async (member, disable) => {
              const res = await toggleMemberAction(member.id, disable);
              if (!res.success) {
                alert(res.error);
                return;
              }
              await refresh();
            }}
            onResetPassword={(member) => setPasswordTarget(member)}
            onGeneratePassword={async (member) => {
              const res = await generateMemberPasswordAction(member.id);
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
            }}
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
        onClose={() => setPasswordTarget(null)}
      />
    </div>
  );
}

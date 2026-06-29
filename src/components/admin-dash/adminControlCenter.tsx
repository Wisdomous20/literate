"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Building2,
  FileText,
  KeyRound,
  Loader2,
  MailPlus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { updateAdminUserRoleAction } from "@/app/actions/admin/updateUserRole";
import { toggleAdminUserStatusAction } from "@/app/actions/admin/toggleUserStatus";
import { renameOrganizationByAdminAction } from "@/app/actions/admin/renameOrganization";
import { invitePassageAdminAction } from "@/app/actions/admin/invitePassageAdmin";
import { inviteSuperAdminAction } from "@/app/actions/admin/inviteSuperAdmin";
import { useAdminManagementSnapshot } from "@/lib/hooks/useAdminManagementSnapshot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActivityLogView } from "@/components/admin-dash/passages/activityLogView";
import { cn } from "@/lib/utils";
import { isSeededSuperAdminEmail } from "@/config/protectedAccounts";

type AdminTab =
  | "users"
  | "organizations"
  | "passages"
  | "passageAdmins"
  | "superAdmins";

const queryKey = ["admin", "management-snapshot"];

const tabs: {
  id: AdminTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "passages", label: "Passages", icon: FileText },
  { id: "passageAdmins", label: "Passage Admins", icon: ShieldCheck },
  { id: "superAdmins", label: "Super Admins", icon: KeyRound },
  { id: "users", label: "Users", icon: Users },
  { id: "organizations", label: "Organizations", icon: Building2 },
];

const roleOptions = ["TEACHER", "PASSAGE_MANAGER", "ORG_ADMIN", "SUPER_ADMIN"] as const;

export function AdminControlCenter() {
  const [activeTab, setActiveTab] = useState<AdminTab>("passages");
  const [search, setSearch] = useState("");
  const [passageAdminEmail, setPassageAdminEmail] = useState("");
  const [superAdminEmail, setSuperAdminEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [superAdminInviteMessage, setSuperAdminInviteMessage] = useState<
    string | null
  >(null);
  const [superAdminInviteError, setSuperAdminInviteError] = useState<
    string | null
  >(null);
  const queryClient = useQueryClient();
  const managementQuery = useAdminManagementSnapshot();

  const refreshSnapshot = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };

  const roleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: string;
    }) => {
      const result = await updateAdminUserRoleAction(userId, role);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to update role");
      }
    },
    onSuccess: refreshSnapshot,
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      userId,
      disable,
    }: {
      userId: string;
      disable: boolean;
    }) => {
      const result = await toggleAdminUserStatusAction(userId, disable);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to update user status");
      }
    },
    onSuccess: refreshSnapshot,
  });

  const organizationMutation = useMutation({
    mutationFn: async ({
      organizationId,
      name,
    }: {
      organizationId: string;
      name: string;
    }) => {
      const result = await renameOrganizationByAdminAction(organizationId, name);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to rename organization");
      }
    },
    onSuccess: refreshSnapshot,
  });

  const invitePassageAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      const result = await invitePassageAdminAction({ email });
      if (!result.success) {
        throw new Error(result.error ?? "Failed to send invitation");
      }
      if (!result.invitation) {
        throw new Error("Invitation was not created");
      }
      return result.invitation;
    },
    onSuccess: async (invitation) => {
      setInviteError(null);
      setInviteMessage(`Invitation sent to ${invitation.email}.`);
      setPassageAdminEmail("");
      await refreshSnapshot();
    },
    onError: (error) => {
      setInviteMessage(null);
      setInviteError(
        error instanceof Error ? error.message : "Failed to send invitation",
      );
    },
  });

  const inviteSuperAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      const result = await inviteSuperAdminAction({ email });
      if (!result.success) {
        throw new Error(result.error ?? "Failed to send invitation");
      }
      if (!result.invitation) {
        throw new Error("Invitation was not created");
      }
      return result.invitation;
    },
    onSuccess: async (invitation) => {
      setSuperAdminInviteError(null);
      setSuperAdminInviteMessage(`Invitation sent to ${invitation.email}.`);
      setSuperAdminEmail("");
      await refreshSnapshot();
    },
    onError: (error) => {
      setSuperAdminInviteMessage(null);
      setSuperAdminInviteError(
        error instanceof Error ? error.message : "Failed to send invitation",
      );
    },
  });

  const snapshot = managementQuery.data;
  const normalizedSearch = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!snapshot) {
      return null;
    }

    const matches = (...values: Array<string | number | null | undefined>) =>
      normalizedSearch.length === 0 ||
      values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(normalizedSearch)
      );

    return {
      users: snapshot.users.filter((user) =>
        matches(user.name, user.email, user.role)
      ),
      organizations: snapshot.organizations.filter((organization) =>
        matches(
          organization.name,
          organization.ownerName,
          organization.ownerEmail,
          organization.subscriptionPlan
        )
      ),
      passages: snapshot.passages.filter((passage) =>
        matches(passage.title, passage.language, passage.testType, passage.level)
      ),
      passageAdmins: snapshot.users.filter((user) =>
        user.role === "PASSAGE_MANAGER" && matches(user.name, user.email)
      ),
      superAdmins: snapshot.users.filter((user) =>
        user.role === "SUPER_ADMIN" && matches(user.name, user.email)
      ),
    };
  }, [normalizedSearch, snapshot]);

  if (managementQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2453A6]" />
      </div>
    );
  }

  if (managementQuery.isError || !snapshot || !filtered) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        {managementQuery.error instanceof Error
          ? managementQuery.error.message
          : "Admin data is unavailable."}
      </div>
    );
  }

  const busy =
    roleMutation.isPending ||
    statusMutation.isPending ||
    organizationMutation.isPending ||
    invitePassageAdminMutation.isPending ||
    inviteSuperAdminMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-[32px] border border-[#D6E3F8] bg-[linear-gradient(135deg,#0C2D57_0%,#2453A6_42%,#7CC6FE_100%)] text-white shadow-[0_28px_80px_rgba(7,34,73,0.24)]">
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
              Platform Control
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-white lg:text-4xl">
              Admin management for users, organizations, and memberships
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78">
              Review the full account graph in one place, make controlled access
              changes, and keep the content inventory visible without leaving the
              admin workspace.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 self-start">
            <OverviewKpi
              label="Active Users"
              value={snapshot.overview.activeUsers}
              hint={`${snapshot.overview.disabledUsers} disabled`}
            />
            <OverviewKpi
              label="Organizations"
              value={snapshot.overview.totalOrganizations}
              hint={`${snapshot.overview.subscribedOrganizations} subscribed`}
            />
            <OverviewKpi
              label="Memberships"
              value={snapshot.overview.totalMemberships}
              hint={`${snapshot.overview.organizationOwners} owners`}
            />
            <OverviewKpi
              label="Passages"
              value={snapshot.overview.totalPassages}
              hint="Content inventory"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#D9E5F5] bg-white/92 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                    activeTab === tab.id
                      ? "bg-[#0C2D57] text-white shadow-[0_12px_28px_rgba(12,45,87,0.24)]"
                      : "bg-[#F4F8FD] text-[#33507A] hover:bg-[#E8F0FA]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users, orgs, memberships, passages"
              className="h-11 min-w-[280px] rounded-full border-[#CCD9EA] bg-[#F5F9FD] px-4 text-sm text-[#16324F] placeholder:text-[#7B92AC]"
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full border-[#C7D8EE] bg-white px-4 text-[#16324F]"
              onClick={() => void refreshSnapshot()}
              disabled={busy}
            >
              Refresh
            </Button>
          </div>
        </div>
      </section>

      {activeTab === "users" && (
        <section className="rounded-[28px] border border-[#D9E5F5] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)]">
          <SectionHeader
            eyebrow="Accounts"
            title="Users"
            description="Update roles and account status for every user in the platform."
            count={filtered.users.length}
          />
          <div className="overflow-x-auto px-4 pb-4 sm:px-6 sm:pb-6">
            <table className="min-w-full border-separate border-spacing-y-4">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#6E85A0]">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Organizations</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.users.map((user) => {
                  const isSeededAdmin = isSeededSuperAdminEmail(user.email);

                  return (
                    <tr key={user.id} className="text-sm text-[#16324F]">
                      <td className="rounded-l-[22px] border-y border-l border-[#E4EBF5] bg-[#FBFCFE] px-4 py-5 align-top shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                        <div className="font-semibold text-[#0F2744]">{user.name}</div>
                        <div className="mt-1 text-xs text-[#6E85A0]">{user.email}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
                          <span className="rounded-full bg-[#EAF2FF] px-2.5 py-1 text-[#2453A6]">
                            {user.isVerified ? "Verified" : "Unverified"}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1",
                              user.isDisabled
                                ? "bg-red-100 text-red-700"
                                : "bg-emerald-100 text-emerald-700"
                            )}
                          >
                            {user.isDisabled ? "Disabled" : "Active"}
                          </span>
                          {isSeededAdmin && (
                            <span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[#C2410C]">
                              Protected
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="border-y border-[#E4EBF5] bg-white px-4 py-5 align-top">
                        <select
                          value={user.role}
                          disabled={busy || isSeededAdmin}
                          onChange={async (event) => {
                            try {
                              await roleMutation.mutateAsync({
                                userId: user.id,
                                role: event.target.value,
                              });
                            } catch (error) {
                              alert(
                                error instanceof Error
                                  ? error.message
                                  : "Failed to update role"
                              );
                            }
                          }}
                          className="h-10 rounded-full border border-[#C9D8EC] bg-white px-3 text-sm font-medium text-[#16324F] outline-none disabled:cursor-not-allowed disabled:opacity-60"
                          title={
                            isSeededAdmin
                              ? "The seeded super admin role is protected."
                              : undefined
                          }
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border-y border-l border-[#EDF2F8] bg-[#F7FAFD] px-4 py-5 align-top text-sm text-[#4D6785]">
                        <div>{user.membershipCount} memberships</div>
                        <div className="mt-1 text-xs text-[#7F94AE]">
                          {user.ownedOrganizationCount} owned organizations
                        </div>
                      </td>
                      <td className="border-y border-l border-[#EDF2F8] bg-white px-4 py-5 align-top text-sm text-[#4D6785]">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="rounded-r-[22px] border-y border-l border-r border-[#E4EBF5] bg-[#FBFCFE] px-4 py-5 align-top">
                        <Button
                          type="button"
                          variant={user.isDisabled ? "default" : "outline"}
                          className={cn(
                            "h-10 rounded-full px-4",
                            user.isDisabled
                              ? "bg-[#2453A6] text-white hover:bg-[#1C468D]"
                              : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          )}
                          disabled={busy || (isSeededAdmin && !user.isDisabled)}
                          title={
                            isSeededAdmin && !user.isDisabled
                              ? "The seeded super admin cannot be disabled."
                              : undefined
                          }
                          onClick={async () => {
                            try {
                              await statusMutation.mutateAsync({
                                userId: user.id,
                                disable: !user.isDisabled,
                              });
                            } catch (error) {
                              alert(
                                error instanceof Error
                                  ? error.message
                                  : "Failed to update user status"
                              );
                            }
                          }}
                        >
                          {user.isDisabled ? "Enable User" : "Disable User"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.users.length === 0 && <EmptyState label="users" />}
          </div>
        </section>
      )}

      {activeTab === "passageAdmins" && (
        <section className="space-y-5">
          <div className="rounded-[28px] border border-[#D9E5F5] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)]">
            <SectionHeader
              eyebrow="Content Access"
              title="Passage Admins"
              description="Invite and manage accounts that can only maintain passages, quizzes, and questions."
              count={filtered.passageAdmins.length}
              action={
                <span className="inline-flex items-center gap-2 rounded-full border border-[#DCD5FF] bg-[#F3F0FF] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#6C4EEB]">
                  <MailPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  Invite only
                </span>
              }
            />

            <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
              <div className="rounded-[22px] border border-[#E1DDFB] bg-[#FCFBFF] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#F3F0FF] text-[#6C4EEB]">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#323743]">
                      Invite a passage admin
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#575E6B]">
                      Send a password setup link for content management only.
                    </p>
                  </div>
                </div>

                <form
                  className="mt-5 flex flex-col gap-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setInviteMessage(null);
                    setInviteError(null);
                    try {
                      await invitePassageAdminMutation.mutateAsync(passageAdminEmail);
                    } catch {
                      // onError renders the inline message.
                    }
                  }}
                >
                  <Input
                    type="email"
                    value={passageAdminEmail}
                    onChange={(event) => setPassageAdminEmail(event.target.value)}
                    placeholder="passage.admin@example.com"
                    className="h-11 rounded-[14px] border-[#D6DDFB] bg-white px-4 text-sm text-[#323743] placeholder:text-[#8B91A3] focus-visible:border-[#6C4EEB] focus-visible:ring-[#6C4EEB]/20"
                    disabled={busy}
                    required
                  />
                  <Button
                    type="submit"
                    className="h-11 rounded-[14px] bg-[#6C4EEB] px-5 text-white hover:bg-[#5D43DE]"
                    disabled={busy}
                  >
                    {invitePassageAdminMutation.isPending
                      ? "Sending..."
                      : "Send Invite"}
                  </Button>
                </form>

                {(inviteMessage || inviteError) && (
                  <p
                    className={cn(
                      "mt-3 text-sm font-medium",
                      inviteError ? "text-red-700" : "text-emerald-700",
                    )}
                    role={inviteError ? "alert" : "status"}
                  >
                    {inviteError ?? inviteMessage}
                  </p>
                )}
              </div>

              <div className="rounded-[22px] border border-[#E4EBF5] bg-[#FBFCFE] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#323743]">
                      Passage-admin accounts
                    </h3>
                    <p className="mt-1 text-sm text-[#575E6B]">
                      Review status and revoke access when needed.
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#575E6B]">
                    {filtered.passageAdmins.length} active role
                  </span>
                </div>

                <div className="mt-4 divide-y divide-[#E7EEF7]">
                  {filtered.passageAdmins.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#323743]">
                          {user.name}
                        </p>
                        <p className="mt-1 truncate text-sm text-[#575E6B]">
                          {user.email}
                        </p>
                        <div className="mt-2 flex gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1",
                              user.isDisabled
                                ? "bg-red-100 text-red-700"
                                : "bg-emerald-100 text-emerald-700",
                            )}
                          >
                            {user.isDisabled ? "Disabled" : "Active"}
                          </span>
                          <span className="rounded-full bg-[#F3F0FF] px-2.5 py-1 text-[#6C4EEB]">
                            Passage Admin
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 rounded-full border-[#DCD5FF] bg-white px-4 text-[#6C4EEB]"
                          disabled={busy}
                          onClick={async () => {
                            try {
                              await roleMutation.mutateAsync({
                                userId: user.id,
                                role: "TEACHER",
                              });
                            } catch (error) {
                              alert(
                                error instanceof Error
                                  ? error.message
                                  : "Failed to revoke access",
                              );
                            }
                          }}
                        >
                          Revoke Role
                        </Button>
                        <Button
                          type="button"
                          variant={user.isDisabled ? "default" : "outline"}
                          className={cn(
                            "h-10 rounded-full px-4",
                            user.isDisabled
                              ? "bg-[#6C4EEB] text-white hover:bg-[#5D43DE]"
                              : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
                          )}
                          disabled={busy}
                          onClick={async () => {
                            try {
                              await statusMutation.mutateAsync({
                                userId: user.id,
                                disable: !user.isDisabled,
                              });
                            } catch (error) {
                              alert(
                                error instanceof Error
                                  ? error.message
                                  : "Failed to update user status",
                              );
                            }
                          }}
                        >
                          {user.isDisabled ? "Enable" : "Disable"}
                        </Button>
                      </div>
                    </div>
                  ))}

                  {filtered.passageAdmins.length === 0 && (
                    <div className="rounded-[18px] border border-dashed border-[#DCD5FF] bg-white px-4 py-8 text-center text-sm text-[#575E6B]">
                      No passage admins match your search.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#D9E5F5] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6E85A0]">
                  Activity Logs
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#0F2744]">
                  Passage-admin movement
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[#64809F]">
                  Track content changes across passages, quizzes, and questions.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F4F8FD] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#33507A]">
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                Activity
              </span>
            </div>
            <ActivityLogView showHeader={false} />
          </div>
        </section>
      )}

      {activeTab === "organizations" && (
        <section className="rounded-[28px] border border-[#D9E5F5] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)]">
          <SectionHeader
            eyebrow="Tenancy"
            title="Organizations"
            description="Review ownership, seat capacity, and update organization names from a single list."
            count={filtered.organizations.length}
          />
          <div className="grid gap-4 px-4 pb-4 sm:px-6 sm:pb-6 xl:grid-cols-2">
            {filtered.organizations.map((organization) => (
              <article
                key={organization.id}
                className="rounded-[24px] border border-[#DCE7F5] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFE_100%)] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[#0F2744]">
                      {organization.name}
                    </h3>
                    <p className="mt-1 text-sm text-[#64809F]">
                      Owner: {organization.ownerName} ({organization.ownerEmail})
                    </p>
                  </div>
                  <span className="rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#2453A6]">
                    {organization.subscriptionPlan ?? "No plan"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#33507A]">
                  <MiniMetric
                    label="Members"
                    value={String(organization.memberCount)}
                  />
                  <MiniMetric
                    label="Active"
                    value={String(organization.activeMemberCount)}
                  />
                  <MiniMetric
                    label="Pending Invites"
                    value={String(organization.pendingInvitations)}
                  />
                  <MiniMetric
                    label="Seat Limit"
                    value={String(organization.maxMembers ?? "-")}
                  />
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Input
                    defaultValue={organization.name}
                    id={`rename-${organization.id}`}
                    className="h-11 rounded-full border-[#D6E3F8] bg-white"
                  />
                  <Button
                    type="button"
                    className="h-11 rounded-full bg-[#0C2D57] px-5 text-white hover:bg-[#163D70]"
                    disabled={busy}
                    onClick={async () => {
                      const input = document.getElementById(
                        `rename-${organization.id}`
                      ) as HTMLInputElement | null;
                      const name = input?.value ?? "";

                      try {
                        await organizationMutation.mutateAsync({
                          organizationId: organization.id,
                          name,
                        });
                      } catch (error) {
                        alert(
                          error instanceof Error
                            ? error.message
                            : "Failed to rename organization"
                        );
                      }
                    }}
                  >
                    Save Name
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-full border-[#C9D8EC] bg-white px-5 text-[#16324F]"
                  >
                    <Link href={`/admin/organizations/${organization.id}`}>View Org</Link>
                  </Button>
                </div>
              </article>
            ))}
            {filtered.organizations.length === 0 && <EmptyState label="organizations" />}
          </div>
        </section>
      )}

      {activeTab === "superAdmins" && (
        <section className="rounded-[28px] border border-[#D9E5F5] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)]">
          <SectionHeader
            eyebrow="Platform Access"
            title="Super Admins"
            description="Invite and manage accounts with full control over users, organizations, content, and platform settings."
            count={filtered.superAdmins.length}
            action={
              <span className="inline-flex items-center gap-2 rounded-full border border-[#BFD2EA] bg-[#EAF2FF] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#0C2D57]">
                <MailPlus className="h-3.5 w-3.5" aria-hidden="true" />
                Invite only
              </span>
            }
          />

          <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
            <div className="rounded-[22px] border border-[#D9E5F5] bg-[#FBFCFE] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#EAF2FF] text-[#0C2D57]">
                  <KeyRound className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#323743]">
                    Invite a super admin
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[#575E6B]">
                    Send a password setup link for full platform administration.
                  </p>
                </div>
              </div>

              <form
                className="mt-5 flex flex-col gap-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setSuperAdminInviteMessage(null);
                  setSuperAdminInviteError(null);
                  try {
                    await inviteSuperAdminMutation.mutateAsync(superAdminEmail);
                  } catch {
                    // onError renders the inline message.
                  }
                }}
              >
                <Input
                  type="email"
                  value={superAdminEmail}
                  onChange={(event) => setSuperAdminEmail(event.target.value)}
                  placeholder="super.admin@example.com"
                  className="h-11 rounded-[14px] border-[#C9D8EC] bg-white px-4 text-sm text-[#323743] placeholder:text-[#8B91A3] focus-visible:border-[#0C2D57] focus-visible:ring-[#0C2D57]/20"
                  disabled={busy}
                  required
                />
                <Button
                  type="submit"
                  className="h-11 rounded-[14px] bg-[#0C2D57] px-5 text-white hover:bg-[#163D70]"
                  disabled={busy}
                >
                  {inviteSuperAdminMutation.isPending ? "Sending..." : "Send Invite"}
                </Button>
              </form>

              {(superAdminInviteMessage || superAdminInviteError) && (
                <p
                  className={cn(
                    "mt-3 text-sm font-medium",
                    superAdminInviteError ? "text-red-700" : "text-emerald-700",
                  )}
                  role={superAdminInviteError ? "alert" : "status"}
                >
                  {superAdminInviteError ?? superAdminInviteMessage}
                </p>
              )}
            </div>

            <div className="rounded-[22px] border border-[#E4EBF5] bg-[#FBFCFE] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#323743]">
                    Super-admin accounts
                  </h3>
                  <p className="mt-1 text-sm text-[#575E6B]">
                    Review status and remove full access when needed.
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#575E6B]">
                  {filtered.superAdmins.length} active role
                </span>
              </div>

              <div className="mt-4 divide-y divide-[#E7EEF7]">
                {filtered.superAdmins.map((user) => {
                  const isSeededAdmin = isSeededSuperAdminEmail(user.email);

                  return (
                    <div
                      key={user.id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#323743]">
                          {user.name}
                        </p>
                        <p className="mt-1 truncate text-sm text-[#575E6B]">
                          {user.email}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1",
                              user.isDisabled
                                ? "bg-red-100 text-red-700"
                                : "bg-emerald-100 text-emerald-700",
                            )}
                          >
                            {user.isDisabled ? "Disabled" : "Active"}
                          </span>
                          <span className="rounded-full bg-[#EAF2FF] px-2.5 py-1 text-[#0C2D57]">
                            Super Admin
                          </span>
                          {isSeededAdmin && (
                            <span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[#C2410C]">
                              Protected
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 rounded-full border-[#C9D8EC] bg-white px-4 text-[#0C2D57]"
                          disabled={busy || isSeededAdmin}
                          title={
                            isSeededAdmin
                              ? "The seeded super admin role is protected."
                              : undefined
                          }
                          onClick={async () => {
                            try {
                              await roleMutation.mutateAsync({
                                userId: user.id,
                                role: "TEACHER",
                              });
                            } catch (error) {
                              alert(
                                error instanceof Error
                                  ? error.message
                                  : "Failed to revoke access",
                              );
                            }
                          }}
                        >
                          Revoke Role
                        </Button>
                        <Button
                          type="button"
                          variant={user.isDisabled ? "default" : "outline"}
                          className={cn(
                            "h-10 rounded-full px-4",
                            user.isDisabled
                              ? "bg-[#0C2D57] text-white hover:bg-[#163D70]"
                              : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
                          )}
                          disabled={busy || (isSeededAdmin && !user.isDisabled)}
                          title={
                            isSeededAdmin && !user.isDisabled
                              ? "The seeded super admin cannot be disabled."
                              : undefined
                          }
                          onClick={async () => {
                            try {
                              await statusMutation.mutateAsync({
                                userId: user.id,
                                disable: !user.isDisabled,
                              });
                            } catch (error) {
                              alert(
                                error instanceof Error
                                  ? error.message
                                  : "Failed to update user status",
                              );
                            }
                          }}
                        >
                          {user.isDisabled ? "Enable" : "Disable"}
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {filtered.superAdmins.length === 0 && (
                  <div className="rounded-[18px] border border-dashed border-[#C9D8EC] bg-white px-4 py-8 text-center text-sm text-[#575E6B]">
                    No super admins match your search.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === "passages" && (
        <section className="rounded-[28px] border border-[#D9E5F5] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)]">
          <SectionHeader
            eyebrow="Content"
            title="Passages"
            description="Keep the academic content inventory visible alongside account administration."
            count={filtered.passages.length}
            action={
              <Button asChild className="h-11 rounded-full bg-[#0C2D57] px-4 text-white hover:bg-[#163D70]">
                <Link href="/admin/passages/create">Create Passage</Link>
              </Button>
            }
          />
          <div className="grid gap-4 px-4 pb-4 sm:px-6 sm:pb-6 xl:grid-cols-3">
            {filtered.passages.map((passage) => (
              <article
                key={passage.id}
                className="rounded-[22px] border border-[#D8E3F2] bg-[linear-gradient(180deg,#FFFFFF_0%,#F6FAFE_100%)] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
              >
                <Link
                  href={`/admin/passages/${passage.id}`}
                  className="block rounded-[16px] outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#2453A6]/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 text-lg font-semibold leading-7 text-[#0F2744]">
                      {passage.title}
                    </h3>
                    <span className="shrink-0 whitespace-nowrap rounded-full border border-[#D6E4FB] bg-[#EAF2FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2453A6]">
                      {passage.testType === "PRE_TEST" ? "Pre-Test" : "Post-Test"}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
                    <span className="rounded-full border border-[#DCEBFA] bg-[#EEF7FF] px-2.5 py-1 text-[#2453A6]">
                      {passage.language}
                    </span>
                    <span className="rounded-full border border-[#D6F3DE] bg-[#F0FDF4] px-2.5 py-1 text-[#15803D]">
                      {passage.level === 0 ? "Kindergarten" : `Grade ${passage.level}`}
                    </span>
                    <span className="rounded-full border border-[#F5E3CF] bg-[#FFF7ED] px-2.5 py-1 text-[#C2410C]">
                      {passage.wordCount} words
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-[#64809F]">
                    Last updated {formatDate(passage.updatedAt)}
                  </p>
                </Link>
                <div className="mt-5 flex items-center gap-3">
                  <Button asChild className="h-10 rounded-full bg-[#0C2D57] px-4 text-white hover:bg-[#163D70]">
                    <Link href={`/admin/passages/${passage.id}`}>View Passage</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-10 rounded-full border-[#C9D8EC] bg-white px-4 text-[#16324F]"
                  >
                    <Link href={`/admin/passages/edit/${passage.id}`}>Edit Passage</Link>
                  </Button>
                </div>
              </article>
            ))}
            {filtered.passages.length === 0 && <EmptyState label="passages" />}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  count,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  count: number;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-[#E7EEF7] px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6E85A0]">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#0F2744]">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#64809F]">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#F4F8FD] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#33507A]">
            {count} records
          </span>
          {action}
        </div>
      </div>
    </header>
  );
}

function OverviewKpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/16 bg-white/12 px-4 py-4 backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/72">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs text-white/72">{hint}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#E3ECF7] bg-white px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7A91AC]">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-[#0F2744]">{value}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="col-span-full rounded-[24px] border border-dashed border-[#C9D8EC] bg-[#F9FBFE] px-4 py-12 text-center text-sm text-[#6E85A0]">
      No matching {label} found.
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

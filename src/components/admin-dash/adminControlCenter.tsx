"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  FileText,
  Loader2,
  Users,
  UserRoundCog,
} from "lucide-react";
import { updateAdminUserRoleAction } from "@/app/actions/admin/updateUserRole";
import { toggleAdminUserStatusAction } from "@/app/actions/admin/toggleUserStatus";
import { renameOrganizationByAdminAction } from "@/app/actions/admin/renameOrganization";
import { removeMembershipByAdminAction } from "@/app/actions/admin/removeMembership";
import { useAdminManagementSnapshot } from "@/lib/hooks/useAdminManagementSnapshot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AdminTab = "users" | "organizations" | "memberships" | "passages";

const queryKey = ["admin", "management-snapshot"];

const tabs: {
  id: AdminTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "passages", label: "Passages", icon: FileText },
  { id: "users", label: "Users", icon: Users },
  { id: "organizations", label: "Organizations", icon: Building2 },
  { id: "memberships", label: "Memberships", icon: UserRoundCog },
];

const roleOptions = ["USER", "ORG_ADMIN", "ADMIN"] as const;

export function AdminControlCenter() {
  const [activeTab, setActiveTab] = useState<AdminTab>("passages");
  const [search, setSearch] = useState("");
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

  const membershipMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const result = await removeMembershipByAdminAction(membershipId);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to remove membership");
      }
    },
    onSuccess: refreshSnapshot,
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
      memberships: snapshot.memberships.filter((membership) =>
        matches(
          membership.userName,
          membership.userEmail,
          membership.organizationName,
          membership.userRole
        )
      ),
      passages: snapshot.passages.filter((passage) =>
        matches(passage.title, passage.language, passage.testType, passage.level)
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
    membershipMutation.isPending;

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
              className="h-11 min-w-[280px] rounded-full border-[#D6E3F8] bg-[#F8FBFE] px-4 text-sm text-[#16324F] placeholder:text-[#7B92AC]"
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
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#6E85A0]">
                  <th className="px-4">User</th>
                  <th className="px-4">Role</th>
                  <th className="px-4">Organizations</th>
                  <th className="px-4">Created</th>
                  <th className="px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.users.map((user) => (
                  <tr
                    key={user.id}
                    className="rounded-[22px] bg-[#F9FBFE] text-sm text-[#16324F] shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                  >
                    <td className="rounded-l-[22px] px-4 py-4">
                      <div className="font-semibold text-[#0F2744]">{user.name}</div>
                      <div className="mt-1 text-xs text-[#6E85A0]">{user.email}</div>
                      <div className="mt-2 flex gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
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
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={user.role}
                        disabled={busy}
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
                        className="h-10 rounded-full border border-[#C9D8EC] bg-white px-3 text-sm font-medium text-[#16324F] outline-none"
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#4D6785]">
                      <div>{user.membershipCount} memberships</div>
                      <div className="mt-1 text-xs text-[#7F94AE]">
                        {user.ownedOrganizationCount} owned organizations
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#4D6785]">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="rounded-r-[22px] px-4 py-4">
                      <Button
                        type="button"
                        variant={user.isDisabled ? "default" : "outline"}
                        className={cn(
                          "h-10 rounded-full px-4",
                          user.isDisabled
                            ? "bg-[#2453A6] text-white hover:bg-[#1C468D]"
                            : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
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
                                : "Failed to update user status"
                            );
                          }
                        }}
                      >
                        {user.isDisabled ? "Enable User" : "Disable User"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.users.length === 0 && <EmptyState label="users" />}
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
                </div>
              </article>
            ))}
            {filtered.organizations.length === 0 && <EmptyState label="organizations" />}
          </div>
        </section>
      )}

      {activeTab === "memberships" && (
        <section className="rounded-[28px] border border-[#D9E5F5] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)]">
          <SectionHeader
            eyebrow="Relationships"
            title="Memberships"
            description="Inspect every user-to-organization link and remove memberships where needed."
            count={filtered.memberships.length}
          />
          <div className="overflow-x-auto px-4 pb-4 sm:px-6 sm:pb-6">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#6E85A0]">
                  <th className="px-4">Member</th>
                  <th className="px-4">Organization</th>
                  <th className="px-4">Joined</th>
                  <th className="px-4">State</th>
                  <th className="px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.memberships.map((membership) => (
                  <tr
                    key={membership.membershipId}
                    className="bg-[#F9FBFE] text-sm text-[#16324F] shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                  >
                    <td className="rounded-l-[22px] px-4 py-4">
                      <div className="font-semibold text-[#0F2744]">
                        {membership.userName}
                      </div>
                      <div className="mt-1 text-xs text-[#6E85A0]">
                        {membership.userEmail} / {membership.userRole}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-[#16324F]">
                        {membership.organizationName}
                      </div>
                      <div className="mt-1 text-xs text-[#6E85A0]">
                        {membership.isOwnerMembership
                          ? "Owner membership"
                          : "Standard membership"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[#4D6785]">
                      {formatDate(membership.joinedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
                          membership.userDisabled
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        {membership.userDisabled ? "User disabled" : "User active"}
                      </span>
                    </td>
                    <td className="rounded-r-[22px] px-4 py-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-full border-red-200 bg-red-50 px-4 text-red-700 hover:bg-red-100"
                        disabled={busy || membership.isOwnerMembership}
                        onClick={async () => {
                          const confirmed = window.confirm(
                            `Remove ${membership.userName} from ${membership.organizationName}?`
                          );

                          if (!confirmed) {
                            return;
                          }

                          try {
                            await membershipMutation.mutateAsync(
                              membership.membershipId
                            );
                          } catch (error) {
                            alert(
                              error instanceof Error
                                ? error.message
                                : "Failed to remove membership"
                            );
                          }
                        }}
                      >
                        {membership.isOwnerMembership
                          ? "Owner Locked"
                          : "Remove Membership"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.memberships.length === 0 && <EmptyState label="memberships" />}
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
                className="rounded-[22px] border border-[#DCE7F5] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFE_100%)] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
              >
                <Link
                  href={`/admin/passages/${passage.id}`}
                  className="block rounded-[16px] outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#2453A6]/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-[#0F2744]">
                      {passage.title}
                    </h3>
                    <span className="rounded-full bg-[#EAF2FF] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2453A6]">
                      {passage.testType === "PRE_TEST" ? "Pre-test" : "Post-test"}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
                    <span className="rounded-full bg-[#EEF7FF] px-2.5 py-1 text-[#2453A6]">
                      {passage.language}
                    </span>
                    <span className="rounded-full bg-[#F0FDF4] px-2.5 py-1 text-[#15803D]">
                      {passage.level === 0 ? "Kindergarten" : `Grade ${passage.level}`}
                    </span>
                    <span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[#C2410C]">
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

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Pencil,
  RefreshCw,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMembersAction } from "@/app/actions/org/getMembers";
import { addMemberAction } from "@/app/actions/org/addMember";
import { renameOrgAction } from "@/app/actions/org/renameOrg";
import { toggleMemberAction } from "@/app/actions/org/toggleMember";
import { updateMemberPasswordAction } from "@/app/actions/org/updateMemberStatus";
import { generateMemberPasswordAction } from "@/app/actions/org/generateMemberPassword";
import { createOrgAction } from "@/app/actions/org/createOrg";

interface OrgSummary {
  id: string;
  name: string;
  plan: string | null;
  maxMembers: number;
  currentMembers: number;
  totalMembers: number;
}

interface Member {
  membershipId: string;
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  isDisabled: boolean;
  createdAt: string | Date;
  joinedAt: string | Date;
  isOwner: boolean;
}

interface TempPasswordInfo {
  email: string;
  password: string;
}

interface InvitationSentInfo {
  email: string;
  expiresAt: Date;
}

export default function OrganizationPage() {
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [needsOrgCreation, setNeedsOrgCreation] = useState(false);

  const [org, setOrg] = useState<OrgSummary | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  const [tempPassword, setTempPassword] = useState<TempPasswordInfo | null>(
    null
  );
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
          <section className="overflow-hidden rounded-[32px] border border-[rgba(102,102,255,0.12)] bg-[linear-gradient(135deg,#FFFFFF_0%,#F6F8FF_52%,#EEF2FF_100%)] shadow-[0_22px_60px_rgba(15,23,88,0.08)]">
            <div className="grid gap-8 px-6 py-6 sm:px-7 sm:py-7 xl:grid-cols-[minmax(0,1.28fr)_360px] xl:items-end">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-[#5D5DFB] shadow-[0_18px_32px_rgba(93,93,251,0.24)]">
                  <Building2 className="h-7 w-7 text-white" />
                </div>

                <div className="max-w-3xl">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5D5DFB]">
                    Organization workspace
                  </p>
                  <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#16215C] sm:text-[2.5rem]">
                    Keep team management clear, organized, and easy to scan.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6072A6] sm:text-[15px]">
                    Use this page to handle invitations, access changes, and
                    account support without repeating the same information in
                    multiple places.
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] border border-[rgba(102,102,255,0.14)] bg-white/92 p-5 shadow-[0_14px_32px_rgba(15,23,88,0.06)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6072A6]">
                  Workspace status
                </p>
                <div className="mt-4 space-y-4">
                  <StatusRow
                    label="Seats available"
                    value={String(seatsRemaining)}
                    hint={
                      seatsRemaining > 0
                        ? "Ready for new invitations."
                        : "No open seats right now."
                    }
                  />
                  <StatusRow
                    label="Disabled accounts"
                    value={String(disabledMembers)}
                    hint={
                      disabledMembers > 0
                        ? "These can be reviewed in the roster below."
                        : "Everyone in the directory is active."
                    }
                  />
                  <StatusRow
                    label="Team directory"
                    value={String(org.totalMembers)}
                    hint="Total member records in the organization."
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.82fr)] xl:items-start">
            <OrgSummaryCard org={org} onRenamed={refresh} />

            <AddMemberCard
              seatsRemaining={seatsRemaining}
              onInvited={(info) => {
                setInvitationSent(info);
                refresh();
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
              refresh();
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

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex w-full max-w-md items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      <span className="flex-1">{message}</span>
    </div>
  );
}

function CreateOrgPanel({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    const res = await createOrgAction(name.trim());
    setSubmitting(false);

    if (!res.success) {
      setError(res.error ?? "Failed to create organization");
      return;
    }
    onCreated();
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(102,102,255,0.14),transparent_25%),linear-gradient(180deg,#F8F9FF_0%,#EEF3FF_100%)] px-6 py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-[32px] border border-[rgba(102,102,255,0.14)] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFF_100%)] p-8 shadow-[0_24px_64px_rgba(12,26,109,0.1)]"
      >
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5D5DFB] shadow-[0_16px_28px_rgba(102,102,255,0.24)]">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5D5DFB]">
              Organization
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-[-0.02em] text-[#16215C]">
              Create your organization
            </h2>
            <p className="mt-2 max-w-md text-sm leading-7 text-[#6072A6]">
              Set up your workspace first, then you can invite members and
              manage access from one place.
            </p>
          </div>
        </div>

        <label
          htmlFor="orgName"
          className="block text-sm font-semibold text-[#31318A]"
        >
          Organization name
        </label>
        <input
          id="orgName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Maria's Reading Academy"
          className="mt-2 h-12 w-full rounded-2xl border border-[#CBD4FF] bg-white px-4 text-sm font-medium text-[#1B2A63] outline-none transition focus:border-[#5D5DFB] focus:ring-4 focus:ring-[#5D5DFB]/10"
        />

        {error && (
          <p className="mt-3 text-xs font-medium text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={!name.trim() || submitting}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5D5DFB] px-4 text-sm font-bold text-white transition hover:bg-[#4D4DEA] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Creating..." : "Create organization"}
        </button>
      </form>
    </main>
  );
}

function OrgSummaryCard({
  org,
  onRenamed,
}: {
  org: OrgSummary;
  onRenamed: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(org.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workspaceCode = `ORG-${org.id.slice(0, 8).toUpperCase()}`;

  async function handleSave() {
    if (!draft.trim() || saving) return;
    if (draft.trim() === org.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);

    const res = await renameOrgAction(draft.trim());
    setSaving(false);

    if (!res.success) {
      setError(res.error ?? "Failed to rename");
      return;
    }
    setEditing(false);
    onRenamed();
  }

  return (
    <section className="overflow-hidden rounded-[32px] border border-[rgba(102,102,255,0.18)] bg-white shadow-[0_24px_64px_rgba(15,23,88,0.09)]">
      <div className="border-b border-[rgba(102,102,255,0.12)] bg-white px-6 py-6 sm:px-7 sm:py-7">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-[#5D5DFB] shadow-[0_16px_32px_rgba(93,93,251,0.22)]">
            <Building2 className="h-6 w-6 text-white" />
          </div>

          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5D5DFB]">
              Organization details
            </p>
            {editing ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") {
                      setDraft(org.name);
                      setEditing(false);
                    }
                  }}
                  className="h-12 w-full max-w-lg rounded-2xl border border-[#CBD4FF] bg-white px-4 text-lg font-bold text-[#16215C] outline-none transition focus:border-[#5D5DFB] focus:ring-4 focus:ring-[#5D5DFB]/10"
                />
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-2xl bg-[#5D5DFB] px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#4D4DEA] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(org.name);
                    setEditing(false);
                    setError(null);
                  }}
                  className="rounded-2xl border border-[#D8DEFF] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#6072A6] transition hover:bg-[#F7F8FF]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-bold tracking-[-0.03em] text-[#16215C] sm:text-[2.4rem]">
                  {org.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  aria-label="Rename organization"
                  title="Rename"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[#D8DEFF] bg-white px-4 text-sm font-semibold text-[#5D5DFB] transition hover:border-[#5D5DFB]/30 hover:bg-[#F6F7FF]"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </button>
              </div>
            )}
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6072A6]">
              Keep the organization name, subscription, and workspace settings in
              one clean reference area.
            </p>
            {error && (
              <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 xl:grid-cols-3 sm:px-7">
        <DetailCard
          label="Current plan"
          value={org.plan ?? "No active plan"}
          hint={
            org.plan
              ? "This plan sets the current member capacity."
              : "Choose a plan before expanding the team."
          }
        />
        <DetailCard
          label="Workspace ID"
          value={workspaceCode}
          hint="Useful when matching support notes or internal records."
        />
        <DetailCard
          label="Seat limit"
          value={`${org.maxMembers} member${org.maxMembers === 1 ? "" : "s"}`}
          hint="Maximum active members allowed at one time."
        />
      </div>
    </section>
  );
}

function StatusRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[rgba(102,102,255,0.08)] pb-4 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#16215C]">{label}</p>
        <p className="mt-1 text-xs leading-6 text-[#6E7FAF]">{hint}</p>
      </div>
      <p className="text-2xl font-bold tracking-[-0.02em] text-[#16215C]">
        {value}
      </p>
    </div>
  );
}

function DetailCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-[rgba(102,102,255,0.12)] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F9FF_100%)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6072A6]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#16215C]">
        {value}
      </p>
      <p className="mt-1 text-xs leading-6 text-[#6E7FAF]">{hint}</p>
    </div>
  );
}

function AddMemberCard({
  seatsRemaining,
  onInvited,
}: {
  seatsRemaining: number;
  onInvited: (info: InvitationSentInfo) => void;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seatsExhausted = seatsRemaining <= 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || seatsExhausted) return;

    setError(null);
    setSubmitting(true);

    const res = await addMemberAction({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    setSubmitting(false);

    if (!res.success) {
      setError(res.error ?? "Failed to send invitation");
      return;
    }

    const invitedEmail = email.trim();
    setEmail("");
    setFirstName("");
    setLastName("");

    if ("invitation" in res && res.invitation) {
      onInvited({
        email: res.invitation.email,
        expiresAt: new Date(res.invitation.expiresAt),
      });
    } else {
      onInvited({
        email: invitedEmail,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }
  }

  return (
    <section className="rounded-[32px] border border-[rgba(102,102,255,0.14)] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFF_100%)] p-6 shadow-[0_22px_56px_rgba(15,23,88,0.06)] xl:sticky xl:top-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5D5DFB] shadow-[0_16px_28px_rgba(93,93,251,0.2)]">
          <UserPlus className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5D5DFB]">
            Invite member
          </p>
          <h3 className="mt-1 text-xl font-bold tracking-[-0.02em] text-[#16215C]">
            Add someone to the organization
          </h3>
          {seatsExhausted ? (
            <SeatLimitHint message="All active seats are being used. Free up a seat or upgrade the plan before sending another invite." />
          ) : (
            <p className="mt-2 text-sm leading-7 text-[#6072A6]">
              You have {seatsRemaining} open seat{seatsRemaining === 1 ? "" : "s"} available for new members.
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="First name"
            value={firstName}
            onChange={setFirstName}
            disabled={seatsExhausted || submitting}
          />
          <TextField
            label="Last name"
            value={lastName}
            onChange={setLastName}
            disabled={seatsExhausted || submitting}
          />
        </div>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          disabled={seatsExhausted || submitting}
        />
        <button
          type="submit"
          disabled={
            seatsExhausted ||
            submitting ||
            !email.trim() ||
            !firstName.trim() ||
            !lastName.trim()
          }
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5D5DFB] px-5 text-sm font-bold text-white transition hover:bg-[#4D4DEA] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Sending..." : "Send invite"}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-xs font-medium text-red-600">{error}</p>
      )}
    </section>
  );
}

function SeatLimitHint({ message }: { message: string }) {
  return (
    <div className="mt-3">
      <div className="group relative inline-flex">
        <button
          type="button"
          aria-label="Seat limit reached"
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(245,158,11,0.28)] bg-[rgba(255,248,235,0.92)] px-3 py-1.5 text-xs font-semibold text-[#9A6700] transition hover:border-[rgba(245,158,11,0.42)] hover:bg-[rgba(255,244,219,1)] focus:outline-none focus:ring-4 focus:ring-[rgba(245,158,11,0.16)]"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          No seats available
        </button>
        <div className="pointer-events-none absolute left-0 top-full z-10 mt-3 w-[280px] rounded-2xl border border-[rgba(243,199,118,0.45)] bg-[#FFF8EA] p-3 text-xs leading-6 text-[#704B00] opacity-0 shadow-[0_16px_36px_rgba(96,70,8,0.14)] transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
          {message}
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6072A6]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-12 rounded-2xl border border-[#CBD4FF] bg-white px-4 text-sm font-medium text-[#16215C] outline-none transition focus:border-[#5D5DFB] focus:ring-4 focus:ring-[#5D5DFB]/10 disabled:bg-[#F2F5FF] disabled:text-[#8290B8] disabled:opacity-70"
      />
    </label>
  );
}

function MembersCard({
  members,
  onToggle,
  onResetPassword,
  onGeneratePassword,
}: {
  members: Member[];
  onToggle: (member: Member, disable: boolean) => void | Promise<void>;
  onResetPassword: (member: Member) => void;
  onGeneratePassword: (member: Member) => Promise<void>;
}) {
  return (
    <section className="rounded-[32px] border border-[rgba(102,102,255,0.14)] bg-white shadow-[0_22px_56px_rgba(15,23,88,0.06)]">
      <header className="flex flex-col gap-4 border-b border-[rgba(102,102,255,0.08)] px-6 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5D5DFB]">
            Team directory
          </p>
          <h3 className="mt-1 text-2xl font-bold tracking-[-0.02em] text-[#16215C]">
            Members
          </h3>
          <p className="mt-2 text-sm leading-7 text-[#6072A6]">
            Review access, generate new passwords, and make status changes with a
            clearer account list.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-[#DCE2FF] bg-[#F6F8FF] px-3 py-1.5 text-xs font-semibold text-[#56679D]">
          {members.length} total member{members.length === 1 ? "" : "s"}
        </span>
      </header>

      {members.length === 0 ? (
        <div className="px-6 py-14 text-center text-sm text-[#6B7DB3]">
          No members yet. Send your first invitation to start building the team.
        </div>
      ) : (
        <ul className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
          {members.map((member) => (
            <MemberRow
              key={member.membershipId}
              member={member}
              onToggle={onToggle}
              onResetPassword={onResetPassword}
              onGeneratePassword={onGeneratePassword}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function MemberRow({
  member,
  onToggle,
  onResetPassword,
  onGeneratePassword,
}: {
  member: Member;
  onToggle: (member: Member, disable: boolean) => void | Promise<void>;
  onResetPassword: (member: Member) => void;
  onGeneratePassword: (member: Member) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fullName = [member.firstName, member.lastName]
    .filter(Boolean)
    .join(" ");
  const initials = (member.firstName?.[0] ?? member.email?.[0] ?? "?").toUpperCase();

  async function handleToggle() {
    if (busy || member.isOwner) return;
    setBusy(true);
    await onToggle(member, !member.isDisabled);
    setBusy(false);
  }

  async function handleGenerate() {
    if (generating || member.isOwner) return;
    const confirmed = window.confirm(
      `Generate a new password for ${fullName || member.email}? The existing password will stop working.`
    );
    if (!confirmed) return;
    setGenerating(true);
    await onGeneratePassword(member);
    setGenerating(false);
  }

  return (
    <li className="rounded-[26px] border border-[rgba(21,35,95,0.08)] bg-[linear-gradient(180deg,#FFFFFF_0%,#FBFCFF_100%)] px-4 py-4 transition hover:border-[rgba(93,93,251,0.2)] hover:shadow-[0_14px_36px_rgba(15,23,88,0.05)] sm:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#EEF1FF] text-sm font-bold text-[#5D5DFB]">
            {initials}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-[#16215C]">
                {fullName || member.email}
              </span>
              {member.isOwner && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF1FF] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5D5DFB]">
                  <ShieldCheck className="h-3 w-3" /> Owner
                </span>
              )}
              {member.isDisabled && !member.isOwner && (
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-red-700">
                  Disabled
                </span>
              )}
              {!member.isDisabled && !member.isOwner && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                  Active
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[#6072A6]">{member.email}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8B97C1]">
              <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
              <span>Member record active in directory</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!member.isOwner && (
            <>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="flex h-10 items-center gap-1.5 rounded-2xl border border-[#D4DBFF] bg-white px-3.5 text-xs font-semibold text-[#24356E] transition hover:border-[#5D5DFB]/35 hover:bg-[#F6F8FF] disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {generating ? "Generating..." : "Generate password"}
              </button>
              <button
                type="button"
                onClick={() => onResetPassword(member)}
                className="flex h-10 items-center gap-1.5 rounded-2xl border border-[#D4DBFF] bg-white px-3.5 text-xs font-semibold text-[#24356E] transition hover:border-[#5D5DFB]/35 hover:bg-[#F6F8FF]"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Set custom
              </button>
              <button
                type="button"
                onClick={handleToggle}
                disabled={busy}
                className={`h-10 rounded-2xl px-3.5 text-xs font-bold transition disabled:opacity-50 ${
                  member.isDisabled
                    ? "bg-[#5D5DFB] text-white hover:bg-[#4D4DEA]"
                    : "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                {busy
                  ? "Working..."
                  : member.isDisabled
                    ? "Enable member"
                    : "Disable member"}
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function InvitationSentDialog({
  info,
  onClose,
}: {
  info: InvitationSentInfo | null;
  onClose: () => void;
}) {
  const expiresLabel = info
    ? info.expiresAt.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  return (
    <Dialog open={!!info} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#31318A]">Invitation sent</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-[#6B7DB3]">
          We emailed an invite link to{" "}
          <span className="font-semibold text-[#31318A]">{info?.email}</span>. They can
          accept and set up their account any time before{" "}
          <span className="font-semibold text-[#31318A]">{expiresLabel}</span>.
        </p>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-bold text-white hover:bg-[#5555EE]"
          >
            Done
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TempPasswordDialog({
  info,
  onClose,
}: {
  info: TempPasswordInfo | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!info) {
      const timer = window.setTimeout(() => setCopied(false), 0);
      return () => window.clearTimeout(timer);
    }
  }, [info]);

  async function copy() {
    if (!info) return;
    await navigator.clipboard.writeText(info.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Dialog open={!!info} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#31318A]">
            Share this temporary password
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-[#6B7DB3]">
          This is the only time the password will be shown. Send it to{" "}
          <span className="font-semibold text-[#31318A]">{info?.email}</span>{" "}
          so they can sign in.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-lg border-2 border-[#BDBDFF] bg-[#F7F7FF] px-3 py-2.5">
          <code className="flex-1 font-mono text-sm font-bold text-[#31318A]">
            {info?.password}
          </code>
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1 rounded-md bg-[#6666FF] px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#5555EE]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </button>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-bold text-white hover:bg-[#5555EE]"
          >
            Done
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  member,
  onClose,
}: {
  member: Member | null;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setValue("");
      setError(null);
      setDone(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [member]);

  async function handleSubmit() {
    if (!member || submitting) return;
    if (value.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await updateMemberPasswordAction(member.id, value);
    setSubmitting(false);

    if (!res.success) {
      setError(res.error ?? "Failed to update password");
      return;
    }
    setDone(true);
  }

  const fullName = member
    ? [member.firstName, member.lastName].filter(Boolean).join(" ") ||
      member.email
    : "";

  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#31318A]">
            Reset password for {fullName}
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <span>
              Password updated. Share the new password with the member
              securely.
            </span>
          </div>
        ) : (
          <>
            <label className="block text-sm font-semibold text-[#31318A]">
              New password
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="At least 8 characters"
              className="mt-2 w-full rounded-lg border-2 border-[#BDBDFF] px-3 py-2 text-sm font-medium text-[#31318A] outline-none focus:border-[#6666FF]"
            />
            {error && (
              <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
            )}
          </>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#BDBDFF] bg-white px-4 py-2 text-sm font-semibold text-[#31318A] hover:bg-[#F0F0FF]"
          >
            {done ? "Close" : "Cancel"}
          </button>
          {!done && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || value.length < 8}
              className="flex items-center gap-2 rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-bold text-white hover:bg-[#5555EE] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Updating..." : "Update password"}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


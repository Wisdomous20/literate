"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Pencil,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
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
    refresh();
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

  return (
    <div className="flex min-h-full flex-col">
      <DashboardHeader title="Organization" />

      <main className="flex-1 overflow-auto bg-[#F7F7FF] px-6 py-8 md:px-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <OrgSummaryCard org={org} onRenamed={refresh} />

          <AddMemberCard
            seatsRemaining={seatsRemaining}
            onInvited={(info) => {
              setInvitationSent(info);
              refresh();
            }}
          />

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
    <main className="flex flex-1 items-center justify-center bg-[#F7F7FF] px-6 py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-[#BDBDFF] bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6666FF]">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#31318A]">
              Create your organization
            </h2>
            <p className="text-sm text-[#6B7DB3]">
              Give it a name to start adding members.
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
          className="mt-2 w-full rounded-lg border-2 border-[#BDBDFF] px-3 py-2 text-sm font-medium text-[#31318A] outline-none focus:border-[#6666FF]"
        />

        {error && (
          <p className="mt-3 text-xs font-medium text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={!name.trim() || submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6666FF] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#5555EE] disabled:cursor-not-allowed disabled:opacity-50"
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
    <section className="rounded-2xl border border-[#BDBDFF] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6666FF]">
            <Users className="h-6 w-6 text-white" />
          </div>

          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
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
                  className="w-64 rounded-lg border-2 border-[#BDBDFF] px-3 py-1.5 text-lg font-bold text-[#31318A] outline-none focus:border-[#6666FF]"
                />
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-[#6666FF] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#5555EE] disabled:opacity-50"
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
                  className="rounded-lg px-2 py-1.5 text-xs font-semibold text-[#6B7DB3] hover:bg-[#F0F0FF]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#31318A]">{org.name}</h2>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  aria-label="Rename organization"
                  title="Rename"
                  className="rounded-full p-1.5 text-[#6666FF] transition-colors hover:bg-[#6666FF]/10"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
            {error && (
              <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <StatPill
            label="Plan"
            value={org.plan ?? "—"}
            accent={!!org.plan}
          />
          <StatPill
            label="Active seats"
            value={`${org.currentMembers} / ${org.maxMembers}`}
            accent
          />
          {org.totalMembers > org.currentMembers && (
            <StatPill
              label="Disabled"
              value={String(org.totalMembers - org.currentMembers)}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function StatPill({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-2 text-right ${
        accent
          ? "border-[#6666FF]/30 bg-[#6666FF]/8"
          : "border-[#BDBDFF] bg-white"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7DB3]">
        {label}
      </p>
      <p className="text-sm font-bold text-[#31318A]">{value}</p>
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
    <section className="rounded-2xl border border-[#BDBDFF] bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6666FF]">
          <UserPlus className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#31318A]">Invite member</h3>
          <p className="text-xs text-[#6B7DB3]">
            {seatsExhausted
              ? "Active seats full. Disable a member or upgrade to add more."
              : `We'll email them a link to join. ${seatsRemaining} seat${seatsRemaining === 1 ? "" : "s"} remaining.`}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1.2fr_auto]"
      >
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
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          disabled={seatsExhausted || submitting}
        />

        <div className="flex items-end">
          <button
            type="submit"
            disabled={
              seatsExhausted ||
              submitting ||
              !email.trim() ||
              !firstName.trim() ||
              !lastName.trim()
            }
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#6666FF] px-5 text-sm font-bold text-white transition-colors hover:bg-[#5555EE] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Inviting..." : "Invite"}
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-3 text-xs font-medium text-red-600">{error}</p>
      )}
    </section>
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
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7DB3]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-10 rounded-lg border-2 border-[#BDBDFF] px-3 text-sm font-medium text-[#31318A] outline-none transition-colors focus:border-[#6666FF] disabled:bg-[#F0F0FF] disabled:opacity-60"
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
    <section className="rounded-2xl border border-[#BDBDFF] bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-[#F0F0FF] px-6 py-4">
        <h3 className="text-base font-bold text-[#31318A]">Members</h3>
        <span className="text-xs font-semibold text-[#6B7DB3]">
          {members.length} total
        </span>
      </header>

      {members.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-[#6B7DB3]">
          No members yet. Add one above.
        </div>
      ) : (
        <ul className="divide-y divide-[#F0F0FF]">
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
    <li className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6666FF]/10 text-sm font-bold text-[#6666FF]">
          {(member.firstName?.[0] ?? "?").toUpperCase()}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#31318A]">
              {fullName || member.email}
            </span>
            {member.isOwner && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#6666FF]/10 px-2 py-0.5 text-[10px] font-bold text-[#6666FF]">
                <ShieldCheck className="h-3 w-3" /> Owner
              </span>
            )}
            {member.isDisabled && !member.isOwner && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                Disabled
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B7DB3]">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!member.isOwner && (
          <>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 rounded-lg border border-[#BDBDFF] px-3 py-1.5 text-xs font-semibold text-[#31318A] transition-colors hover:border-[#6666FF] hover:bg-[#6666FF]/5 disabled:opacity-50"
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
              className="flex items-center gap-1.5 rounded-lg border border-[#BDBDFF] px-3 py-1.5 text-xs font-semibold text-[#31318A] transition-colors hover:border-[#6666FF] hover:bg-[#6666FF]/5"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Set custom
            </button>
            <button
              type="button"
              onClick={handleToggle}
              disabled={busy}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                member.isDisabled
                  ? "bg-[#6666FF] text-white hover:bg-[#5555EE]"
                  : "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              }`}
            >
              {busy
                ? "..."
                : member.isDisabled
                  ? "Enable"
                  : "Disable"}
            </button>
          </>
        )}
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
    if (!info) setCopied(false);
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
    setValue("");
    setError(null);
    setDone(false);
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


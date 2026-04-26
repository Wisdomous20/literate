"use client";

import { useState } from "react";
import {
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import type { Member } from "./types";

interface MembersCardProps {
  members: Member[];
  onGeneratePassword: (member: Member) => Promise<void>;
  onResetPassword: (member: Member) => void;
  onToggle: (member: Member, disable: boolean) => void | Promise<void>;
}

export function MembersCard({
  members,
  onGeneratePassword,
  onResetPassword,
  onToggle,
}: MembersCardProps) {
  return (
    <section
      data-tour-target="org-members-card"
      className="rounded-[32px] border border-[rgba(102,102,255,0.14)] bg-white shadow-[0_22px_56px_rgba(15,23,88,0.06)]"
    >
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
              onGeneratePassword={onGeneratePassword}
              onResetPassword={onResetPassword}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function MemberRow({
  member,
  onGeneratePassword,
  onResetPassword,
  onToggle,
}: {
  member: Member;
  onGeneratePassword: (member: Member) => Promise<void>;
  onResetPassword: (member: Member) => void;
  onToggle: (member: Member, disable: boolean) => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");
  const initials = (
    member.firstName?.[0] ??
    member.email?.[0] ??
    "?"
  ).toUpperCase();

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

        <div
          data-tour-target="org-member-actions"
          className="flex flex-wrap items-center gap-2"
        >
          {!member.isOwner && (
            <>
              <button
                type="button"
                onClick={() => void handleGenerate()}
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
                onClick={() => void handleToggle()}
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

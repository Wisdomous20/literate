"use client";

import { useState } from "react";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import { addMemberAction } from "@/app/actions/org/addMember";
import type { InvitationSentInfo } from "./types";

interface AddMemberCardProps {
  onInvited: (info: InvitationSentInfo) => void;
  seatsRemaining: number;
}

export function AddMemberCard({
  onInvited,
  seatsRemaining,
}: AddMemberCardProps) {
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
              You have {seatsRemaining} open seat
              {seatsRemaining === 1 ? "" : "s"} available for new members.
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

      {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}
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

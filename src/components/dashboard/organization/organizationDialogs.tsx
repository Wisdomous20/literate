"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateMemberPasswordAction } from "@/app/actions/org/updateMemberStatus";
import type {
  InvitationSentInfo,
  Member,
  TempPasswordInfo,
} from "./types";

export function InvitationSentDialog({
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
          <span className="font-semibold text-[#31318A]">{info?.email}</span>.
          They can accept and set up their account any time before{" "}
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

export function TempPasswordDialog({
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
            onClick={() => void copy()}
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

export function ResetPasswordDialog({
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
            <span>Password updated. Share the new password with the member securely.</span>
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
            {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
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
              onClick={() => void handleSubmit()}
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

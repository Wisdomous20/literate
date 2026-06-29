"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { signOut, useSession } from "next-auth/react";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  X,
} from "lucide-react";
import {
  requestPasswordChangeAction,
  confirmPasswordChangeAction,
} from "@/app/actions/auth/requestPasswordChange";
import { cn } from "@/lib/utils";

type Accent = "navy" | "violet";

const accentStyles: Record<
  Accent,
  { avatar: string; ring: string; item: string; button: string }
> = {
  navy: {
    avatar: "bg-[#0C2D57] text-white",
    ring: "focus-visible:ring-[#2453A6]/25",
    item: "hover:bg-[#F4F8FD] text-[#16324F]",
    button: "bg-[#0C2D57] hover:bg-[#163D70] text-white",
  },
  violet: {
    avatar: "bg-[#6C4EEB] text-white",
    ring: "focus-visible:ring-[#6C4EEB]/25",
    item: "hover:bg-[#F8F6FF] text-[#323743]",
    button: "bg-[#6C4EEB] hover:bg-[#5D43DE] text-white",
  },
};

function getInitial(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "";
  return source ? source.charAt(0).toUpperCase() : "?";
}

export function AccountMenu({ accent = "navy" }: { accent?: Accent }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const styles = accentStyles[accent];
  const name = session?.user?.name;
  const email = session?.user?.email;
  const initial = getInitial(name, email);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
          className={cn(
            "flex items-center gap-2 rounded-full border border-[#E1DDFB] bg-white p-1 pr-2 transition focus-visible:outline-none focus-visible:ring-4",
            styles.ring,
          )}
        >
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
              styles.avatar,
            )}
          >
            {initial}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[#64809F] transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-[#E1DDFB] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.15)]"
          >
            <div className="border-b border-[#EEF1F8] px-4 py-3">
              <p className="truncate text-sm font-semibold text-[#16324F]">
                {name || "Account"}
              </p>
              {email && (
                <p className="mt-0.5 truncate text-xs text-[#64809F]">{email}</p>
              )}
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setShowPasswordModal(true);
              }}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition",
                styles.item,
              )}
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Change password
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void signOut({ callbackUrl: "/login" });
              }}
              className="flex w-full items-center gap-3 border-t border-[#EEF1F8] px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        )}
      </div>

      {showPasswordModal && (
        <ChangePasswordModal
          accent={accent}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </>
  );
}

function ChangePasswordModal({
  accent,
  onClose,
}: {
  accent: Accent;
  onClose: () => void;
}) {
  const styles = accentStyles[accent];
  const [step, setStep] = useState<"idle" | "verify">("idle");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const inputClassName =
    "w-full rounded-xl border border-[#D6DDFB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#16324F] outline-none transition-colors placeholder:text-[#8B91A3] focus:border-[#6C4EEB]";

  function onRequest() {
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    startTransition(async () => {
      const res = await requestPasswordChangeAction(currentPassword);
      if (!res.success) {
        setError(
          ("error" in res && res.error) || "Failed to send verification code",
        );
        return;
      }
      setStep("verify");
      setSuccess("Verification code sent to your email");
    });
  }

  function onConfirm() {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await confirmPasswordChangeAction(code, newPassword);
      if (!res.success) {
        setError(("error" in res && res.error) || "Failed to change password");
        return;
      }
      setSuccess("Password changed successfully");
      setStep("idle");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setCode("");
    });
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-3xl border border-[#E1DDFB] bg-white p-6 shadow-[0_28px_80px_rgba(7,34,73,0.24)]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                styles.avatar,
              )}
            >
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#0F2744]">
                Change password
              </h2>
              <p className="mt-0.5 text-xs text-[#64809F]">
                We&apos;ll email a 6-digit code to confirm the change.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-[#64809F] transition hover:bg-black/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <span className="flex-1">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span className="flex-1">{success}</span>
          </div>
        )}

        {step === "idle" ? (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#31318A]">
                Current password
              </span>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClassName}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#31318A]">
                New password
              </span>
              <div className="relative">
                <input
                  type={showPasswords ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputClassName} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((value) => !value)}
                  aria-label={showPasswords ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[#8B91A3] transition hover:text-[#6C4EEB]"
                >
                  {showPasswords ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#31318A]">
                Confirm new password
              </span>
              <div className="relative">
                <input
                  type={showPasswords ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputClassName} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((value) => !value)}
                  aria-label={showPasswords ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[#8B91A3] transition hover:text-[#6C4EEB]"
                >
                  {showPasswords ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </label>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={
                  isPending ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
                onClick={onRequest}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                  styles.button,
                )}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Send verification code
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#31318A]">
                Verification code
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className={`${inputClassName} text-center text-lg font-bold tracking-[0.5em]`}
                placeholder="000000"
              />
            </label>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep("idle");
                  setCode("");
                  setError(null);
                  setSuccess(null);
                }}
                className="text-sm font-semibold text-[#64809F] hover:text-[#16324F]"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isPending || code.length !== 6}
                onClick={onConfirm}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                  styles.button,
                )}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify and change password
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

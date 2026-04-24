"use client";

import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  User as UserIcon,
  Lock,
  CreditCard,
  CheckCircle,
  Loader2,
  AlertCircle,
  X,
  FileText,
  BookOpen,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import { useSettings } from "@/context/settingsContext";
import { updateProfileAction } from "@/app/actions/auth/updateProfile";
import {
  requestPasswordChangeAction,
  confirmPasswordChangeAction,
} from "@/app/actions/auth/requestPasswordChange";
import { getSubscriptionAction } from "@/app/actions/subscription/getSubscription";
import { stopSubscriptionRenewalAction } from "@/app/actions/subscription/stopRenewal";

type Subscription = {
  planType: string;
  status: string;
  maxMembers: number;
  currentPeriodEnd: string | Date | null;
  cancelAtPeriodEnd: boolean;
};

const inputClassName =
  "w-full rounded-xl border-2 border-[#BDBDFF] bg-white px-3.5 py-2.5 text-sm font-medium text-[#31318A] outline-none transition-colors placeholder:text-[#98A5D6] focus:border-[#6666FF]";

function splitName(name: string) {
  const [firstName, ...rest] = name.split(" ");
  return {
    firstName: firstName ?? "",
    lastName: rest.join(" "),
  };
}

function SectionCard({
  title,
  description,
  icon,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-[rgba(0,48,110,0.08)] bg-white px-5 py-5 shadow-[0_10px_30px_rgba(12,26,109,0.05)] sm:px-6 sm:py-6 ${className}`}
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6666FF] shadow-[0_10px_20px_rgba(102,102,255,0.18)]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6666FF]">
            Settings
          </p>
          <h3 className="mt-1 text-base font-bold text-[#0C1A6D]">{title}</h3>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-[#6B7DB3]">
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function Banner({
  kind,
  message,
  onClose,
}: {
  kind: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  const isError = kind === "error";
  return (
    <div
      className={`mb-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
        isError
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      ) : (
        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
      )}
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="rounded-full p-0.5 hover:bg-black/5"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ProfileSection() {
  const { data: session, update } = useSession();
  const currentProfile = splitName(session?.user?.name ?? "");
  const [draftName, setDraftName] = useState<{
    firstName: string;
    lastName: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const firstName = draftName?.firstName ?? currentProfile.firstName;
  const lastName = draftName?.lastName ?? currentProfile.lastName;
  const dirty =
    firstName.trim() !== currentProfile.firstName ||
    lastName.trim() !== currentProfile.lastName;

  function onSave() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateProfileAction(firstName, lastName);
      if (!res.success) {
        setError(("error" in res && res.error) || "Failed to update name");
        return;
      }
      const updatedUser = "user" in res ? res.user : null;
      await update({
        name: `${updatedUser?.firstName ?? ""} ${updatedUser?.lastName ?? ""}`.trim(),
      });
      setDraftName(null);
      setSuccess("Name updated");
    });
  }

  return (
    <SectionCard
      title="Profile"
      description="Update your display name"
      icon={<UserIcon className="h-4 w-4 text-white" />}
      className="h-full"
    >
      {error && <Banner kind="error" message={error} onClose={() => setError(null)} />}
      {success && (
        <Banner kind="success" message={success} onClose={() => setSuccess(null)} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-[#31318A]">
            First name
          </span>
          <input
            type="text"
            value={firstName}
            onChange={(e) =>
              setDraftName({
                firstName: e.target.value,
                lastName,
              })
            }
            className={inputClassName}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-[#31318A]">
            Last name
          </span>
          <input
            type="text"
            value={lastName}
            onChange={(e) =>
              setDraftName({
                firstName,
                lastName: e.target.value,
              })
            }
            className={inputClassName}
          />
        </label>
      </div>

      <div className="mt-4 rounded-2xl border border-[rgba(102,102,255,0.18)] bg-[rgba(102,102,255,0.05)] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6666FF]">
          Sign-in identity
        </p>
        <p className="mt-1 text-sm font-semibold text-[#31318A]">
          {session?.user?.email ?? "No email available"}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[#6B7DB3]">
          Your email is used for account access and verification during
          sensitive changes.
        </p>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          disabled={!dirty || isPending || !firstName.trim() || !lastName.trim()}
          onClick={onSave}
          className="flex items-center gap-2 rounded-xl bg-[#6666FF] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#5555EE] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </button>
      </div>
    </SectionCard>
  );
}

function PasswordSection() {
  const [step, setStep] = useState<"idle" | "verify">("idle");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function resetAll() {
    setStep("idle");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setCode("");
  }

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
        setError(("error" in res && res.error) || "Failed to send verification code");
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
      resetAll();
      setSuccess("Password changed successfully");
    });
  }

  return (
    <SectionCard
      title="Password"
      description="We'll email a 6-digit code to confirm the change"
      icon={<Lock className="h-4 w-4 text-white" />}
      className="h-full"
    >
      {error && <Banner kind="error" message={error} onClose={() => setError(null)} />}
      {success && (
        <Banner kind="success" message={success} onClose={() => setSuccess(null)} />
      )}

      {step === "idle" ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[rgba(102,102,255,0.18)] bg-[rgba(102,102,255,0.05)] px-4 py-3">
            <p className="text-sm font-semibold text-[#31318A]">
              Password requirements
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#6B7DB3]">
              Use at least 8 characters and make sure the new password matches
              the confirmation field before requesting a verification code.
            </p>
          </div>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#31318A]">
                New password
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClassName}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#31318A]">
                Confirm new password
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClassName}
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={
                isPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              onClick={onRequest}
              className="flex items-center gap-2 rounded-xl bg-[#6666FF] px-5 py-2 text-sm font-bold text-white hover:bg-[#5555EE] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send verification code
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[rgba(102,102,255,0.18)] bg-[rgba(102,102,255,0.05)] px-4 py-3">
            <p className="text-sm font-semibold text-[#31318A]">
              Check your email
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#6B7DB3]">
              Enter the 6-digit verification code sent to your inbox to confirm
              the password update.
            </p>
          </div>
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
              onClick={resetAll}
              className="text-sm font-semibold text-[#6B7DB3] hover:text-[#31318A]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending || code.length !== 6}
              onClick={onConfirm}
              className="flex items-center gap-2 rounded-xl bg-[#6666FF] px-5 py-2 text-sm font-bold text-white hover:bg-[#5555EE] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Verify and change password
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function SubscriptionSection() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function refresh() {
    const res = await getSubscriptionAction();
    if ("subscription" in res) {
      setSubscription((res.subscription as Subscription | null) ?? null);
    }
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function loadSubscription() {
      const res = await getSubscriptionAction();
      if (!active) return;

      if ("subscription" in res) {
        setSubscription((res.subscription as Subscription | null) ?? null);
      }
      setLoading(false);
    }

    void loadSubscription();

    return () => {
      active = false;
    };
  }, []);

  function onStopRenewal() {
    if (
      !window.confirm(
        "Stop automatic renewal? You'll keep access until the period ends.",
      )
    ) {
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await stopSubscriptionRenewalAction();
      if (!res.success) {
        setError(("error" in res && res.error) || "Failed to stop renewal");
        return;
      }
      setSuccess(
        "alreadyStopped" in res && res.alreadyStopped
          ? "Renewal was already stopped"
          : "Automatic renewal stopped",
      );
      await refresh();
    });
  }

  const hasActive =
    subscription &&
    (subscription.status === "ACTIVE" || subscription.status === "PAST_DUE");
  const statusTone =
    subscription?.status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : subscription?.status === "PAST_DUE"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <SectionCard
      title="Subscription"
      description="View and manage your plan"
      icon={<CreditCard className="h-4 w-4 text-white" />}
      className="h-full"
    >
      {error && <Banner kind="error" message={error} onClose={() => setError(null)} />}
      {success && (
        <Banner kind="success" message={success} onClose={() => setSuccess(null)} />
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#6B7DB3]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading subscription…
        </div>
      ) : !subscription ? (
        <div className="flex items-center justify-between rounded-xl border border-dashed border-[rgba(102,102,255,0.3)] bg-[rgba(102,102,255,0.04)] px-4 py-4">
          <p className="text-sm text-[#31318A]">No active subscription.</p>
          <Link
            href="/dashboard/subscription"
            className="rounded-xl bg-[#6666FF] px-4 py-2 text-sm font-bold text-white hover:bg-[#5555EE]"
          >
            Choose a plan
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-[rgba(0,48,110,0.08)] bg-[#F8F8FF] px-4 py-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-[#6B7DB3]">Plan</p>
              <p className="text-sm font-bold text-[#31318A]">
                {subscription.planType}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7DB3]">Status</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusTone}`}
                >
                  {subscription.status}
                </span>
                {subscription.cancelAtPeriodEnd && (
                  <span className="text-xs font-semibold text-[#6B7DB3]">
                    Ends at period close
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7DB3]">Seats</p>
              <p className="text-sm font-bold text-[#31318A]">
                {subscription.maxMembers}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7DB3]">
                Current period ends
              </p>
              <p className="text-sm font-bold text-[#31318A]">
                {subscription.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link
              href="/dashboard/subscription"
              className="rounded-xl border-2 border-[#6666FF] px-4 py-2 text-sm font-bold text-[#31318A] hover:bg-[#6666FF]/10"
            >
              Change plan
            </Link>
            {hasActive && !subscription.cancelAtPeriodEnd && (
              <button
                type="button"
                disabled={isPending}
                onClick={onStopRenewal}
                className="flex items-center gap-2 rounded-xl border-2 border-red-400 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Stop auto-renewal
              </button>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  statusLabel?: string;
}

function ToggleRow({
  icon,
  label,
  description,
  enabled,
  onToggle,
  statusLabel,
}: ToggleRowProps) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border px-5 py-4 transition-all duration-200 sm:flex-row sm:items-center sm:justify-between ${
        enabled
          ? "border-[rgba(102,102,255,0.24)] bg-[rgba(102,102,255,0.06)]"
          : "border-[rgba(0,48,110,0.08)] bg-[#FCFCFF]"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors duration-200 ${
            enabled
              ? "bg-[rgba(102,102,255,0.14)]"
              : "bg-[rgba(0,48,110,0.05)]"
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[#00306E]">{label}</p>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
                enabled
                  ? "bg-[#6666FF] text-white"
                  : "bg-[#E8EBFF] text-[#5E6EA8]"
              }`}
            >
              {statusLabel ?? (enabled ? "Enabled" : "Disabled")}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#6B7DB3]">
            {description}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between sm:min-w-[140px] sm:justify-end sm:gap-3">
        <span className="text-xs font-semibold text-[#6B7DB3]">
          {enabled ? "On" : "Off"}
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-label={enabled ? `Disable ${label}` : `Enable ${label}`}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
            enabled ? "bg-[#6666FF]" : "bg-[#C4C4FF]"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function TestSettingsCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[rgba(0,48,110,0.08)] bg-white px-5 py-5 shadow-[0_10px_30px_rgba(12,26,109,0.04)] sm:px-6 sm:py-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6666FF] shadow-[0_10px_20px_rgba(102,102,255,0.18)]">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-[0.12em] text-[#31318A]">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-[#6B7DB3]">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { autoFinishEnabled, setAutoFinishEnabled } = useSettings();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DashboardHeader title="Settings" />

      <main className="flex-1 overflow-auto bg-[#F7F8FF] px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <section>
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6666FF]">
                Account
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#0C1A6D]">
                Your account settings
              </h2>
            </div>

            <div className="grid gap-6 2xl:grid-cols-2">
              <ProfileSection />
              <PasswordSection />
            </div>

            <div className="mt-6">
              <SubscriptionSection />
            </div>
          </section>

          <section>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6666FF]">
                  Testing
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#0C1A6D]">
                  Reading controls
                </h2>
              </div>
              <div className="rounded-2xl border border-[rgba(102,102,255,0.16)] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(12,26,109,0.04)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7DB3]">
                  Auto-finish
                </p>
                <p className="mt-1 text-sm font-bold text-[#0C1A6D]">
                  {autoFinishEnabled ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>

            <div className="grid gap-6 2xl:grid-cols-2">
              <TestSettingsCard
                title="ORAL READING TEST"
                description="Controls that affect recording behavior during oral reading sessions."
                icon={<FileText className="h-4 w-4 text-white" />}
              >
                <ToggleRow
                  icon={
                    <CheckCircle
                      className={`h-5 w-5 ${
                        autoFinishEnabled ? "text-[#6666FF]" : "text-[#6B7DB3]"
                      }`}
                    />
                  }
                  label="Auto-Finish Reading"
                  description="Automatically stop recording and finish the test when the student reads the last word of the passage."
                  enabled={autoFinishEnabled}
                  onToggle={() => setAutoFinishEnabled(!autoFinishEnabled)}
                  statusLabel={
                    autoFinishEnabled ? "Auto-finish on" : "Auto-finish off"
                  }
                />
              </TestSettingsCard>

              <TestSettingsCard
                title="READING FLUENCY TEST"
                description="Controls that keep fluency assessments consistent across student sessions."
                icon={<BookOpen className="h-4 w-4 text-white" />}
              >
                <ToggleRow
                  icon={
                    <CheckCircle
                      className={`h-5 w-5 ${
                        autoFinishEnabled ? "text-[#6666FF]" : "text-[#6B7DB3]"
                      }`}
                    />
                  }
                  label="Auto-Finish Reading"
                  description="Automatically stop the fluency test recording when the last word is detected."
                  enabled={autoFinishEnabled}
                  onToggle={() => setAutoFinishEnabled(!autoFinishEnabled)}
                  statusLabel={
                    autoFinishEnabled ? "Auto-finish on" : "Auto-finish off"
                  }
                />
              </TestSettingsCard>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

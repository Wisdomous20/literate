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
  Info,
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

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8 rounded-2xl border border-[rgba(0,48,110,0.08)] bg-white px-6 py-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6666FF]">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#0C1A6D]">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-[#6B7DB3]">{description}</p>
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const name = session?.user?.name ?? "";
    const [f, ...rest] = name.split(" ");
    setFirstName(f ?? "");
    setLastName(rest.join(" "));
  }, [session?.user?.name]);

  const currentFirst = session?.user?.name?.split(" ")[0] ?? "";
  const currentLast = session?.user?.name?.split(" ").slice(1).join(" ") ?? "";
  const dirty =
    firstName.trim() !== currentFirst || lastName.trim() !== currentLast;

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
      setSuccess("Name updated");
    });
  }

  return (
    <SectionCard
      title="PROFILE"
      description="Update your display name"
      icon={<UserIcon className="h-4 w-4 text-white" />}
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
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border-2 border-[#BDBDFF] px-3 py-2 text-sm font-medium text-[#31318A] outline-none focus:border-[#6666FF]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-[#31318A]">
            Last name
          </span>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border-2 border-[#BDBDFF] px-3 py-2 text-sm font-medium text-[#31318A] outline-none focus:border-[#6666FF]"
          />
        </label>
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
      title="PASSWORD"
      description="We'll email a 6-digit code to confirm the change"
      icon={<Lock className="h-4 w-4 text-white" />}
    >
      {error && <Banner kind="error" message={error} onClose={() => setError(null)} />}
      {success && (
        <Banner kind="success" message={success} onClose={() => setSuccess(null)} />
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
              className="w-full rounded-lg border-2 border-[#BDBDFF] px-3 py-2 text-sm outline-none focus:border-[#6666FF]"
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
                className="w-full rounded-lg border-2 border-[#BDBDFF] px-3 py-2 text-sm outline-none focus:border-[#6666FF]"
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
                className="w-full rounded-lg border-2 border-[#BDBDFF] px-3 py-2 text-sm outline-none focus:border-[#6666FF]"
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
              className="w-full rounded-lg border-2 border-[#BDBDFF] px-3 py-2 text-center text-lg font-bold tracking-[0.5em] outline-none focus:border-[#6666FF]"
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
    refresh();
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

  return (
    <SectionCard
      title="SUBSCRIPTION"
      description="View and manage your plan"
      icon={<CreditCard className="h-4 w-4 text-white" />}
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
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-[rgba(0,48,110,0.08)] bg-[#F8F8FF] px-4 py-4">
            <div>
              <p className="text-xs font-semibold text-[#6B7DB3]">Plan</p>
              <p className="text-sm font-bold text-[#31318A]">
                {subscription.planType}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7DB3]">Status</p>
              <p className="text-sm font-bold text-[#31318A]">
                {subscription.status}
                {subscription.cancelAtPeriodEnd && " (ends at period)"}
              </p>
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
}

function ToggleRow({ icon, label, description, enabled, onToggle }: ToggleRowProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-5 py-4 transition-all duration-200 ${
        enabled
          ? "border-[rgba(102,102,255,0.2)] bg-[rgba(102,102,255,0.06)]"
          : "border-[rgba(0,48,110,0.08)] bg-white"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
            enabled ? "bg-[rgba(102,102,255,0.12)]" : "bg-[rgba(0,48,110,0.05)]"
          }`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#00306E]">{label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[#6B7DB3]">
            {description}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-label={enabled ? `Disable ${label}` : `Enable ${label}`}
        className={`relative ml-4 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
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
  );
}

export default function SettingsPage() {
  const { autoFinishEnabled, setAutoFinishEnabled } = useSettings();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DashboardHeader title="Settings" />

      <main className="flex-1 overflow-auto px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-[#0C1A6D]">Account</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7DB3]">
              Manage your profile, password, and subscription.
            </p>
          </div>

          <ProfileSection />
          <PasswordSection />
          <SubscriptionSection />

          <div className="mb-10 mt-10">
            <h2 className="text-2xl font-bold text-[#0C1A6D]">
              Test Configurations
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7DB3]">
              Manage how reading assessments behave during testing sessions.
            </p>
          </div>

          <section className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6666FF]">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-xs font-bold tracking-[0.15em] text-[#31318A]">
                ORAL READING TEST
              </h3>
            </div>
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
            />
          </section>

          <section className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6666FF]">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-xs font-bold tracking-[0.15em] text-[#31318A]">
                READING FLUENCY TEST
              </h3>
            </div>
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
            />
          </section>

          <div className="flex items-start gap-3 rounded-xl border border-dashed border-[rgba(102,102,255,0.2)] bg-[rgba(102,102,255,0.04)] px-5 py-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6666FF]" />
            <p className="text-xs leading-relaxed text-[#6B7DB3]">
              <span className="font-semibold text-[#31318A]">Note:</span>{" "}
              Auto-Finish relies on the Web Speech API for real-time speech
              detection. This feature works best on{" "}
              <span className="font-medium text-[#31318A]">Chrome</span> and{" "}
              <span className="font-medium text-[#31318A]">Edge</span>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

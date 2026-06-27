"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPassageAdminInvitationAction } from "@/app/actions/passage-admin/getInvitation";
import { acceptPassageAdminInvitationAction } from "@/app/actions/passage-admin/acceptInvitation";
import type { PassageAdminInvitationDetails } from "@/service/passage-admin/getPassageAdminInvitationDetailsService";

const MIN_PASSWORD_LENGTH = 8;

export function PassageAdminInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [details, setDetails] =
    useState<PassageAdminInvitationDetails | null>(() =>
      token ? null : { status: "not_found" },
    );
  const [loadingDetails, setLoadingDetails] = useState(Boolean(token));
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    (async () => {
      const result = await getPassageAdminInvitationAction(token);
      if (cancelled) return;
      setDetails(result);
      setLoadingDetails(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !details || details.status !== "valid" || submitting) return;

    if (!details.userExists && (!firstName.trim() || !lastName.trim())) {
      setError("First and last name are required.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await acceptPassageAdminInvitationAction({
      token,
      password,
      firstName: details.userExists ? undefined : firstName.trim(),
      lastName: details.userExists ? undefined : lastName.trim(),
    });

    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setDone(true);
    setTimeout(() => {
      const emailParam = encodeURIComponent(result.email);
      router.push(`/login?email=${emailParam}&callbackUrl=/admin/passages`);
    }, 1800);
  }

  if (loadingDetails) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#6C4EEB]" />
          <p className="mt-4 text-sm font-medium text-[#575E6B]">
            Checking your invitation...
          </p>
        </div>
      </AuthCard>
    );
  }

  if (!details || details.status !== "valid") {
    return (
      <AuthCard>
        <div className="space-y-5 py-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#F3F0FF] text-[#6C4EEB]">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#323743]">
              Invitation unavailable
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#575E6B]">
              This passage-admin invitation is invalid or expired.
            </p>
          </div>
          <Button asChild className="h-11 rounded-[14px] bg-[#6C4EEB] px-5 text-white">
            <Link href="/login">Go to login</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard>
        <div className="space-y-5 py-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#323743]">
              Password set
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#575E6B]">
              Your passage admin workspace is ready. Redirecting you to sign in...
            </p>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F3F0FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#6C4EEB]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Passage Admin
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#323743]">
              Set your password
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#575E6B]">
              {details.invitedByName} invited{" "}
              <span className="font-semibold text-[#323743]">{details.email}</span>{" "}
              to manage passages, quizzes, and questions in LiteRate.
            </p>
          </div>
        </div>

        {error && (
          <div
            className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {!details.userExists && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name" htmlFor="firstName">
              <Input
                id="firstName"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className={inputClass}
                disabled={submitting}
                required
              />
            </Field>
            <Field label="Last name" htmlFor="lastName">
              <Input
                id="lastName"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className={inputClass}
                disabled={submitting}
                required
              />
            </Field>
          </div>
        )}

        <Field label="New password" htmlFor="password">
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
            disabled={submitting}
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
        </Field>

        <Field label="Confirm password" htmlFor="confirmPassword">
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={inputClass}
            disabled={submitting}
            required
          />
        </Field>

        <Button
          type="submit"
          className="h-12 w-full rounded-[14px] bg-[#6C4EEB] text-base font-semibold text-white shadow-[0_14px_32px_rgba(108,78,235,0.22)] transition hover:bg-[#5D43DE] focus-visible:ring-[#6C4EEB]/25"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Setting password...
            </>
          ) : (
            "Set password and continue"
          )}
        </Button>
      </form>
    </AuthCard>
  );
}

const inputClass =
  "h-12 rounded-[14px] border-[#D6DDFB] bg-[#F8FAFF] px-4 text-[#323743] shadow-none placeholder:text-[#8B91A3] transition-colors focus-visible:border-[#6C4EEB] focus-visible:bg-white focus-visible:ring-[#6C4EEB]/20 disabled:opacity-60";

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full rounded-[28px] border border-[#E1DDFB] bg-white/95 p-6 shadow-[0_24px_70px_rgba(50,55,67,0.12)] sm:p-8">
      {children}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-semibold text-[#323743]">
        {label}
      </Label>
      {children}
    </div>
  );
}

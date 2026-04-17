"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getInvitationAction } from "@/app/actions/org/getInvitation";
import { acceptInvitationAction } from "@/app/actions/org/acceptInvitation";
import type { InvitationDetails } from "@/service/org/getInvitationDetailsService";

const MIN_PASSWORD_LENGTH = 8;

const statusMessages: Record<string, string> = {
  not_found: "This invitation link is invalid.",
  expired: "This invitation has expired. Ask the organization owner to send a new one.",
  revoked: "This invitation has been revoked.",
  accepted: "This invitation has already been used.",
};

export function AcceptInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setDetails({ status: "not_found" });
      setLoadingDetails(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const res = await getInvitationAction(token);
      if (cancelled) return;
      setDetails(res);
      setLoadingDetails(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !details || details.status !== "valid" || submitting) return;

    if (!details.userExists) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    const res = await acceptInvitationAction({
      token,
      password: details.userExists ? undefined : password,
    });

    setSubmitting(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setDone(true);
    setTimeout(() => {
      const emailParam = encodeURIComponent(res.email);
      router.push(`/login?invitation=accepted&email=${emailParam}`);
    }, 2000);
  }

  if (loadingDetails) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner />
          <p className="mt-4 text-[#040029]/70">Checking your invitation...</p>
        </div>
      </Card>
    );
  }

  if (!details || details.status !== "valid") {
    const message = details ? statusMessages[details.status] : statusMessages.not_found;
    return (
      <Card>
        <div className="space-y-6 text-center py-8">
          <h2 className="text-xl font-bold text-[#040029]">Invitation unavailable</h2>
          <p className="text-[#040029]/70">{message}</p>
          <div className="flex justify-center pt-2">
            <Link href="/login" className="text-[#162db0] hover:underline font-medium">
              Go to login
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  if (details.alreadyMember) {
    return (
      <Card>
        <div className="space-y-6 text-center py-8">
          <h2 className="text-xl font-bold text-[#040029]">You&apos;re already in</h2>
          <p className="text-[#040029]/70">
            You&apos;re already a member of {details.organizationName}. Sign in to continue.
          </p>
          <div className="flex justify-center pt-2">
            <Link href="/login" className="text-[#162db0] hover:underline font-medium">
              Go to login
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  if (done) {
    return (
      <Card>
        <div className="space-y-6 text-center py-8">
          <h2 className="text-xl font-bold text-[#040029]">You&apos;re in!</h2>
          <p className="text-[#040029]/70">
            Welcome to {details.organizationName}. Redirecting you to sign in...
          </p>
        </div>
      </Card>
    );
  }

  const greetingName = details.firstName || "there";

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#040029]">
            Join {details.organizationName}
          </h1>
          <p className="text-[#040029]/70">
            Hi {greetingName}, {details.invitedByName} invited you to join{" "}
            <span className="font-semibold">{details.organizationName}</span> on Literate.
          </p>
          <p className="text-xs text-[#040029]/60">
            Invitation for <span className="font-semibold">{details.email}</span>
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {details.userExists ? (
          <p className="text-sm text-[#040029]/70">
            You already have a Literate account with this email. Click accept to add it to
            this organization &mdash; you&apos;ll still sign in with your existing password.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#040029] font-semibold">
                Create a password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-[#54a4ff] bg-[#f4fcfd] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30"
                placeholder="At least 8 characters"
                required
                minLength={MIN_PASSWORD_LENGTH}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#040029] font-semibold">
                Confirm password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 rounded-xl border-[#54a4ff] bg-[#f4fcfd] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30"
                placeholder="Re-enter your password"
                required
                disabled={submitting}
              />
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <Button
            type="submit"
            className="w-64 h-12 rounded-full bg-[#2e2e68] hover:bg-[#2e2e68]/90 text-white font-medium disabled:opacity-60 flex items-center justify-center"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner className="h-5 w-5 mr-3 text-white" />
                Accepting...
              </>
            ) : details.userExists ? (
              "Accept invitation"
            ) : (
              "Create account & join"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8">{children}</div>
  );
}

function Spinner({ className = "h-10 w-10 text-[#2e2e68]" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

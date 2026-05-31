"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { registerUserAction } from "@/app/actions/auth/register";
import { registerUserFormSchema } from "@/lib/validation/auth";
import { getZodFieldErrors } from "@/lib/validation/common";
import {
  verifyCodeAction,
  resendVerificationCodeAction,
} from "@/app/actions/auth/verifyCode";

const inputClass =
  "h-12 rounded-[14px] border-[#D6DDFB] bg-[#F1F5FF] px-4 text-[#323743] shadow-none placeholder:text-[#8B91A3] transition-colors focus-visible:border-[#6C4EEB] focus-visible:bg-white focus-visible:ring-[#6C4EEB]/20 disabled:opacity-60";
const buttonClass =
  "h-12 w-full rounded-[14px] border border-[#5D43DE] bg-[linear-gradient(135deg,#6C4EEB_0%,#7D62F1_56%,#9B78FF_100%)] text-base font-semibold text-white shadow-none transition duration-200 hover:border-[#5138D6] hover:bg-[linear-gradient(135deg,#5D43DE_0%,#6C4EEB_58%,#8F6CFA_100%)] focus-visible:ring-[#6C4EEB]/25 active:scale-[0.99] disabled:scale-100";
const linkFocusClass =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6C4EEB]/20";
const iconButtonClass =
  "absolute inset-y-0 right-3 flex h-12 w-10 items-center justify-center rounded-lg text-[#6C4EEB]/70 transition-colors hover:text-[#6C4EEB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6C4EEB]/20";

export function SignupForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [codeDigits, setCodeDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (success && inputRefs.current[0]) inputRefs.current[0].focus();
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    const validationResult = registerUserFormSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    });

    if (!validationResult.success) {
      setFieldErrors(getZodFieldErrors(validationResult.error));
      setIsLoading(false);
      return;
    }

    try {
      const result = await registerUserAction({
        firstName: validationResult.data.firstName,
        lastName: validationResult.data.lastName,
        email: validationResult.data.email,
        password: validationResult.data.password,
      });

      if (!result.success) {
        setError(result.error || "Registration failed. Please try again.");
      } else {
        setUserId(result.user?.id || null);
        setSuccess(true);
        setResendCooldown(60);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    if (!userId) return;
    setIsVerifying(true);
    setVerifyError(null);

    try {
      const result = await verifyCodeAction(userId, code);
      if (result.success) {
        router.push("/login?verified=true");
      } else {
        setVerifyError(result.error || "Verification failed.");
        setCodeDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setVerifyError("An unexpected error occurred. Please try again.");
      setCodeDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newDigits = [...codeDigits];
    newDigits[index] = value;
    setCodeDigits(newDigits);
    setVerifyError(null);

    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (value && index === 5) {
      const fullCode = newDigits.join("");
      if (fullCode.length === 6) handleVerifyCode(fullCode);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;

    const newDigits = [...codeDigits];
    for (let i = 0; i < 6; i++) newDigits[i] = pasted[i] || "";
    setCodeDigits(newDigits);
    setVerifyError(null);

    const nextEmpty = newDigits.findIndex((digit) => !digit);
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
    if (pasted.length === 6) handleVerifyCode(pasted);
  };

  const handleResendCode = async () => {
    if (!userId || resendCooldown > 0) return;
    setIsResending(true);
    setVerifyError(null);

    try {
      const result = await resendVerificationCodeAction(userId);
      if (result.success) {
        setResendCooldown(60);
        setCodeDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setVerifyError(result.error || "Failed to resend code.");
      }
    } catch {
      setVerifyError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="relative z-10 space-y-6">
        <div className="space-y-5 py-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#F1F5FF] text-[#6C4EEB]">
            <Mail className="h-8 w-8" aria-hidden="true" />
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#6C4EEB]">
              Check your inbox
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-[#323743]">
              Verify your email
            </h2>
          </div>
          <p className="text-sm leading-6 text-[#575E6B]">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-[#323743]">{email}</span>
          </p>

          <div className="flex justify-center gap-2 pt-3" onPaste={handlePaste}>
            {codeDigits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isVerifying}
                title={`Digit ${index + 1} of 6`}
                placeholder="•"
                aria-label={`Digit ${index + 1} of 6`}
                className={`h-14 w-12 rounded-[14px] border bg-[#F1F5FF] text-center text-2xl font-bold text-[#323743] outline-none transition-colors placeholder:text-[#8B91A3] focus:border-[#6C4EEB] focus:bg-white focus:ring-4 focus:ring-[#6C4EEB]/20 ${
                  verifyError ? "border-red-300 bg-red-50" : "border-[#D6DDFB]"
                } ${isVerifying ? "cursor-not-allowed opacity-50" : ""}`}
              />
            ))}
          </div>

          {verifyError && <p className="text-sm text-red-600">{verifyError}</p>}
          {isVerifying && (
            <p className="text-sm text-[#6C4EEB]/70">Verifying...</p>
          )}

          <Button
            onClick={() => handleVerifyCode(codeDigits.join(""))}
            disabled={isVerifying || codeDigits.join("").length !== 6}
            className={buttonClass}
          >
            {isVerifying ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                Verifying...
              </>
            ) : (
              "Verify email"
            )}
          </Button>

          <p className="text-sm text-[#575E6B]">
            Didn&apos;t receive the code?{" "}
            {resendCooldown > 0 ? (
              <span className="text-[#8B91A3]">Resend in {resendCooldown}s</span>
            ) : (
              <button
                onClick={handleResendCode}
                disabled={isResending}
                className={`font-semibold text-[#6C4EEB] underline-offset-4 hover:underline disabled:opacity-50 ${linkFocusClass}`}
              >
                {isResending ? "Sending..." : "Resend code"}
              </button>
            )}
          </p>
        </div>

        <p className="text-center text-sm text-[#575E6B]">
          Already verified?{" "}
          <Link
            href="/login"
            className={`font-semibold text-[#6C4EEB] underline-offset-4 hover:underline ${linkFocusClass}`}
          >
            Log in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
      <div>
        <Link
          href="/"
          className={`mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#6C4EEB] transition-colors hover:text-[#5138D6] lg:hidden ${linkFocusClass}`}
        >
          Back to Home
        </Link>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#6C4EEB]">
          Join LiteRate
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#323743] sm:text-4xl">
          Create an account
        </h1>
        <p className="text-sm leading-6 text-[#575E6B]">
          Fill in your details to get started.
        </p>
      </div>

      {error && (
        <div
          className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-[#323743]">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="juandelacruz@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputClass} ${fieldErrors.email ? "border-red-300 bg-red-50" : ""}`}
          disabled={isLoading}
          autoComplete="email"
        />
        {fieldErrors.email && (
          <p className="text-xs font-medium text-red-600">{fieldErrors.email}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-[#323743]">
            First name
          </Label>
          <Input
            id="firstName"
            placeholder="Juan"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={`${inputClass} ${fieldErrors.firstName ? "border-red-300 bg-red-50" : ""}`}
            disabled={isLoading}
            autoComplete="given-name"
          />
          {fieldErrors.firstName && (
            <p className="text-xs font-medium text-red-600">
              {fieldErrors.firstName}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-[#323743]">
            Last name
          </Label>
          <Input
            id="lastName"
            placeholder="Dela Cruz"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={`${inputClass} ${fieldErrors.lastName ? "border-red-300 bg-red-50" : ""}`}
            disabled={isLoading}
            autoComplete="family-name"
          />
          {fieldErrors.lastName && (
            <p className="text-xs font-medium text-red-600">
              {fieldErrors.lastName}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-[#323743]">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-11 ${fieldErrors.password ? "border-red-300 bg-red-50" : ""}`}
            disabled={isLoading}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className={iconButtonClass}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-xs font-medium text-red-600">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-[#323743]">
          Confirm password
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`${inputClass} pr-11 ${fieldErrors.confirmPassword ? "border-red-300 bg-red-50" : ""}`}
            disabled={isLoading}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((value) => !value)}
            className={iconButtonClass}
            aria-label={
              showConfirmPassword ? "Hide confirm password" : "Show confirm password"
            }
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="text-xs font-medium text-red-600">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      <Button type="submit" className={buttonClass} disabled={isLoading}>
        {isLoading ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
            Creating account...
          </>
        ) : (
          "Register"
        )}
      </Button>

      <div className="pt-1 text-center">
        <p className="text-sm text-[#575E6B]">
          Already have an account?{" "}
          <Link
            href="/login"
            className={`font-semibold text-[#6C4EEB] underline-offset-4 transition-colors hover:text-[#5138D6] hover:underline ${linkFocusClass}`}
          >
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}

"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    fill="none"
    stroke="#6666FF"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    fill="none"
    stroke="#6666FF"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.293-3.95m2.1-1.9A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.197M15 12a3 3 0 11-6 0 3 3 0 016 0zm-6.364 6.364L19.07 4.93"
    />
  </svg>
);

const inputClass =
  "h-12 rounded-full bg-white border-l border-t border-r-[6px] border-b-[6px] border-[#6666FF] text-[#27348B] placeholder:text-[#6666FF]/50 focus-visible:ring-[#6666FF]/30 focus-visible:border-[#6666FF] disabled:opacity-60";

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
      const registerInput = {
        firstName: validationResult.data.firstName,
        lastName: validationResult.data.lastName,
        email: validationResult.data.email,
        password: validationResult.data.password,
      };
      const result = await registerUserAction(registerInput);
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
    if (e.key === "Backspace" && !codeDigits[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
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
    const nextEmpty = newDigits.findIndex((d) => !d);
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
    if (pasted.length === 6) handleVerifyCode(pasted);
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

  // ── Verification Screen ──
  if (success) {
    return (
      <div className="space-y-6">
        <div className="space-y-4 text-center py-8">
          <div className="flex justify-center mb-4">
            <svg
              className="w-16 h-16 text-[#6666FF]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#6666FF]">
            Verify your email
          </h2>
          <p className="text-[#27348B]/80 text-sm">
            We&apos;ve sent a 6-digit code to{" "}
            <span className="font-semibold text-[#27348B]">{email}</span>
          </p>

          <div className="flex justify-center gap-2 pt-4" onPaste={handlePaste}>
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
                className={`w-12 h-14 text-center text-2xl font-bold border-l border-t border-r-[6px] border-b-[6px] rounded-lg outline-none transition-all bg-white text-[#27348B] placeholder:text-[#6666FF]/40 ${
                  verifyError
                    ? "border-red-400"
                    : "border-[#6666FF] focus:border-[#4444CC]"
                } ${isVerifying ? "opacity-50 cursor-not-allowed" : ""}`}
              />
            ))}
          </div>

          {verifyError && (
            <p className="text-sm text-red-500 mt-2">{verifyError}</p>
          )}
          {isVerifying && (
            <p className="text-sm text-[#6666FF]/60 mt-2">Verifying...</p>
          )}

          <div className="pt-2">
            <Button
              onClick={() => handleVerifyCode(codeDigits.join(""))}
              disabled={isVerifying || codeDigits.join("").length !== 6}
              className="w-full h-12 rounded-full bg-[#6666FF] hover:bg-[#5555ee] text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2 border-l border-t border-r-[6px] border-b-[6px] border-[#4444CC]"
            >
              {isVerifying ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>
          </div>

          <div className="pt-2">
            <p className="text-sm text-[#27348B]/80">
              Didn&apos;t receive the code?{" "}
              {resendCooldown > 0 ? (
                <span className="text-[#27348B]/50">
                  Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="text-[#6666FF] font-semibold hover:underline disabled:opacity-50"
                >
                  {isResending ? "Sending..." : "Resend code"}
                </button>
              )}
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-[#27348B]">
          Already verified?{" "}
          <Link
            href="/login"
            className="text-[#6666FF] font-semibold hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    );
  }

  // ── Signup Form ──
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#6666FF] mb-3 text-left">
          Create an account
        </h1>
        <p className="text-sm text-[#6666FF] text-left">
          Fill in your details to get started.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-300/50 text-[#27348B] text-sm">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-[#27348B] font-semibold">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="juandelacruz@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputClass} ${fieldErrors.email ? "border-red-400" : ""}`}
          disabled={isLoading}
        />
        {fieldErrors.email && (
          <p className="text-xs text-red-500">{fieldErrors.email}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-[#27348B] font-semibold">
            First Name
          </Label>
          <Input
            id="firstName"
            placeholder="Juan"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={`${inputClass} ${fieldErrors.firstName ? "border-red-400" : ""}`}
            disabled={isLoading}
          />
          {fieldErrors.firstName && (
            <p className="text-xs text-red-500">{fieldErrors.firstName}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-[#27348B] font-semibold">
            Last Name
          </Label>
          <Input
            id="lastName"
            placeholder="Dela Cruz"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={`${inputClass} ${fieldErrors.lastName ? "border-red-400" : ""}`}
            disabled={isLoading}
          />
          {fieldErrors.lastName && (
            <p className="text-xs text-red-500">{fieldErrors.lastName}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-[#27348B] font-semibold">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-11 ${fieldErrors.password ? "border-red-400" : ""}`}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6666FF]/70 hover:text-[#6666FF]"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOffIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-xs text-red-500">{fieldErrors.password}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="confirmPassword"
          className="text-[#27348B] font-semibold"
        >
          Confirm Password
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`${inputClass} pr-11 ${fieldErrors.confirmPassword ? "border-red-400" : ""}`}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6666FF]/70 hover:text-[#6666FF]"
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <EyeOffIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-red-500">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-12 rounded-full bg-[#6666FF] hover:bg-[#5555ee] text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2 border-l border-t border-r-[6px] border-b-[6px] border-[#4444CC]"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white"
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
            Creating Account...
          </>
        ) : (
          "Register"
        )}
      </Button>

      <div className="text-center space-y-1 pt-1">
        <p className="text-sm text-[#27348B]">Already have an account?</p>
        <Link
          href="/login"
          className="text-sm text-[#27348B] font-semibold hover:underline"
        >
          Login now!
        </Link>
      </div>
    </form>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const REMEMBER_ME_KEY = "literate_remember_me";
const REMEMBERED_EMAIL_KEY = "literate_remembered_email";

export function LoginForm() {
  const { data: session } = useSession();
  const [email, setEmail] = useState(() => {
    if (
      typeof window !== "undefined" &&
      localStorage.getItem(REMEMBER_ME_KEY) === "true"
    ) {
      return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
    }
    return "";
  });
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window !== "undefined")
      return localStorage.getItem(REMEMBER_ME_KEY) === "true";
    return false;
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginSuccess, setLoginSuccess] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl");
  const safeCallbackUrl =
    callbackUrl === "/dashboard" || callbackUrl?.startsWith("/dashboard/")
    ? callbackUrl
    : "/dashboard";

  useEffect(() => {
    if (loginSuccess && session?.user?.role) {
      if (session.user.role === "ADMIN") router.push("/admin");
      else router.push(safeCallbackUrl);
    }
  }, [session, loginSuccess, router, safeCallbackUrl]);

  const validateForm = () => {
    if (!email) {
      setError("Email is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      setError("Password is required.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        rememberMe: rememberMe.toString(),
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }
      if (result?.ok) {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, "true");
          localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
        setLoginSuccess(true);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const inputClass =
    "h-12 rounded-[14px] border-[#D6DDFB] bg-[#F1F5FF] px-4 text-[#323743] shadow-none placeholder:text-[#8B91A3] transition-colors focus-visible:border-[#6C4EEB] focus-visible:bg-white focus-visible:ring-[#6C4EEB]/20 disabled:opacity-60";
  const linkFocusClass =
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6C4EEB]/20";

  return (
    <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
      <div>
        <Link
          href="/"
          className={`mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#6C4EEB] transition-colors hover:text-[#5138D6] lg:hidden ${linkFocusClass}`}
        >
          Back to Home
        </Link>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#6C4EEB]">
          Welcome back
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#323743] sm:text-4xl">
          Log in to LiteRate
        </h1>
        <p className="text-sm leading-6 text-[#575E6B]">
          Continue to your assessment workspace.
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

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[#323743]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
            disabled={isLoading}
            autoComplete="username"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[#323743]">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass + " pr-11"}
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex h-12 w-10 items-center justify-center rounded-lg text-[#6C4EEB]/70 transition-colors hover:text-[#6C4EEB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6C4EEB]/20"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[#575E6B]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#DCD5FF] accent-[#6C4EEB]"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />
            <span>Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className={`text-sm font-semibold text-[#6C4EEB] underline-offset-4 transition-colors hover:text-[#5138D6] hover:underline ${linkFocusClass}`}
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-[14px] border border-[#5D43DE] bg-[linear-gradient(135deg,#6C4EEB_0%,#7D62F1_56%,#9B78FF_100%)] text-base font-semibold text-white shadow-none transition duration-200 hover:border-[#5138D6] hover:bg-[linear-gradient(135deg,#5D43DE_0%,#6C4EEB_58%,#8F6CFA_100%)] focus-visible:ring-[#6C4EEB]/25 active:scale-[0.99] disabled:scale-100"
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
            Logging in...
          </>
        ) : (
          "Log in"
        )}
      </Button>

      <div className="pt-2 text-center">
        <p className="text-sm text-[#575E6B]">
          Don&apos;t have an account?{" "}
          <Link
            href={`/signup?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`}
            className={`font-semibold text-[#6C4EEB] underline-offset-4 transition-colors hover:text-[#5138D6] hover:underline ${linkFocusClass}`}
          >
            Register now
          </Link>
        </p>
      </div>
    </form>
  );
}

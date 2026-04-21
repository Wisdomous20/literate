"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
  const [loginSuccess, setLoginSuccess] = useState(false);

  useEffect(() => {
    if (loginSuccess && session?.user?.role) {
      if (session.user.role === "ADMIN") router.push("/admin");
      else router.push("/dashboard");
    }
  }, [session, loginSuccess, router]);

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
    "h-12 rounded-full bg-white border-l border-t border-r-[6px] border-b-[6px] border-[#6666FF] text-[#27348B] placeholder:text-[#6666FF]/50 focus-visible:ring-[#6666FF]/30 focus-visible:border-[#6666FF] disabled:opacity-60";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#6666FF] mb-3 text-left">
          Login to your account
        </h1>
        <p className="text-sm text-[#6666FF] text-left">
          Please enter your details to continue.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-300/50 text-[#27348B] text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[#27348B] font-semibold">
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
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[#27348B] font-semibold">
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
              tabIndex={-1}
              className="absolute inset-y-0 right-4 flex items-center text-[#6666FF]/70 hover:text-[#6666FF] focus:outline-none"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />
            <span className="text-sm text-[#27348B]">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-[#27348B] hover:underline font-medium"
          >
            Forgot Password?
          </Link>
        </div>
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
            Logging you in...
          </>
        ) : (
          "Login"
        )}
      </Button>

      <div className="text-center space-y-1 mt-8">
        <p className="text-sm text-[#27348B]">Don&apos;t have an account?</p>
        <Link
          href="/signup"
          className="text-sm text-[#27348B] font-semibold hover:underline"
        >
          Register now!
        </Link>
      </div>
    </form>
  );
}

"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export function AdminSignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      // In a real app, this would call an API to create the admin account
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/admin/login");
    } catch {
      setError("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold" style={{ color: "#040029" }}>
          Create Admin Account
        </h1>
        <p className="text-sm" style={{ color: "rgba(4, 0, 41, 0.7)" }}>
          Register a new administrator account
        </p>
      </div>

      {error && (
        <div
          className="rounded-lg border p-3 text-sm"
          style={{
            backgroundColor: "rgba(222, 59, 64, 0.06)",
            borderColor: "rgba(222, 59, 64, 0.2)",
            color: "#DE3B40",
          }}
        >
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="admin-name"
            className="text-sm font-semibold"
            style={{ color: "#040029" }}
          >
            Full Name
          </label>
          <input
            id="admin-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 w-full rounded-xl border-2 bg-white px-4 text-base outline-none transition-colors placeholder:opacity-40 focus:border-[#6666FF]"
            style={{
              borderColor: "#54a4ff",
              color: "#040029",
            }}
            required
            disabled={isLoading}
            placeholder="Enter your full name"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="admin-signup-email"
            className="text-sm font-semibold"
            style={{ color: "#040029" }}
          >
            Email
          </label>
          <input
            id="admin-signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full rounded-xl border-2 bg-white px-4 text-base outline-none transition-colors placeholder:opacity-40 focus:border-[#6666FF]"
            style={{
              borderColor: "#54a4ff",
              color: "#040029",
            }}
            required
            disabled={isLoading}
            placeholder="admin@literate.com"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="admin-signup-password"
            className="text-sm font-semibold"
            style={{ color: "#040029" }}
          >
            Password
          </label>
          <div className="relative">
            <input
              id="admin-signup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border-2 bg-white px-4 pr-12 text-base outline-none transition-colors placeholder:opacity-40 focus:border-[#6666FF]"
              style={{
                borderColor: "#54a4ff",
                color: "#040029",
              }}
              required
              disabled={isLoading}
              placeholder="Minimum 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "rgba(4, 0, 41, 0.4)" }}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="admin-confirm-password"
            className="text-sm font-semibold"
            style={{ color: "#040029" }}
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="admin-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 w-full rounded-xl border-2 bg-white px-4 pr-12 text-base outline-none transition-colors placeholder:opacity-40 focus:border-[#6666FF]"
              style={{
                borderColor: "#54a4ff",
                color: "#040029",
              }}
              required
              disabled={isLoading}
              placeholder="Re-enter your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "rgba(4, 0, 41, 0.4)" }}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="flex h-12 w-full items-center justify-center rounded-full text-base font-medium text-white transition-all hover:opacity-90 disabled:opacity-60"
        style={{
          backgroundColor: "#2e2e68",
        }}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Creating account...</span>
          </div>
        ) : (
          "Create Account"
        )}
      </button>

      {/* Link to login */}
      <p
        className="text-center text-sm"
        style={{ color: "rgba(4, 0, 41, 0.6)" }}
      >
        Already have an account?{" "}
        <Link
          href="/admin-auth/login"
          className="font-semibold transition-colors hover:underline"
          style={{ color: "#6666FF" }}
        >
          Sign In
        </Link>
      </p>
    </form>
  );
}

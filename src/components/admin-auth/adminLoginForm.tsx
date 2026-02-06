"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Use NextAuth signIn with existing credentials provider
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      // Verify user is ADMIN after successful auth
      const response = await fetch("/api/auth/session");
      const session = await response.json();

      if (session?.user?.role !== "ADMIN") {
        setError("Admin access required");
        return;
      }

      router.push("/admin-dash");
      router.refresh();
    } catch (err) {
      setError("Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold" style={{ color: "#040029" }}>
          Admin Login
        </h1>
        <p style={{ color: "rgba(4, 0, 41, 0.7)" }}>
          Sign in to access the admin dashboard
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
        {/* Email */}
        <div className="space-y-2">
          <label
            htmlFor="admin-email"
            className="text-sm font-semibold"
            style={{ color: "#040029" }}
          >
            Email
          </label>
          <input
            id="admin-email"
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
        <div className="space-y-2">
          <label
            htmlFor="admin-password"
            className="text-sm font-semibold"
            style={{ color: "#040029" }}
          >
            Password
          </label>
          <div className="relative">
            <input
              id="admin-password"
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
              placeholder="Enter your password"
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
            <span>Signing in...</span>
          </div>
        ) : (
          "Sign In"
        )}
      </button>

      {/* Link to signup */}
      <p
        className="text-center text-sm"
        style={{ color: "rgba(4, 0, 41, 0.6)" }}
      >
        {"Don't have an account? "}
        <Link
          href="/admin-auth/signup"
          className="font-semibold transition-colors hover:underline"
          style={{ color: "#6666FF" }}
        >
          Sign Up
        </Link>
      </p>
    </form>
  );
}
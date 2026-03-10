"use client";

import React from "react";
import { useState } from "react";
import Link from "next/link";
// import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { registerUserAction } from "@/app/actions/auth/register";

function validateEmail(email: string) {
  // Simple email regex for demonstration
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    className={props.className}
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
    stroke="currentColor"
    viewBox="0 0 24 24"
    className={props.className}
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

export function SignupForm() {
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
  // const router = useRouter()

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!firstName.trim()) errors.firstName = "First name is required.";
    if (!lastName.trim()) errors.lastName = "Last name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    else if (!validateEmail(email))
      errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Password is required.";
    else if (password.length < 8)
      errors.password = "Password must be at least 8 characters.";
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match.";
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const result = await registerUserAction({
        firstName,
        lastName,
        email,
        password,
      });

      if (!result.success) {
        setError(result.error || "Registration failed. Please try again.");
      } else {
        setSuccess(true);
        // Optionally redirect after successful registration
        // router.push("/auth/login")
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="space-y-4 text-center py-8">
          <div className="flex justify-center mb-4">
            <svg
              className="w-16 h-16 text-[#2e2e68]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#040029]">Check your email</h2>
          <p className="text-[#040029]/70">
            We&apos;ve sent a verification link to {email}
          </p>
          <p className="text-sm text-[#040029]/60">
            Please check your inbox and verify your email to complete
            registration.
          </p>
        </div>
        <p className="text-center text-sm text-[#040029]">
          Already verified?{" "}
          <Link
            href="/login"
            className="text-[#162db0] hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[#040029]">
          Create your account
        </h1>
        <p className="text-[#040029]/70">
          Create your LiteRate account for a smarter reading evaluation!
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-[#040029] font-semibold">
              First Name
            </Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`h-12 rounded-xl border-[#54a4ff] bg-[#f4fcfd] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30 ${fieldErrors.firstName ? "border-red-400" : ""}`}
              required
              disabled={isLoading}
            />
            {fieldErrors.firstName && (
              <p className="text-xs text-red-600">{fieldErrors.firstName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-[#040029] font-semibold">
              Last Name
            </Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`h-12 rounded-xl border-[#54a4ff] bg-[#f4fcfd] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30 ${fieldErrors.lastName ? "border-red-400" : ""}`}
              required
              disabled={isLoading}
            />
            {fieldErrors.lastName && (
              <p className="text-xs text-red-600">{fieldErrors.lastName}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-[#040029] font-semibold">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`h-12 rounded-xl border-[#54a4ff] bg-[#f4fcfd] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30 ${fieldErrors.email ? "border-red-400" : ""}`}
            required
            disabled={isLoading}
          />
          {fieldErrors.email && (
            <p className="text-xs text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[#040029] font-semibold">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`h-12 rounded-xl border-[#54a4ff] bg-[#f4fcfd] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30 pr-10 ${fieldErrors.password ? "border-red-400" : ""}`}
              required
              disabled={isLoading}
              minLength={8}
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute inset-y-0 right-3 flex items-center text-[#54a4ff] focus:outline-none"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOffIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-[#040029]/60">
            Password must be at least 8 characters
          </p>
          {fieldErrors.password && (
            <p className="text-xs text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-[#040029] font-semibold">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`h-12 rounded-xl border-[#54a4ff] bg-[#f4fcfd] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30 pr-10 ${fieldErrors.confirmPassword ? "border-red-400" : ""}`}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute inset-y-0 right-3 flex items-center text-[#54a4ff] focus:outline-none"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? (
                <EyeOffIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-xs text-red-600">{fieldErrors.confirmPassword}</p>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          type="submit"
          className="w-64 h-12 rounded-full bg-[#2e2e68] hover:bg-[#2e2e68]/90 text-white font-medium"
          disabled={isLoading}
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#e2e8f0]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-[#f4fcfd] px-4 text-[#040029]/60">or</span>
        </div>
      </div>

      {/* Keep your existing social login buttons below */}
      <div className="flex justify-center gap-4">
        {/* ... existing social buttons ... */}
      </div>

      <p className="text-center text-sm text-[#040029]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#162db0] hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

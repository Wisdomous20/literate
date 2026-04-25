"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { resetPasswordFormSchema } from "@/lib/validation/auth"
import { getFirstZodErrorMessage } from "@/lib/validation/common"

// SVG icons for show/hide password
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
)

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
)

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validatingToken, setValidatingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  useEffect(() => {
    // Validate token on mount
    const validateToken = async () => {
      if (!token) {
        setError("No reset token provided. Please request a new password reset.")
        setValidatingToken(false)
        setTokenValid(false)
        return
      }

      // For now, we'll assume the token is valid since we can't validate it without a backend endpoint
      // In a complete implementation, you would call an API to validate the token
      setValidatingToken(false)
      setTokenValid(true)
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationResult = resetPasswordFormSchema.safeParse({
      password,
      confirmPassword,
    })
    if (!validationResult.success) {
      setError(getFirstZodErrorMessage(validationResult.error))
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: validationResult.data.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to reset password. Please try again or request a new reset link.")
        setIsLoading(false)
        return
      }

      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login?reset=success")
      }, 3000)
    } catch (err) {
      console.error("Reset password error:", err)
      setError("An unexpected error occurred. Please try again or request a new reset link.")
      setIsLoading(false)
    }
  }

  if (validatingToken) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <svg
            className="animate-spin h-10 w-10 text-[#2e2e68] mb-4"
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
          <p className="text-[#040029]/70">Validating reset link...</p>
        </div>
      </div>
    )
  }

  if (!tokenValid || !token) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8">
        <div className="space-y-6 text-center py-8">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#040029]">Invalid or Expired Link</h2>
          <p className="text-[#040029]/70">{error || "This password reset link is invalid or has expired."}</p>
          <div className="flex justify-center pt-4">
            <Link
              href="/forgot-password"
              className="text-[#162db0] hover:underline font-medium"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8">
        <div className="space-y-6 text-center py-8">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-[#2e2e68]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#040029]">Password Reset Successful!</h2>
          <p className="text-[#040029]/70">Your password has been reset successfully.</p>
          <p className="text-sm text-[#040029]/60">Redirecting you to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8">
      <Link href="/login" className="inline-flex items-center gap-2 text-[#162db0] hover:text-[#162db0]/80 font-medium mb-6">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Login
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#040029]">
            Reset your password
          </h1>
          <p className="text-[#040029]/70">
            Enter your new password below
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#040029] font-semibold">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-[#54a4ff] bg-[#f4fcfd] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30 disabled:opacity-60 pr-10"
                placeholder="Enter new password"
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-[#040029] font-semibold">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 rounded-xl border-[#54a4ff] bg-[#f4fcfd] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30 disabled:opacity-60 pr-10"
                placeholder="Confirm new password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-3 flex items-center text-[#54a4ff] focus:outline-none"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            type="submit"
            className="w-64 h-12 rounded-full bg-[#2e2e68] hover:bg-[#2e2e68]/90 text-white font-medium disabled:opacity-60 flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-white"
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
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </div>

        <p className="text-center text-sm text-[#040029]">
          Remember your password?{" "}
          <Link href="/login" className="text-[#162db0] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}

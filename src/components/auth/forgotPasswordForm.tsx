"use client"

import React from "react"
import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { sendResetPasswordAction } from "@/app/actions/auth/sendResetPassword"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validate email
    if (!email.trim()) {
      setError("Email is required.")
      return
    }
    
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.")
      return
    }

    setIsLoading(true)

    try {
      const result = await sendResetPasswordAction(email.toLowerCase().trim())

      if (!result.success) {
        setError(result.message || "Failed to send reset email. Please try again.")
        setIsLoading(false)
        return
      }

      setSubmitted(true)
    } catch (err) {
      console.error("Forgot password error:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8">
      <Link href="/login" className="inline-flex items-center gap-2 text-[#162db0] hover:text-[#162db0]/80 font-medium mb-6">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#040029]">Forgot your password?</h1>
          <p className="text-[#040029]/70">No worries, we&apos;ll help you reset it!</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {!submitted ? (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#040029] font-semibold">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-[#54a4ff] bg-[#f4fcfd] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30 disabled:opacity-60"
                  placeholder="Enter your email address"
                  required
                  disabled={isLoading}
                />
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
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4 text-center py-8">
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-[#2e2e68]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#040029]">Check your email</h2>
            <p className="text-[#040029]/70">We&apos;ve sent a password reset link to {email}</p>
            <p className="text-sm text-[#040029]/60">Please check your inbox and follow the link to reset your password. The link will expire in 1 hour.</p>
          </div>
        )}

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

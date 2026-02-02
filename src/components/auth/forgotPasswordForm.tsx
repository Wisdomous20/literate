"use client"

import React from "react"
import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log({ email })
    setSubmitted(true)
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8">
      <Link href="/" className="inline-flex items-center gap-2 text-[#162db0] hover:text-[#162db0]/80 font-medium mb-6">
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
                  className="h-12 rounded-xl border-[#54a4ff] bg-[#f4fcfd] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30"
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                className="w-64 h-12 rounded-full bg-[#2e2e68] hover:bg-[#2e2e68]/90 text-white font-medium"
              >
                Send Reset Link
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
            <p className="text-sm text-[#040029]/60">Please check your inbox and follow the link to reset your password.</p>
          </div>
        )}

        <p className="text-center text-sm text-[#040029]">
          Remember your password?{" "}
          <Link href="/dashboard" className="text-[#162db0] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}

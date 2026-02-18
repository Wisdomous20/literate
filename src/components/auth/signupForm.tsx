"use client"

import React from "react"
import { useState } from "react"
import Link from "next/link"
// import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { registerUserAction } from "@/app/actions/auth/register"

export function SignupForm() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  // const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await registerUserAction({
        firstName,
        lastName,
        email,
        password,
      })

      if (!result.success) {
        setError(result.error || "Registration failed. Please try again.")
      } else {
        setSuccess(true)
        // Optionally redirect after successful registration
        // router.push("/auth/login")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="space-y-4 text-center py-8">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-[#2e2e68]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#040029]">Check your email</h2>
          <p className="text-[#040029]/70">We&apos;ve sent a verification link to {email}</p>
          <p className="text-sm text-[#040029]/60">Please check your inbox and verify your email to complete registration.</p>
        </div>
        <p className="text-center text-sm text-[#040029]">
          Already verified?{" "}
          <Link href="/login" className="text-[#162db0] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[#040029]">Create your account</h1>
        <p className="text-[#040029]/70">Create your LiteRate account for a smarter reading evaluation!</p>
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
              className="h-12 rounded-xl border-[#54a4ff] bg-[#f4fcfd] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30"
              required
              disabled={isLoading}
            />
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
              className="h-12 rounded-xl border-[#54a4ff] bg-[#f4fcfd] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30"
              required
              disabled={isLoading}
            />
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
            className="h-12 rounded-xl border-[#54a4ff] bg-[#f4fcfd] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[#040029] font-semibold">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl border-[#54a4ff] bg-[#f4fcfd] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30"
            required
            disabled={isLoading}
            minLength={8}
          />
          <p className="text-xs text-[#040029]/60">Password must be at least 8 characters</p>
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
        <Link href="/login" className="text-[#162db0] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  )
}
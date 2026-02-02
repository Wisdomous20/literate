"use client"

import React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function SignupForm() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Signup failed")
        setIsLoading(false)
        return
      }

      router.push("/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during signup")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[#040029]">Create your account</h1>
        <p className="text-[#040029]/70">Join LiteRate today and get started!</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
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
              className="h-12 rounded-xl border-[#54a4ff] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30"
              disabled={isLoading}
              required
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
              className="h-12 rounded-xl border-[#54a4ff] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30"
              disabled={isLoading}
              required
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
            className="h-12 rounded-xl border-[#54a4ff] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30"
            disabled={isLoading}
            required
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
            className="h-12 rounded-xl border-[#54a4ff] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30"
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-[#040029] font-semibold">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-12 rounded-xl border-[#54a4ff] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30"
            disabled={isLoading}
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 rounded-full bg-[#2e2e68] hover:bg-[#2e2e68]/90 text-white font-medium"
        disabled={isLoading}
      >
        {isLoading ? "Creating account..." : "Sign Up"}
      </Button>

      <p className="text-center text-sm text-[#040029]">
        Already have an account?{" "}
        <Link href="/login" className="text-[#162db0] hover:underline font-medium">
          Login
        </Link>
      </p>
    </form>
  )
}

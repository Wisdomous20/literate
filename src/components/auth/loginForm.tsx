"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn, getSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error || "Invalid email or password")
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        // Get updated session
        const session = await getSession()

        if (!session?.user?.role) {
          setError("Unable to determine user role. Please try again.")
          setIsLoading(false)
          return
        }

        // Redirect based on role
        if (session.user.role === "ADMIN") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }

        router.refresh()
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[#040029]">Login to your account</h1>
        <p className="text-[#040029]/70">Get access to your LiteRate account now!</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

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
            className="h-12 rounded-xl border-[#54a4ff] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30 disabled:opacity-60"
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
            className="h-12 rounded-xl border-[#54a4ff] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30 disabled:opacity-60"
            required
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />
            <span className="text-sm text-[#040029]">Remember me</span>
          </label>

          <Link
            href="/forgot-password"
            className="text-sm text-[#162db0] hover:underline font-medium"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 rounded-full bg-[#2e2e68] hover:bg-[#2e2e68]/90 text-white font-medium disabled:opacity-60 flex items-center justify-center"
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
            Processing...
          </>
        ) : (
          "Login"
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#e2e8f0]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-[#040029]/60">or</span>
        </div>
      </div>

      <p className="text-center text-sm text-[#040029]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[#162db0] hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </form>
  )
}
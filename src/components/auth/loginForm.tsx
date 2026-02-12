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
  const [loadingMessage, setLoadingMessage] = useState("Logging in...")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    setLoadingMessage("Verifying credentials...")

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
        setLoadingMessage("Verifying role...")

        // Get updated session
        const session = await getSession()

        if (!session?.user?.role) {
          setError("Unable to determine user role. Please try again.")
          setIsLoading(false)
          return
        }

        setLoadingMessage("Redirecting...")

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
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm">
            <div className="flex justify-center mb-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-[#e2e8f0]" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#2e2e68] border-r-[#2e2e68] animate-spin" />
              </div>
            </div>

            <p className="text-[#040029] font-semibold text-lg mb-2">
              {loadingMessage}
            </p>
            <p className="text-[#040029]/60 text-sm">Please wait...</p>

            <div className="mt-6 flex gap-1 justify-center">
              <div className="h-1 w-8 bg-[#2e2e68] rounded-full animate-pulse" />
              <div className="h-1 w-8 bg-[#2e2e68] rounded-full animate-pulse [animation-delay:0.2s]" />
              <div className="h-1 w-8 bg-[#2e2e68] rounded-full animate-pulse [animation-delay:0.4s]" />
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#040029]">
            Login to your account
          </h1>
          <p className="text-[#040029]/70">
            Get access to your LiteRate account now!
          </p>
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
          className="w-full h-12 rounded-full bg-[#2e2e68] hover:bg-[#2e2e68]/90 text-white font-medium disabled:opacity-60"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Login"}
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
          <Link
            href="/signup"
            className="text-[#162db0] hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </form>
    </>
  )
}
"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement login logic with Supabase/Prisma
    console.log({ email, password, rememberMe })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[#040029]">Login to your account</h1>
        <p className="text-[#040029]/70">Get access to your LiteRate account now!</p>
      </div>

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
            className="h-12 rounded-xl border-[#54a4ff] focus-visible:border-[#54a4ff] focus-visible:ring-[#54a4ff]/30"
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
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-[#040029]">Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-sm text-[#162db0] hover:underline font-medium">
            Forgot password?
          </Link>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 rounded-full bg-[#2e2e68] hover:bg-[#2e2e68]/90 text-white font-medium"
      >
        Login
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#e2e8f0]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-[#040029]/60">or</span>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          type="button"
          className="flex items-center justify-center w-12 h-12 rounded-full border border-[#e2e8f0] bg-white hover:bg-[#fafafa] transition-colors"
          aria-label="Login with Facebook"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path
              d="M24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 17.9895 4.3882 22.954 10.125 23.8542V15.4688H7.07812V12H10.125V9.35625C10.125 6.34875 11.9166 4.6875 14.6576 4.6875C15.9701 4.6875 17.3438 4.92188 17.3438 4.92188V7.875H15.8306C14.34 7.875 13.875 8.80008 13.875 9.75V12H17.2031L16.6711 15.4688H13.875V23.8542C19.6118 22.954 24 17.9895 24 12Z"
              fill="#1877F2"
            />
          </svg>
        </button>
        <button
          type="button"
          className="flex items-center justify-center w-12 h-12 rounded-full border border-[#e2e8f0] bg-white hover:bg-[#fafafa] transition-colors"
          aria-label="Login with Google"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path
              d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z"
              fill="#4285F4"
            />
            <path
              d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.13999 18.63 6.70999 16.7 5.83999 14.1H2.17999V16.94C3.98999 20.53 7.69999 23 12 23Z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.1C5.62 13.44 5.49 12.73 5.49 12C5.49 11.27 5.62 10.56 5.84 9.9V7.06H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.94L5.84 14.1Z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.02L19.36 3.87C17.45 2.09 14.97 1 12 1C7.69999 1 3.98999 3.47 2.17999 7.06L5.83999 9.9C6.70999 7.3 9.13999 5.38 12 5.38Z"
              fill="#EA4335"
            />
          </svg>
        </button>
      </div>

      <p className="text-center text-sm text-[#040029]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[#162db0] hover:underline font-medium">
          Create Account
        </Link>
      </p>
    </form>
  )
}

"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Loader2 } from "lucide-react"

interface CreateClassModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateClass: (data: { className: string; schoolYear: string }) => Promise<{ success: boolean; error?: string }>
}

// Helper to get current school year (e.g., "2026-2027")
function getCurrentSchoolYear(): string {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed (0 = January)
  
  // If it's August or later, the school year starts this year
  // Otherwise, the school year started last year
  if (currentMonth >= 7) { // August onwards
    return `${currentYear}-${currentYear + 1}`
  } else {
    return `${currentYear - 1}-${currentYear}`
  }
}

export function CreateClassModal({ isOpen, onClose, onCreateClass }: CreateClassModalProps) {
  const [className, setClassName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const schoolYear = getCurrentSchoolYear() // Auto-filled and read-only
  const backdropRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle body scroll lock
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setClassName("")
      setError(null)
      setIsLoading(false)
    }
  }, [isOpen])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!className.trim() || isLoading) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await onCreateClass({ className, schoolYear })
      
      if (result.success) {
        setClassName("")
        onClose()
      } else {
        setError(result.error || "Failed to create class")
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [className, schoolYear, onCreateClass, onClose, isLoading])

  // Don't render on server or when closed
  if (typeof window === "undefined" || !isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 99999 }}
    >
      {/* Backdrop with blur - covers entire viewport */}
      <div 
        ref={backdropRef}
        className="absolute inset-0 animate-in fade-in duration-300"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative animate-in fade-in zoom-in-95 duration-300"
      >
        <div 
          className="w-[500px] bg-white p-8"
          style={{
            borderRadius: "30px",
            boxShadow: "0px 10px 60px rgba(0, 48, 110, 0.25)"
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute right-6 top-6 text-[#00306E]/50 transition-colors hover:text-[#00306E] disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="mb-8">
            <h2 
              className="text-[28px] font-bold leading-tight"
              style={{ color: "#31318A" }}
            >
              Create Class
            </h2>
            <p className="mt-1 text-base text-[#00306E]/70">
              Create Class for your students
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Class Name Field */}
            <div className="flex items-center gap-6">
              <label 
                htmlFor="className" 
                className="w-[120px] shrink-0 text-base font-semibold text-[#00306E]"
              >
                Class Name
              </label>
              <input
                id="className"
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                disabled={isLoading}
                className="flex-1 rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none transition-colors focus:border-[#6666FF] disabled:opacity-50"
                style={{
                  boxShadow: "inset 0px 2px 4px rgba(0, 48, 110, 0.08)"
                }}
                placeholder="Enter class name"
              />
            </div>

            {/* School Year Field - Read Only */}
            <div className="flex items-center gap-6">
              <label 
                htmlFor="schoolYear" 
                className="w-[120px] shrink-0 text-base font-semibold text-[#00306E]"
              >
                School Year
              </label>
              <input
                id="schoolYear"
                type="text"
                value={schoolYear}
                readOnly
                className="flex-1 cursor-not-allowed rounded-lg border-2 border-[#E4F4FF] bg-[#F8FAFC] px-4 py-3 text-base text-[#00306E]/70 outline-none"
                style={{
                  boxShadow: "inset 0px 2px 4px rgba(0, 48, 110, 0.08)"
                }}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={isLoading || !className.trim()}
                className="rounded-lg px-10 py-3 text-base font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{
                  background: "#2E2E68",
                  boxShadow: "0px 4px 15px rgba(46, 46, 104, 0.4)"
                }}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? "Creating..." : "Create Class"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body)
}
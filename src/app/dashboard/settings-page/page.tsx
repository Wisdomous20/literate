"use client"

import { DashboardHeader } from "@/components/dashboard/dashboardHeader"
import { useSettings } from "@/context/settingsContext"
import { CheckCircle, FileText, BookOpen, Info } from "lucide-react"

interface ToggleRowProps {
  icon: React.ReactNode
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
}

function ToggleRow({ icon, label, description, enabled, onToggle }: ToggleRowProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-5 py-4 transition-all duration-200 ${
        enabled
          ? "border-[rgba(102,102,255,0.2)] bg-[rgba(102,102,255,0.06)]"
          : "border-[rgba(0,48,110,0.08)] bg-white"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
            enabled ? "bg-[rgba(102,102,255,0.12)]" : "bg-[rgba(0,48,110,0.05)]"
          }`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#00306E]">{label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[#6B7DB3]">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-label={enabled ? `Disable ${label}` : `Enable ${label}`}
        title={enabled ? `Disable ${label}` : `Enable ${label}`}
        className={`relative ml-4 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
          enabled ? "bg-[#6666FF]" : "bg-[#C4C4FF]"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  )
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6666FF]">{icon}</div>
      <h3 className="text-xs font-bold tracking-[0.15em] text-[#31318A]">{title}</h3>
    </div>
  )
}

export default function SettingsPage() {
  const {
    autoFinishEnabled,
    setAutoFinishEnabled,
  } = useSettings()

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DashboardHeader title="Settings" />

      <main className="flex-1 overflow-auto px-8 py-8">
        <div className="mx-auto max-w-180">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-[#0C1A6D]">Test Configurations</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7DB3]">
              Manage how reading assessments behave during testing sessions.
            </p>
          </div>

          <section className="mb-10">
            <SectionHeader
              icon={<FileText className="h-4 w-4 text-white" />}
              title="ORAL READING TEST"
            />
            <div className="space-y-3">
              <ToggleRow
                icon={
                  <CheckCircle
                    className={`h-5 w-5 ${autoFinishEnabled ? "text-[#6666FF]" : "text-[#6B7DB3]"}`}
                  />
                }
                label="Auto-Finish Reading"
                description="Automatically stop recording and finish the test when the student reads the last word of the passage. The teacher can still manually press Done at any time."
                enabled={autoFinishEnabled}
                onToggle={() => setAutoFinishEnabled(!autoFinishEnabled)}
              />
            </div>
          </section>

          <section className="mb-10">
            <SectionHeader
              icon={<BookOpen className="h-4 w-4 text-white" />}
              title="READING FLUENCY TEST"
            />
            <div className="space-y-3">
              <ToggleRow
                icon={
                  <CheckCircle
                    className={`h-5 w-5 ${autoFinishEnabled ? "text-[#6666FF]" : "text-[#6B7DB3]"}`}
                  />
                }
                label="Auto-Finish Reading"
                description="Automatically stop the fluency test recording when the last word is detected."
                enabled={autoFinishEnabled}
                onToggle={() => setAutoFinishEnabled(!autoFinishEnabled)}
              />
            </div>
          </section>

          <div className="flex items-start gap-3 rounded-xl border border-dashed border-[rgba(102,102,255,0.2)] bg-[rgba(102,102,255,0.04)] px-5 py-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6666FF]" />
            <p className="text-xs leading-relaxed text-[#6B7DB3]">
              <span className="font-semibold text-[#31318A]">Note:</span>{" "}
              Auto-Finish relies on the Web Speech API for real-time
              speech detection. This feature works best on{" "}
              <span className="font-medium text-[#31318A]">Chrome</span> and{" "}
              <span className="font-medium text-[#31318A]">Edge</span> browsers.
              Settings apply to all reading tests in the current session.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Mic,
  Volume2,
  Wifi,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  X,
  ChevronDown,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const MIC_STORAGE_KEY = "literate-selected-mic"

type Status = "checking" | "good" | "warning" | "error"

interface CheckResult {
  status: Status
  label: string
  detail: string
}

interface MicDevice {
  deviceId: string
  label: string
}

/** Get the saved mic device ID from localStorage */
export function getSavedMicDeviceId(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(MIC_STORAGE_KEY)
  } catch {
    return null
  }
}

function ReadinessModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [micCheck, setMicCheck] = useState<CheckResult>({
    status: "checking",
    label: "Microphone",
    detail: "Detecting...",
  })
  const [noiseCheck, setNoiseCheck] = useState<CheckResult>({
    status: "checking",
    label: "Noise Level",
    detail: "Analyzing...",
  })
  const [internetCheck, setInternetCheck] = useState<CheckResult>({
    status: "checking",
    label: "Internet",
    detail: "Testing...",
  })
  const [noiseLevel, setNoiseLevel] = useState(0)
  const [availableMics, setAvailableMics] = useState<MicDevice[]>([])
  const [selectedMicId, setSelectedMicId] = useState<string>("")
  const [micDropdownOpen, setMicDropdownOpen] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const micDropdownRef = useRef<HTMLDivElement>(null)

  // Close mic dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (micDropdownRef.current && !micDropdownRef.current.contains(e.target as Node)) {
        setMicDropdownOpen(false)
      }
    }
    if (micDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [micDropdownOpen])

  const cleanup = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
  }, [])

  const startNoiseMonitoring = useCallback((stream: MediaStream) => {
    // Stop any existing noise monitoring
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close()
    }

    try {
      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const measureNoise = () => {
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length
        const level = Math.min(100, Math.round((avg / 128) * 100))
        setNoiseLevel(level)

        if (level < 15) {
          setNoiseCheck({ status: "good", label: "Noise Level", detail: "Environment is quiet" })
        } else if (level < 40) {
          setNoiseCheck({ status: "warning", label: "Noise Level", detail: "Some background noise detected" })
        } else {
          setNoiseCheck({ status: "error", label: "Noise Level", detail: "Environment is too noisy" })
        }

        animFrameRef.current = requestAnimationFrame(measureNoise)
      }
      measureNoise()
    } catch {
      setNoiseCheck({ status: "warning", label: "Noise Level", detail: "Unable to analyze noise level" })
    }
  }, [])

  const switchMic = useCallback(async (deviceId: string) => {
    // Stop current stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }

    setMicCheck({ status: "checking", label: "Microphone", detail: "Switching..." })
    setNoiseCheck({ status: "checking", label: "Noise Level", detail: "Analyzing..." })
    setNoiseLevel(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      })
      streamRef.current = stream
      const deviceLabel = stream.getAudioTracks()[0]?.label || "Microphone"
      setSelectedMicId(deviceId)
      setMicCheck({ status: "good", label: "Microphone", detail: deviceLabel })

      // Save selection
      try {
        localStorage.setItem(MIC_STORAGE_KEY, deviceId)
      } catch {}

      // Restart noise monitoring with new stream
      startNoiseMonitoring(stream)
    } catch {
      setMicCheck({
        status: "error",
        label: "Microphone",
        detail: "Failed to switch microphone",
      })
      setNoiseCheck({
        status: "error",
        label: "Noise Level",
        detail: "Cannot analyze without microphone",
      })
    }
  }, [startNoiseMonitoring])

  const runChecks = useCallback(async () => {
    setMicCheck({ status: "checking", label: "Microphone", detail: "Detecting..." })
    setNoiseCheck({ status: "checking", label: "Noise Level", detail: "Analyzing..." })
    setInternetCheck({ status: "checking", label: "Internet", detail: "Testing..." })
    setNoiseLevel(0)
    setAvailableMics([])
    cleanup()

    // 1. Microphone — use saved device if available
    let stream: MediaStream | null = null
    const savedDeviceId = getSavedMicDeviceId()

    try {
      const audioConstraints: MediaStreamConstraints["audio"] = savedDeviceId
        ? { deviceId: { ideal: savedDeviceId } }
        : true

      stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
      streamRef.current = stream

      const activeTrack = stream.getAudioTracks()[0]
      const deviceLabel = activeTrack?.label || "Default microphone"
      const activeDeviceId = activeTrack?.getSettings()?.deviceId || ""
      setSelectedMicId(activeDeviceId)
      setMicCheck({ status: "good", label: "Microphone", detail: deviceLabel })

      // Enumerate available mics (must happen after getUserMedia for labels)
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const mics = devices
          .filter((d) => d.kind === "audioinput")
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${i + 1}`,
          }))
        setAvailableMics(mics)
      } catch {}
    } catch {
      setMicCheck({
        status: "error",
        label: "Microphone",
        detail: "No microphone detected or access denied",
      })
      setNoiseCheck({
        status: "error",
        label: "Noise Level",
        detail: "Cannot analyze without microphone",
      })
    }

    // 2. Noise level
    if (stream) {
      startNoiseMonitoring(stream)
    }

    // 3. Internet
    try {
      const start = performance.now()
      await fetch("/api/auth/session", { method: "HEAD", cache: "no-store" })
      const latency = Math.round(performance.now() - start)

      if (latency < 300) {
        setInternetCheck({ status: "good", label: "Internet", detail: `Stable (${latency}ms)` })
      } else if (latency < 800) {
        setInternetCheck({ status: "warning", label: "Internet", detail: `Slow connection (${latency}ms)` })
      } else {
        setInternetCheck({ status: "error", label: "Internet", detail: `Unstable connection (${latency}ms)` })
      }
    } catch {
      setInternetCheck({ status: "error", label: "Internet", detail: "No internet connection" })
    }
  }, [cleanup, startNoiseMonitoring])

  // Run checks when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        runChecks()
      }, 0)
    } else {
      cleanup()
    }
    return cleanup
  }, [open, runChecks, cleanup])

  const allChecks = [micCheck, noiseCheck, internetCheck]
  const isChecking = allChecks.some((c) => c.status === "checking")
  const overallGood = allChecks.every((c) => c.status === "good")
  const hasError = allChecks.some((c) => c.status === "error")

  const statusIcon = (status: Status) => {
    if (status === "checking")
      return <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#54A4FF] border-t-transparent" />
    if (status === "good") return <CheckCircle className="h-4 w-4 text-green-500" />
    if (status === "warning") return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const checkIcon = (label: string, status: Status) => {
    const color =
      status === "good" ? "#22C55E" : status === "warning" ? "#EAB308" : status === "error" ? "#EF4444" : "#54A4FF"
    if (label === "Microphone") return <Mic className="h-5 w-5" style={{ color }} />
    if (label === "Noise Level") return <Volume2 className="h-5 w-5" style={{ color }} />
    return <Wifi className="h-5 w-5" style={{ color }} />
  }

  const borderColor = (status: Status) =>
    status === "good"
      ? "rgba(34, 197, 94, 0.3)"
      : status === "warning"
        ? "rgba(234, 179, 8, 0.3)"
        : status === "error"
          ? "rgba(239, 68, 68, 0.3)"
          : "rgba(84, 164, 255, 0.3)"

  const bgColor = (status: Status) =>
    status === "good"
      ? "rgba(34, 197, 94, 0.08)"
      : status === "warning"
        ? "rgba(234, 179, 8, 0.08)"
        : status === "error"
          ? "rgba(239, 68, 68, 0.08)"
          : "rgba(84, 164, 255, 0.08)"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2 text-lg font-bold"
            style={{ color: "#0C1A6D" }}
          >
            <ShieldCheck className="h-5 w-5" style={{ color: "#6666FF" }} />
            {isChecking ? "Checking Readiness..." : "Readiness Check"}
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" style={{ color: "#0C1A6D" }} />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {allChecks.map((check) => (
            <div key={check.label}>
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background: bgColor(check.status),
                  border: `1px solid ${borderColor(check.status)}`,
                  borderRadius: check.label === "Microphone" && availableMics.length > 1
                    ? "12px 12px 0 0"
                    : "12px",
                }}
              >
                {/* Icon */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: bgColor(check.status) }}
                >
                  {checkIcon(check.label, check.status)}
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: "#0C1A6D" }}>
                      {check.label}
                    </span>
                    {statusIcon(check.status)}
                  </div>
                  <p
                    className="mt-0.5 text-xs"
                    style={{
                      color:
                        check.status === "good"
                          ? "#16A34A"
                          : check.status === "warning"
                            ? "#A16207"
                            : check.status === "error"
                              ? "#DC2626"
                              : "#6B7DB3",
                    }}
                  >
                    {check.detail}
                  </p>
                </div>

                {/* Noise level bar */}
                {check.label === "Noise Level" && check.status !== "checking" && check.status !== "error" && (
                  <div className="w-16 shrink-0">
                    <div
                      className="h-2 w-full overflow-hidden rounded-full"
                      style={{ background: "rgba(84, 164, 255, 0.15)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{
                          width: `${noiseLevel}%`,
                          background:
                            noiseLevel < 15 ? "#22C55E" : noiseLevel < 40 ? "#EAB308" : "#EF4444",
                        }}
                      />
                    </div>
                    <span className="mt-0.5 block text-center text-[9px] font-medium" style={{ color: "#6B7DB3" }}>
                      {noiseLevel}%
                    </span>
                  </div>
                )}
              </div>

              {/* Mic selector dropdown — shown below mic check row */}
              {check.label === "Microphone" && availableMics.length > 1 && (
                <div
                  className="relative"
                  ref={micDropdownRef}
                  style={{
                    background: bgColor(micCheck.status),
                    borderLeft: `1px solid ${borderColor(micCheck.status)}`,
                    borderRight: `1px solid ${borderColor(micCheck.status)}`,
                    borderBottom: `1px solid ${borderColor(micCheck.status)}`,
                    borderRadius: "0 0 12px 12px",
                    padding: "0 16px 12px 16px",
                  }}
                >
                  <button
                    onClick={() => setMicDropdownOpen(!micDropdownOpen)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:opacity-80"
                    style={{
                      background: "rgba(84, 164, 255, 0.1)",
                      color: "#0C1A6D",
                      border: "1px solid rgba(84, 164, 255, 0.25)",
                    }}
                  >
                    <span className="truncate">
                      {availableMics.find((m) => m.deviceId === selectedMicId)?.label || "Select microphone"}
                    </span>
                    <ChevronDown
                      className="h-3.5 w-3.5 shrink-0 transition-transform"
                      style={{
                        color: "#54A4FF",
                        transform: micDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  </button>

                  {micDropdownOpen && (
                    <div
                      className="absolute left-4 right-4 z-10 mt-1 overflow-hidden rounded-lg shadow-lg"
                      style={{
                        background: "#fff",
                        border: "1px solid rgba(84, 164, 255, 0.25)",
                      }}
                    >
                      {availableMics.map((mic) => (
                        <button
                          key={mic.deviceId}
                          onClick={() => {
                            setMicDropdownOpen(false)
                            if (mic.deviceId !== selectedMicId) {
                              switchMic(mic.deviceId)
                            }
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors hover:bg-[rgba(84,164,255,0.08)]"
                          style={{
                            color: mic.deviceId === selectedMicId ? "#6666FF" : "#0C1A6D",
                            fontWeight: mic.deviceId === selectedMicId ? 600 : 400,
                            borderBottom: "1px solid rgba(84, 164, 255, 0.1)",
                          }}
                        >
                          <Mic className="h-3.5 w-3.5 shrink-0" style={{
                            color: mic.deviceId === selectedMicId ? "#6666FF" : "#9CA3AF",
                          }} />
                          <span className="truncate">{mic.label}</span>
                          {mic.deviceId === selectedMicId && (
                            <CheckCircle className="ml-auto h-3.5 w-3.5 shrink-0" style={{ color: "#6666FF" }} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Overall status */}
        {!isChecking && (
          <div
            className="rounded-lg px-4 py-2.5 text-center"
            style={{
              background: overallGood
                ? "rgba(34, 197, 94, 0.08)"
                : hasError
                  ? "rgba(239, 68, 68, 0.08)"
                  : "rgba(234, 179, 8, 0.08)",
              border: `1px solid ${
                overallGood
                  ? "rgba(34, 197, 94, 0.2)"
                  : hasError
                    ? "rgba(239, 68, 68, 0.2)"
                    : "rgba(234, 179, 8, 0.2)"
              }`,
            }}
          >
            <span
              className="text-xs font-semibold"
              style={{
                color: overallGood ? "#16A34A" : hasError ? "#DC2626" : "#A16207",
              }}
            >
              {overallGood
                ? "✓ All systems ready — you're good to start!"
                : hasError
                  ? "✗ Some issues detected — please resolve before starting"
                  : "⚠ Minor issues — recording quality may be affected"}
            </span>
          </div>
        )}

        {/* Recheck & Close buttons */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors hover:opacity-90"
            style={{
              background: "rgba(102, 102, 255, 0.1)",
              color: "#6666FF",
              border: "1px solid rgba(102, 102, 255, 0.25)",
            }}
          >
            Close
          </button>
          <button
            onClick={runChecks}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors hover:opacity-90"
            style={{ background: "#6666FF" }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Recheck
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ReadinessCheckButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80"
        style={{
          background: "rgba(102, 102, 255, 0.12)",
          color: "#6666FF",
          border: "1px solid rgba(102, 102, 255, 0.25)",
        }}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Readiness Check
      </button>

      <ReadinessModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}
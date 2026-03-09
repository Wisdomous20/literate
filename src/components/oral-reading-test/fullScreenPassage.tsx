"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { X, CircleCheckBig } from "lucide-react"
import { useSettings } from "@/context/settingsContext"
import { getPassageTextStyle } from "./passageDisplay"

interface FullScreenPassageProps {
  content: string
  passageTitle?: string
  onDone: (elapsedSeconds: number, audioURL: string | null, audioBlob: Blob | null) => void
  onClose: () => void
  countdownEnabled?: boolean
  countdownSeconds?: number
  passageLevel?: string
}

function normalize(word: string): string {
  return word.toLowerCase().replace(/[^a-zA-Z0-9]/g, "")
}

export function FullScreenPassage({
  content,
  passageTitle = "Whispering Winds",
  onDone,
  onClose,
  countdownEnabled = true,
  countdownSeconds = 3,
  passageLevel,
}: FullScreenPassageProps) {
  const passageTextStyle = getPassageTextStyle(passageLevel);
  const { autoFinishEnabled } = useSettings()
  const [countdown, setCountdown] = useState(countdownEnabled ? countdownSeconds : 0)
  const [seconds, setSeconds] = useState(0)
  const [showOverlayUI, setShowOverlayUI] = useState(true)
  const [recordingReady, setRecordingReady] = useState(false)
  const isCountingDown = countdownEnabled && countdown > 0
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioURLRef = useRef<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const hasStartedRef = useRef(false)
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const wordTrackIndexRef = useRef(0)
  const anchorRefs = useRef<(HTMLSpanElement | null)[]>([])
  const doneCalledRef = useRef(false)
  const secondsRef = useRef(0)
  const processedResultsRef = useRef(0)

  // Ref for setting so speech callback always has latest value
  const autoFinishRef = useRef(autoFinishEnabled)

  // Pre-acquire microphone during countdown so recording starts with zero latency at countdown=0
  useEffect(() => {
    if (!navigator.mediaDevices) return
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        if (!hasStartedRef.current) {
          streamRef.current = stream
        } else {
          // Recording already started (no countdown case) — discard duplicate stream
          stream.getTracks().forEach((t) => t.stop())
        }
      })
      .catch(() => {
        // Permission denied or unavailable — startRecordingAndTimer will handle the error
      })
  }, [])

  useEffect(() => {
    autoFinishRef.current = autoFinishEnabled
  }, [autoFinishEnabled])

  // Keep a ref in sync with seconds
  useEffect(() => {
    secondsRef.current = seconds
  }, [seconds])

  // Split into words and whitespace tokens
  const tokens = content.split(/(\s+)/).filter(Boolean)
  const tokenMeta = tokens.map((t) => ({ text: t, isSpace: /^\s+$/.test(t) }))

  // Build a list of only the non-space token indices for tracking
  const trackableIndices = tokenMeta
    .map((t, i) => (!t.isSpace ? i : -1))
    .filter((i) => i !== -1)

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Auto-hide overlay UI
  const scheduleHideOverlay = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    setShowOverlayUI(true)
    hideTimerRef.current = setTimeout(() => {
      setShowOverlayUI(false)
    }, 3000)
  }, [])

  const handleMouseMove = useCallback(() => {
    scheduleHideOverlay()
  }, [scheduleHideOverlay])

  useEffect(() => {
    if (!isCountingDown && hasStartedRef.current) {
      setTimeout(() => {
        scheduleHideOverlay()
      }, 0)
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [isCountingDown, scheduleHideOverlay])

  const stopEverything = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.abort()
    }
  }, [])

  const finishReading = useCallback(() => {
    if (doneCalledRef.current) return
    doneCalledRef.current = true
    stopEverything()
    setTimeout(() => {
      const audioBlob = audioChunksRef.current.length > 0
        ? new Blob(audioChunksRef.current, { type: "audio/webm" })
        : null
      onDone(secondsRef.current, audioURLRef.current, audioBlob)
    }, 100)
  }, [onDone, stopEverything])

  // Start speech recognition for auto-finish
  const startSpeechRecognition = useCallback(() => {
    if (!autoFinishRef.current) return

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      console.warn("SpeechRecognition not supported in this browser")
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognitionRef.current = recognition
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    const totalTrackable = trackableIndices.length
    processedResultsRef.current = 0

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let r = processedResultsRef.current; r < event.results.length; r++) {
        const result = event.results[r]
        if (!result.isFinal && r < event.results.length - 1) continue

        const transcript = result[0].transcript.trim()
        const spokenWords = transcript.split(/\s+/)

        for (const spoken of spokenWords) {
          const normalizedSpoken = normalize(spoken)
          if (!normalizedSpoken) continue

          const currentTrackPos = wordTrackIndexRef.current
          const searchEnd = Math.min(currentTrackPos + 30, totalTrackable)

          for (let i = currentTrackPos; i < searchEnd; i++) {
            const tokenIdx = trackableIndices[i]
            const passageWord = normalize(tokenMeta[tokenIdx].text)

            if (passageWord && normalizedSpoken === passageWord) {
              wordTrackIndexRef.current = i + 1

              if (i + 1 >= totalTrackable) {
                console.log("Auto-finish triggered: last word detected")
                setTimeout(() => {
                  finishReading()
                }, 500)
                return
              }

              break
            }
          }
        }

        if (result.isFinal) {
          processedResultsRef.current = r + 1
        }
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Speech recognition error:", event.error)
      }
    }

    recognition.onend = () => {
      if (hasStartedRef.current && recognitionRef.current && !doneCalledRef.current) {
        processedResultsRef.current = 0
        try {
          recognition.start()
        } catch {
          // Already running
        }
      }
    }

    try {
      recognition.start()
      console.log("Speech recognition started for auto-finish")
    } catch (err) {
      console.error("Failed to start speech recognition:", err)
    }
  }, [tokenMeta, trackableIndices, finishReading])

  // Start recording + timer + speech recognition using SHARED stream
  const startRecordingAndTimer = useCallback(async () => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    // Reuse the pre-acquired stream (from the countdown useEffect) to avoid
    // getUserMedia latency at countdown=0. Fall back to a fresh request if
    // the pre-acquire hasn't resolved yet or was denied.
    let stream: MediaStream | null = streamRef.current

    try {
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
      }

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        audioURLRef.current = URL.createObjectURL(audioBlob)
        stream?.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
    } catch {
      console.error("Microphone access denied")
    }

    if (streamRef.current) {
      startSpeechRecognition()
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1)
    }, 1000)

    // Brief warm-up: let the recorder settle before showing the passage
    setTimeout(() => {
      setRecordingReady(true)
    }, 300)
  }, [startSpeechRecognition])

  // Countdown
  useEffect(() => {
    if (!countdownEnabled) {
      startRecordingAndTimer()
      return
    }

    if (countdown <= 0) {
      startRecordingAndTimer()
      return
    }

    const timeout = setTimeout(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [countdown, countdownEnabled, startRecordingAndTimer])

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (recognitionRef.current) {
        recognitionRef.current.onend = null
        recognitionRef.current.abort()
      }
    }
  }, [])

  const handleClose = useCallback(() => {
    stopEverything()
    onClose()
  }, [onClose, stopEverything])

  // Countdown overlay
  if (isCountingDown || !recordingReady) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#E4F4FF]">
        <div className="flex flex-col items-center gap-6">
          <p className="text-lg font-semibold text-[#31318A]">{isCountingDown ? "Get Ready..." : "Starting..."}</p>
          {isCountingDown && (
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-[3px] border-[#6666FF] bg-[rgba(102,102,255,0.12)] text-6xl font-bold text-[#6666FF]">
              <span key={countdown} className="animate-pulse">
                {countdown}
              </span>
            </div>
          )}
          <p className="text-sm font-medium text-[#00306E]">
            Recording will start automatically
          </p>
        </div>
      </div>
    )
  }

  // Fullscreen passage view
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#E4F4FF]"
      onMouseMove={handleMouseMove}
    >
      {/* Passage Card */}
      <div className="flex min-h-0 flex-1 flex-col items-center px-4 pb-2 pt-4 md:px-6 md:pb-3 md:pt-6 lg:px-8 lg:pb-4 lg:pt-8">
        <div className="relative flex w-full max-w-342 flex-1 flex-col overflow-hidden rounded-[25px] border border-[rgba(74,74,252,0.44)] bg-[#EFFDFF] shadow-[0px_1px_20px_rgba(108,164,239,0.37)]">
          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            className={`absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-opacity duration-500 hover:opacity-70 md:right-6 md:top-5 ${
              showOverlayUI ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
            title="Exit fullscreen"
          >
            <X className="h-6 w-6 text-[#7A7AFB]" />
          </button>

          {/* Top-left indicators: Recording + feature badges */}
          <div
            className={`absolute left-4 top-4 z-10 flex items-center gap-3 transition-opacity duration-500 md:left-6 md:top-6 ${
              showOverlayUI ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
              <span className="text-xs font-medium text-red-500">Recording</span>
            </div>

            {autoFinishEnabled && (
              <div className="flex items-center gap-1 rounded-full border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.08)] px-2 py-0.5">
                <CircleCheckBig className="h-2.5 w-2.5 text-[#16a34a]" />
                <span className="text-[10px] font-medium text-[#16a34a]">
                  Auto Finish
                </span>
              </div>
            )}
          </div>

          {/* Top fade edge */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-1 h-12 rounded-t-[25px] bg-[linear-gradient(to_bottom,#EFFDFF_0%,transparent_100%)] md:h-16" />

          {/* Passage Content */}
          <div className="flex flex-1 flex-col overflow-auto px-6 pt-14 md:px-12 md:pt-16 lg:px-16 lg:pt-20">
            <p className="whitespace-pre-wrap text-center leading-relaxed text-[#00306E]" style={passageLevel ? passageTextStyle : undefined}>
              {tokenMeta.map((token, i) => (
                <span
                  key={i}
                  ref={(el) => { anchorRefs.current[i] = el }}
                >
                  {token.text}
                </span>
              ))}
            </p>
            <div className="h-16 w-full shrink-0 md:h-20" />
          </div>

          {/* Bottom fade edge */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-1 h-12 rounded-b-[25px] bg-[linear-gradient(to_top,#EFFDFF_0%,transparent_100%)] md:h-16" />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex shrink-0 flex-col items-center gap-1 px-4 pb-3 pt-1 md:gap-1.5 md:px-8 md:pb-5 md:pt-2">
        <span className="text-base font-semibold text-[#00306E] md:text-lg">
          {passageTitle}
        </span>

        <span className="text-base font-medium tabular-nums text-[#00306E] md:text-lg">
          {formatTime(seconds)}
        </span>

        <button
          type="button"
          onClick={finishReading}
          className="rounded-lg bg-[#6666FF] px-10 py-2.5 text-sm font-semibold text-white shadow-[0px_1px_20px_rgba(102,102,255,0.4)] transition-all duration-200 hover:brightness-110 md:px-12 md:py-3 md:text-[15px]"
        >
          Done
        </button>
      </div>
    </div>
  )
}
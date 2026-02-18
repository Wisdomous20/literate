"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { X } from "lucide-react"
import { useSettings } from "@/context/settingsContext"

interface FullScreenPassageProps {
  content: string
  passageTitle?: string
  onDone: (elapsedSeconds: number, audioURL: string | null, audioBlob: Blob | null) => void
  onClose: () => void
  countdownEnabled?: boolean
  countdownSeconds?: number
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
}: FullScreenPassageProps) {
  const { autoScrollEnabled, autoFinishEnabled } = useSettings()
  const [countdown, setCountdown] = useState(countdownEnabled ? countdownSeconds : 0)
  const [seconds, setSeconds] = useState(0)
  const [showOverlayUI, setShowOverlayUI] = useState(true)
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

  // Refs for settings so speech callback always has latest values
  const autoScrollRef = useRef(autoScrollEnabled)
  const autoFinishRef = useRef(autoFinishEnabled)
  useEffect(() => {
    autoScrollRef.current = autoScrollEnabled
  }, [autoScrollEnabled])
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

  // Start speech recognition for passive auto-scroll + auto-finish
  const startSpeechRecognition = useCallback((sharedStream: MediaStream) => {
    if (!autoScrollRef.current && !autoFinishRef.current) return

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
      // Process all results from where we last left off
      for (let r = processedResultsRef.current; r < event.results.length; r++) {
        const result = event.results[r]
        // Only process final results to avoid duplicate processing of interim
        // But also process interim for the very latest result for responsiveness
        if (!result.isFinal && r < event.results.length - 1) continue

        const transcript = result[0].transcript.trim()
        const spokenWords = transcript.split(/\s+/)

        for (const spoken of spokenWords) {
          const normalizedSpoken = normalize(spoken)
          if (!normalizedSpoken) continue

          const currentTrackPos = wordTrackIndexRef.current
          // Wide search window to handle skips and mispronunciations
          const searchEnd = Math.min(currentTrackPos + 30, totalTrackable)

          for (let i = currentTrackPos; i < searchEnd; i++) {
            const tokenIdx = trackableIndices[i]
            const passageWord = normalize(tokenMeta[tokenIdx].text)

            if (passageWord && normalizedSpoken === passageWord) {
              wordTrackIndexRef.current = i + 1

              // Auto-scroll
              if (autoScrollRef.current) {
                anchorRefs.current[tokenIdx]?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                })
              }

              // Auto-finish when last word is reached
              if (autoFinishRef.current && i + 1 >= totalTrackable) {
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

        // Update processed count only for final results
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
        // Reset processed count on restart since results array resets
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
      console.log("Speech recognition started, autoFinish:", autoFinishRef.current, "autoScroll:", autoScrollRef.current)
    } catch (err) {
      console.error("Failed to start speech recognition:", err)
    }
  }, [tokenMeta, trackableIndices, finishReading])

  // Start recording + timer + speech recognition using SHARED stream
  const startRecordingAndTimer = useCallback(async () => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    let stream: MediaStream | null = null

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
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

    // Start speech recognition (uses browser's built-in mic access)
    if (stream) {
      startSpeechRecognition(stream)
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1)
    }, 1000)
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
  if (isCountingDown) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#E4F4FF" }}>
        <div className="flex flex-col items-center gap-6">
          <p className="text-lg font-semibold" style={{ color: "#31318A" }}>
            Get Ready...
          </p>
          <div
            className="flex h-32 w-32 items-center justify-center rounded-full text-6xl font-bold"
            style={{
              background: "rgba(102, 102, 255, 0.12)",
              border: "3px solid #6666FF",
              color: "#6666FF",
            }}
          >
            <span key={countdown} className="animate-pulse">
              {countdown}
            </span>
          </div>
          <p className="text-sm font-medium" style={{ color: "#00306E" }}>
            Recording will start automatically
          </p>
        </div>
      </div>
    )
  }

  // Fullscreen passage view
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#E4F4FF" }}
      onMouseMove={handleMouseMove}
    >
      {/* Passage Card */}
      <div className="flex min-h-0 flex-1 flex-col items-center px-4 pt-4 pb-2 md:px-6 md:pt-6 md:pb-3 lg:px-8 lg:pt-8 lg:pb-4">
        <div
          className="relative flex w-full max-w-[1368px] flex-1 flex-col overflow-hidden"
          style={{
            background: "#EFFDFF",
            border: "1px solid rgba(74, 74, 252, 0.44)",
            boxShadow: "0px 1px 20px rgba(108, 164, 239, 0.37)",
            borderRadius: "25px",
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-opacity duration-500 hover:opacity-70 md:right-6 md:top-5"
            style={{ opacity: showOverlayUI ? 1 : 0, pointerEvents: showOverlayUI ? "auto" : "none" }}
            title="Exit fullscreen"
          >
            <X className="h-6 w-6" style={{ color: "#7A7AFB" }} />
          </button>

          {/* Recording indicator */}
          <div
            className="absolute left-4 top-4 flex items-center gap-2 transition-opacity duration-500 md:left-6 md:top-6"
            style={{ opacity: showOverlayUI ? 1 : 0 }}
          >
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-medium text-red-500">Recording</span>
          </div>

          {/* Top fade edge */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-12 md:h-16"
            style={{
              background: "linear-gradient(to bottom, #EFFDFF 0%, transparent 100%)",
              borderRadius: "25px 25px 0 0",
            }}
          />

          {/* Passage Content */}
          <div className="flex flex-1 flex-col items-center overflow-auto px-6 pt-14 md:px-12 md:pt-16 lg:px-16 lg:pt-20">
            <p
              className="text-center text-lg leading-[2.2] md:text-xl md:leading-[2.3] lg:text-[22px] lg:leading-[2.4]"
              style={{
                color: "#00306E",
                maxWidth: "min(680px, 90%)",
                fontFamily: "Georgia, 'Times New Roman', serif",
                letterSpacing: "0.01em",
                wordSpacing: "0.05em",
              }}
            >
              {tokenMeta.map((token, i) => (
                <span
                  key={i}
                  ref={(el) => { anchorRefs.current[i] = el }}
                >
                  {token.text}
                </span>
              ))}
            </p>
            <div className="w-full shrink-0 h-16 md:h-20" />
          </div>

          {/* Bottom fade edge */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-12 md:h-16"
            style={{
              background: "linear-gradient(to top, #EFFDFF 0%, transparent 100%)",
              borderRadius: "0 0 25px 25px",
            }}
          />
        </div>
      </div>

      {/* Bottom Controls — ALWAYS visible */}
      <div className="shrink-0 flex flex-col items-center gap-1 px-4 pb-3 pt-1 md:gap-1.5 md:px-8 md:pb-5 md:pt-2">
        <span className="text-sm font-medium md:text-base" style={{ color: "#00306E" }}>
          {passageTitle}
        </span>

        <span
          className="text-base font-medium tabular-nums md:text-lg"
          style={{ color: "#00306E" }}
        >
          {formatTime(seconds)}
        </span>

        <button
          onClick={finishReading}
          className="rounded-lg px-10 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 md:px-12 md:py-3 md:text-[15px]"
          style={{
            background: "#6666FF",
            boxShadow: "0px 1px 20px rgba(102, 102, 255, 0.4)",
          }}
        >
          Done
        </button>
      </div>
    </div>
  )
}
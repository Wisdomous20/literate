"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Play, Pause, Download, ChevronDown } from "lucide-react"

interface ReadingTimerProps {
  hasPassage: boolean
  onStartReading: () => void
  hasRecording: boolean
  recordedSeconds: number
  recordedAudioURL: string | null
  onTryAgain: () => void
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]

function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoadedMetadata = () => setDuration(audio.duration)
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onEnded = () => setIsPlaying(false)

    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("ended", onEnded)

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("ended", onEnded)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const time = Number(e.target.value)
    audio.currentTime = time
    setCurrentTime(time)
  }

  const handleSpeedChange = (speed: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.playbackRate = speed
    setPlaybackRate(speed)
    setShowSpeedMenu(false)
  }

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = src
    a.download = `oral-reading-test-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const formatAudioTime = (secs: number) => {
    if (!isFinite(secs)) return "00:00"
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div
      className="flex w-full max-w-[562px] items-center gap-2.5 rounded-lg px-3 py-2"
      style={{
        background: "rgba(102, 102, 255, 0.08)",
        border: "1.5px solid #8D8DEC",
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={togglePlay}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:opacity-80"
        style={{ background: "#6666FF" }}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 text-white" />
        ) : (
          <Play className="h-4 w-4 text-white" style={{ marginLeft: "2px" }} />
        )}
      </button>

      <span className="shrink-0 text-xs tabular-nums" style={{ color: "#31318A" }}>
        {formatAudioTime(currentTime)}
      </span>

      <input
        type="range"
        min={0}
        max={duration || 0}
        value={currentTime}
        onChange={handleSeek}
        step={0.1}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full"
        style={{
          background: `linear-gradient(to right, #6666FF ${duration ? (currentTime / duration) * 100 : 0}%, #C4C4FF ${duration ? (currentTime / duration) * 100 : 0}%)`,
          accentColor: "#6666FF",
        }}
      />

      <span className="shrink-0 text-xs tabular-nums" style={{ color: "#31318A" }}>
        {formatAudioTime(duration)}
      </span>

      <div className="relative">
        <button
          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
          className="flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-1 text-xs font-semibold transition-colors hover:opacity-80"
          style={{ background: "#6666FF", color: "#FFFFFF" }}
        >
          {playbackRate}x
          <ChevronDown className="h-3 w-3" />
        </button>

        {showSpeedMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowSpeedMenu(false)} />
            <div
              className="absolute bottom-full right-0 z-20 mb-1 rounded-lg bg-white py-1 shadow-lg"
              style={{ border: "1px solid #8D8DEC" }}
            >
              {SPEED_OPTIONS.map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className="flex w-full items-center px-4 py-1.5 text-xs font-medium transition-colors hover:bg-[#E4F4FF]"
                  style={{
                    color: playbackRate === speed ? "#6666FF" : "#31318A",
                    fontWeight: playbackRate === speed ? 700 : 500,
                  }}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleDownload}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:opacity-80"
        style={{ background: "#6666FF" }}
        title="Download recording"
      >
        <Download className="h-3.5 w-3.5 text-white" />
      </button>
    </div>
  )
}

export function ReadingTimer({
  hasPassage,
  onStartReading,
  hasRecording,
  recordedSeconds,
  recordedAudioURL,
  onTryAgain,
}: ReadingTimerProps) {
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const isDisabled = !hasPassage

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      {/* Audio Playback (after recording is done, with real audio) */}
      {hasRecording && recordedAudioURL && (
        <AudioPlayer src={recordedAudioURL} />
      )}

      {/* Timer Display (HH:MM:SS) */}
      <span
        className="text-lg font-medium tabular-nums"
        style={{ color: "#00306E" }}
      >
        {formatTime(hasRecording ? recordedSeconds : 0)}
      </span>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        {!hasRecording && (
          <button
            onClick={onStartReading}
            disabled={isDisabled}
            className="flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed"
            style={{
              width: "200px",
              height: "42px",
              background: isDisabled
                ? "rgba(102, 102, 255, 0.3)"
                : "#6666FF",
              boxShadow: isDisabled
                ? "none"
                : "0px 1px 20px rgba(102, 102, 255, 0.4)",
              borderRadius: "8px",
              opacity: isDisabled ? 0.6 : 1,
            }}
            title={isDisabled ? "Add a passage first to start reading" : undefined}
          >
            <Mic className="h-4 w-4" />
            Start Reading
          </button>
        )}

        {hasRecording && (
          <button
            onClick={onTryAgain}
            className="text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{
              width: "200px",
              height: "42px",
              background: "#2E2E68",
              border: "1px solid #0C1A6D",
              boxShadow: "0px 1px 20px rgba(65, 155, 180, 0.47)",
              borderRadius: "8px",
            }}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}

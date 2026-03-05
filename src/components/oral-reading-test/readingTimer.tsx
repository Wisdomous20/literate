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
  onStartNew: () => void
  audioRef?: React.RefObject<HTMLAudioElement | null>
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]

function AudioPlayer({ src, externalAudioRef }: { src: string; externalAudioRef?: React.RefObject<HTMLAudioElement | null> }) {
  const internalRef = useRef<HTMLAudioElement>(null)
  const audioRef = externalAudioRef || internalRef
  const rangeRef = useRef<HTMLInputElement>(null)
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
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = rangeRef.current
    if (!el) return
    const progress = duration ? (currentTime / duration) * 100 : 0
    el.style.background = `linear-gradient(to right, #6666FF ${progress}%, #C4C4FF ${progress}%)`
    el.style.accentColor = "#6666FF"
  }, [currentTime, duration])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
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
    <div className="flex w-full items-center gap-2.5 rounded-lg border-[1.5px] border-[#8D8DEC] bg-[rgba(102,102,255,0.08)] px-3 py-2">
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        type="button"
        onClick={togglePlay}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6666FF] transition-colors hover:opacity-80"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 text-white" />
        ) : (
          <Play className="ml-0.5 h-4 w-4 text-white" />
        )}
      </button>

      <span className="shrink-0 text-xs tabular-nums text-[#31318A]">
        {formatAudioTime(currentTime)}
      </span>

      <input
        ref={rangeRef}
        type="range"
        min={0}
        max={duration || 0}
        value={currentTime}
        onChange={handleSeek}
        step={0.1}
        title="Audio progress"
        aria-label="Audio progress"
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full"
      />

      <span className="shrink-0 text-xs tabular-nums text-[#31318A]">
        {formatAudioTime(duration)}
      </span>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
          className="flex shrink-0 items-center gap-0.5 rounded-md bg-[#6666FF] px-1.5 py-1 text-xs font-semibold text-white transition-colors hover:opacity-80"
        >
          {playbackRate}x
          <ChevronDown className="h-3 w-3" />
        </button>

        {showSpeedMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowSpeedMenu(false)} />
            <div className="absolute bottom-full right-0 z-20 mb-1 rounded-lg border border-[#8D8DEC] bg-white py-1 shadow-lg">
              {SPEED_OPTIONS.map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => handleSpeedChange(speed)}
                  className={`flex w-full items-center px-4 py-1.5 text-xs transition-colors hover:bg-[#E4F4FF] ${
                    playbackRate === speed
                      ? "font-bold text-[#6666FF]"
                      : "font-medium text-[#31318A]"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={handleDownload}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#6666FF] transition-colors hover:opacity-80"
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
  onStartNew,
  audioRef,
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
      {hasRecording && recordedAudioURL && (
        <AudioPlayer src={recordedAudioURL} externalAudioRef={audioRef} />
      )}

      <span className="text-lg font-medium tabular-nums text-[#00306E]">
        {formatTime(hasRecording ? recordedSeconds : 0)}
      </span>

      <div className="flex items-center gap-4">
        {!hasRecording && (
          <button
            type="button"
            onClick={onStartReading}
            disabled={isDisabled}
            className={`flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed md:px-8 lg:px-10 ${
              isDisabled
                ? "bg-[rgba(102,102,255,0.3)] opacity-60 shadow-none"
                : "bg-[#6666FF] opacity-100 shadow-[0px_1px_20px_rgba(102,102,255,0.4)]"
            }`}
            title={isDisabled ? "Add a passage first to start reading" : undefined}
          >
            <Mic className="h-4 w-4" />
            Start Reading
          </button>
        )}

        {hasRecording && (
          <>
            <button
              type="button"
              onClick={onTryAgain}
              className="rounded-lg border border-[#0C1A6D] bg-[#2E2E68] px-6 py-2.5 text-sm font-semibold text-white shadow-[0px_1px_20px_rgba(65,155,180,0.47)] transition-colors hover:opacity-90 md:px-8 lg:px-10"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={onStartNew}
              className="rounded-lg border border-[#6666FF] bg-transparent px-6 py-2.5 text-sm font-semibold text-[#6666FF] transition-all duration-200 hover:bg-[#6666FF] hover:text-white md:px-8 lg:px-10"
            >
              Start New
            </button>
          </>
        )}
      </div>
    </div>
  )
}
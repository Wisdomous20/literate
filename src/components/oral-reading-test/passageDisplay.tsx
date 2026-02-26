"use client"

import { useState, useMemo } from "react"
import { Maximize2, Minimize2 } from "lucide-react"
import type { MiscueResult } from "@/types/oral-reading"

const MISCUE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  MISPRONUNCIATION: { bg: "rgba(253, 182, 210, 0.44)", text: "#C41048", border: "#C41048" },
  OMISSION: { bg: "rgba(180, 170, 240, 0.4)", text: "#4B3BA3", border: "#4B3BA3" },
  SUBSTITUTION: { bg: "rgba(160, 200, 255, 0.4)", text: "#1A5FB4", border: "#1A5FB4" },
  TRANSPOSITION: { bg: "rgba(220, 120, 220, 0.4)", text: "#8B008B", border: "#8B008B" },
  REVERSAL: { bg: "rgba(200, 165, 130, 0.35)", text: "#6E4023", border: "#6E4023" },
  INSERTION: { bg: "rgba(140, 220, 160, 0.4)", text: "#1E7A35", border: "#1E7A35" },
  REPETITION: { bg: "rgba(255, 200, 140, 0.45)", text: "#B85C00", border: "#B85C00" },
  SELF_CORRECTION: { bg: "rgba(250, 230, 140, 0.45)", text: "#8A6D00", border: "#8A6D00" },
}

interface PassageDisplayProps {
  content: string
  miscues?: MiscueResult[]
}

export function PassageDisplay({ content, miscues }: PassageDisplayProps) {
  const [expanded, setExpanded] = useState(false)

  // Build a map from wordIndex → miscue type for O(1) lookup
  const miscueMap = useMemo(() => {
    if (!miscues || miscues.length === 0) return null
    const map = new Map<number, MiscueResult>()
    for (const m of miscues) {
      if (!map.has(m.wordIndex)) {
        map.set(m.wordIndex, m)
      }
    }
    return map
  }, [miscues])

  const hasMiscues = miscueMap !== null && miscueMap.size > 0

  // Split content into words while preserving whitespace
  const words = useMemo(() => {
    if (!content) return []
    return content.split(/(\s+)/).filter(Boolean)
  }, [content])

  // Track the word index (non-whitespace tokens only)
  const renderHighlightedContent = () => {
    let wordIndex = 0
    return words.map((token, i) => {
      const isSpace = /^\s+$/.test(token)
      if (isSpace) {
        return <span key={i}>{token}</span>
      }
      const currentWordIndex = wordIndex
      wordIndex++

      const miscue = miscueMap?.get(currentWordIndex)
      if (miscue) {
        const colors = MISCUE_COLORS[miscue.miscueType]
        return (
          <span
            key={i}
            title={`${miscue.miscueType.replace(/_/g, " ")}${miscue.spokenWord ? ` — spoken: "${miscue.spokenWord}"` : ""}`}
            className="relative inline-block cursor-help rounded-sm px-[2px] transition-all"
            style={{
              backgroundColor: colors?.bg,
              color: colors?.text,
              borderBottom: `2px solid ${colors?.border}`,
              fontWeight: 600,
            }}
          >
            {token}
          </span>
        )
      }
      return <span key={i}>{token}</span>
    })
  }

  return (
    <div
      className="relative flex flex-col"
      style={{ height: expanded ? "clamp(300px, 60vh, 600px)" : "100%" }}
    >
      <div
        className="flex-1 overflow-auto p-4 md:p-5"
        style={{
          background: "#EFFDFF",
          border: "1px solid #54A4FF",
          boxShadow: "0px 1px 20px rgba(108, 164, 239, 0.37)",
          borderRadius: "10px",
        }}
      >
        {/* Expand / Collapse button */}
        {content && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:opacity-80"
            style={{ background: "rgba(84, 164, 255, 0.15)" }}
            title={expanded ? "Collapse passage" : "Expand passage"}
          >
            {expanded ? (
              <Minimize2 className="h-3.5 w-3.5" style={{ color: "#1A5FB4" }} />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" style={{ color: "#1A5FB4" }} />
            )}
          </button>
        )}

        {content ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#00306E] lg:text-base lg:leading-relaxed">
            {hasMiscues ? renderHighlightedContent() : content}
          </p>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm text-[#00306E]/40">
              Click Add Passage button and select reading passages to start oral reading test
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

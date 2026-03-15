"use client";

import { useState, useMemo, useEffect, useRef, useCallback, Fragment, type CSSProperties } from "react";
import { Maximize2, Minimize2, Play, GripHorizontal, ChevronDown } from "lucide-react";
import type { MiscueResult, AlignedWord } from "@/types/oral-reading";
import { normalizeWord } from "@/utils/textUtils";

type MiscueColor = {
  bg: string;
  text: string;
  border: string;
  bgClass: string;
  textClass: string;
  borderBottomClass: string;
  popupBorderClass: string;
  arrowTopClass: string;
  arrowBottomClass: string;
};

const MISCUE_COLORS: Record<string, MiscueColor> = {
  MISPRONUNCIATION: {
    bg: "rgba(253, 182, 210, 0.44)",
    text: "#C41048",
    border: "#C41048",
    bgClass: "bg-[rgba(253,182,210,0.44)]",
    textClass: "text-[#C41048]",
    borderBottomClass: "border-b-2 border-b-[#C41048]",
    popupBorderClass: "border-[#C41048]",
    arrowTopClass: "border-t-[#C41048]",
    arrowBottomClass: "border-b-[#C41048]",
  },
  OMISSION: {
    bg: "rgba(180, 170, 240, 0.4)",
    text: "#4B3BA3",
    border: "#4B3BA3",
    bgClass: "bg-[rgba(180,170,240,0.4)]",
    textClass: "text-[#4B3BA3]",
    borderBottomClass: "border-b-2 border-b-[#4B3BA3]",
    popupBorderClass: "border-[#4B3BA3]",
    arrowTopClass: "border-t-[#4B3BA3]",
    arrowBottomClass: "border-b-[#4B3BA3]",
  },
  SUBSTITUTION: {
    bg: "rgba(160, 200, 255, 0.4)",
    text: "#1A5FB4",
    border: "#1A5FB4",
    bgClass: "bg-[rgba(160,200,255,0.4)]",
    textClass: "text-[#1A5FB4]",
    borderBottomClass: "border-b-2 border-b-[#1A5FB4]",
    popupBorderClass: "border-[#1A5FB4]",
    arrowTopClass: "border-t-[#1A5FB4]",
    arrowBottomClass: "border-b-[#1A5FB4]",
  },
  TRANSPOSITION: {
    bg: "rgba(220, 120, 220, 0.4)",
    text: "#8B008B",
    border: "#8B008B",
    bgClass: "bg-[rgba(220,120,220,0.4)]",
    textClass: "text-[#8B008B]",
    borderBottomClass: "border-b-2 border-b-[#8B008B]",
    popupBorderClass: "border-[#8B008B]",
    arrowTopClass: "border-t-[#8B008B]",
    arrowBottomClass: "border-b-[#8B008B]",
  },
  REVERSAL: {
    bg: "rgba(200, 165, 130, 0.35)",
    text: "#6E4023",
    border: "#6E4023",
    bgClass: "bg-[rgba(200,165,130,0.35)]",
    textClass: "text-[#6E4023]",
    borderBottomClass: "border-b-2 border-b-[#6E4023]",
    popupBorderClass: "border-[#6E4023]",
    arrowTopClass: "border-t-[#6E4023]",
    arrowBottomClass: "border-b-[#6E4023]",
  },
  INSERTION: {
    bg: "rgba(140, 220, 160, 0.4)",
    text: "#1E7A35",
    border: "#1E7A35",
    bgClass: "bg-[rgba(140,220,160,0.4)]",
    textClass: "text-[#1E7A35]",
    borderBottomClass: "border-b-2 border-b-[#1E7A35]",
    popupBorderClass: "border-[#1E7A35]",
    arrowTopClass: "border-t-[#1E7A35]",
    arrowBottomClass: "border-b-[#1E7A35]",
  },
  REPETITION: {
    bg: "rgba(255, 200, 140, 0.45)",
    text: "#B85C00",
    border: "#B85C00",
    bgClass: "bg-[rgba(255,200,140,0.45)]",
    textClass: "text-[#B85C00]",
    borderBottomClass: "border-b-2 border-b-[#B85C00]",
    popupBorderClass: "border-[#B85C00]",
    arrowTopClass: "border-t-[#B85C00]",
    arrowBottomClass: "border-b-[#B85C00]",
  },
  SELF_CORRECTION: {
    bg: "rgba(250, 230, 140, 0.45)",
    text: "#8A6D00",
    border: "#8A6D00",
    bgClass: "bg-[rgba(250,230,140,0.45)]",
    textClass: "text-[#8A6D00]",
    borderBottomClass: "border-b-2 border-b-[#8A6D00]",
    popupBorderClass: "border-[#8A6D00]",
    arrowTopClass: "border-t-[#8A6D00]",
    arrowBottomClass: "border-b-[#8A6D00]",
  },
};

const FALLBACK_COLOR: MiscueColor = {
  bg: "rgba(218, 230, 255, 0.4)",
  text: "#31318A",
  border: "#DAE6FF",
  bgClass: "bg-[rgba(218,230,255,0.4)]",
  textClass: "text-[#31318A]",
  borderBottomClass: "border-b-2 border-b-[#DAE6FF]",
  popupBorderClass: "border-[#DAE6FF]",
  arrowTopClass: "border-t-[#DAE6FF]",
  arrowBottomClass: "border-b-[#DAE6FF]",
};

interface InlineInsertion {
  spokenWord: string;
  miscue: MiscueResult;
}

interface PassageDisplayProps {
  content: string;
  miscues?: MiscueResult[];
  alignedWords?: AlignedWord[];
  onJumpToTime?: (timestamp: number) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
  passageLevel?: string;
  resizable?: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  passageTitle?: string;
  initialHeight?: number;
}

export function getPassageTextStyle(passageLevel?: string): CSSProperties {
  if (!passageLevel) return {};
  const num = parseInt(passageLevel.replace(/\D/g, ""), 10);
  let fontSize: number;
  if (isNaN(num) || num === 0) {
    // Kindergarten
    fontSize = 30;
  } else if (num <= 3) {
    // Grade 1–3
    fontSize = 26;
  } else if (num <= 6) {
    // Grade 4–6
    fontSize = 24;
  } else {
    // Grade 7 and up
    fontSize = 22;
  }
  return { fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", fontSize };
}

interface PopupState {
  miscue: MiscueResult;
  x: number;
  y: number;
  flipped: boolean;
  hAlign: "center" | "left" | "right";
}

export function PassageDisplay({
  content,
  miscues,
  alignedWords,
  onJumpToTime,
  expanded,
  onToggleExpand,
  passageLevel,
  resizable = true,
  collapsible = false,
  collapsed = false,
  onToggleCollapsed,
  passageTitle,
  initialHeight,
}: PassageDisplayProps) {
  const passageTextStyle = getPassageTextStyle(passageLevel);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);

  // Drag-to-resize state
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartH.current =
      outerRef.current?.getBoundingClientRect().height ?? 300;

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = Math.max(0, ev.clientY - dragStartY.current);
      setDragHeight(Math.max(120, dragStartH.current + delta));
    };
    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  // Keep dynamic height without using JSX inline styles
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    if (expanded) {
      outer.style.height = "100%";
      return;
    }
    outer.style.height = dragHeight ? `${dragHeight}px` : "100%";
  }, [dragHeight, expanded]);

  // Position popup without JSX inline styles
  useEffect(() => {
    const el = popupRef.current;
    if (!el || !popup) return;
    const hTranslate =
      popup.hAlign === "left"
        ? "0%"
        : popup.hAlign === "right"
          ? "-100%"
          : "-50%";
    const vTranslate = popup.flipped ? "0%" : "-100%";
    el.style.left = `${popup.x}px`;
    el.style.top = `${popup.y}px`;
    el.style.transform = `translate(${hTranslate}, ${vTranslate})`;
  }, [popup]);

  // Close popup when clicking outside
  useEffect(() => {
    if (!popup) return;
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopup(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popup]);

  // Auto-scroll container so the popup is fully visible
  useEffect(() => {
    if (!popup) return;
    const raf = requestAnimationFrame(() => {
      const popupEl = popupRef.current;
      const container = containerRef.current;
      if (!popupEl || !container) return;
      const popupRect = popupEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (popupRect.top < containerRect.top) {
        container.scrollBy({
          top: popupRect.top - containerRect.top - 16,
          behavior: "smooth",
        });
      }
      if (popupRect.bottom > containerRect.bottom) {
        container.scrollBy({
          top: popupRect.bottom - containerRect.bottom + 16,
          behavior: "smooth",
        });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [popup]);

  // Map passage word index → inline inserted words (REPETITION and INSERTION miscues)
  const inlineInsertions = useMemo(() => {
    if (!miscues || !alignedWords?.length) return null;

    // Collect miscues that are "inserted" words (not in the passage)
    const insertedMiscues = miscues.filter(
      (m) =>
        (m.miscueType === "INSERTION" || (m.miscueType === "REPETITION" && !m.expectedWord)) &&
        m.spokenWord,
    );
    if (insertedMiscues.length === 0) return null;

    // Lookup by spokenIndex (= wordIndex for insertion-type miscues)
    const bySpokenIdx = new Map<number, MiscueResult>();
    for (const m of insertedMiscues) bySpokenIdx.set(m.wordIndex, m);

    const map = new Map<number, InlineInsertion[]>();
    let lastExpectedIndex = -1;

    for (let idx = 0; idx < alignedWords.length; idx++) {
      const aw = alignedWords[idx];
      if (aw.expectedIndex != null) lastExpectedIndex = aw.expectedIndex;

      if (aw.match === "INSERTION" && aw.spokenIndex != null) {
        const miscue = bySpokenIdx.get(aw.spokenIndex);
        if (miscue && lastExpectedIndex >= 0) {
          let placement = lastExpectedIndex;

          // For repetitions that precede the word they repeat (INSERTION → EXACT),
          // place the inline insertion after the matching passage word instead
          if (miscue.miscueType === "REPETITION" && miscue.spokenWord) {
            const spokenNorm = normalizeWord(miscue.spokenWord);
            for (let k = idx + 1; k < alignedWords.length && k <= idx + 3; k++) {
              const next = alignedWords[k];
              if (next.expectedIndex != null && next.expected) {
                if (normalizeWord(next.expected) === spokenNorm) {
                  placement = next.expectedIndex;
                }
                break;
              }
            }
          }

          const list = map.get(placement) || [];
          list.push({ spokenWord: miscue.spokenWord!, miscue });
          map.set(placement, list);
          bySpokenIdx.delete(aw.spokenIndex);
        }
      }
    }

    return map.size > 0 ? map : null;
  }, [miscues, alignedWords]);

  // Build a map from wordIndex → miscue type for O(1) lookup
  const miscueMap = useMemo(() => {
    if (!miscues || miscues.length === 0) return null;
    const map = new Map<number, MiscueResult>();
    for (const m of miscues) {
      // Skip insertion-type miscues — they are rendered as inline inserts
      if (m.miscueType === "INSERTION") continue;
      if (m.miscueType === "REPETITION" && !m.expectedWord) continue;
      if (!map.has(m.wordIndex)) {
        map.set(m.wordIndex, m);
      }
    }
    return map;
  }, [miscues]);

  const hasMiscues =
    (miscueMap !== null && miscueMap.size > 0) ||
    (inlineInsertions !== null && inlineInsertions.size > 0);

  const words = useMemo(() => {
    if (!content) return [];
    return content.split(/(\s+)/).filter(Boolean);
  }, [content]);

  const openPopup = useCallback(
    (e: React.MouseEvent, miscue: MiscueResult) => {
      if (miscue.timestamp == null || !onJumpToTime) return;
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const xPos =
        rect.left -
        containerRect.left +
        rect.width / 2 +
        container.scrollLeft;
      const yAbove =
        rect.top - containerRect.top + container.scrollTop - 4;
      const yBelow =
        rect.bottom - containerRect.top + container.scrollTop + 4;
      const spaceAbove = rect.top - containerRect.top;
      const flip = spaceAbove < 95;

      const popupHalfWidth = 90;
      const spaceLeft = rect.left - containerRect.left + rect.width / 2;
      const spaceRight =
        containerRect.right - rect.left - rect.width / 2;
      let hAlign: "center" | "left" | "right" = "center";
      if (spaceLeft < popupHalfWidth) {
        hAlign = "left";
      } else if (spaceRight < popupHalfWidth) {
        hAlign = "right";
      }

      setPopup({
        miscue,
        x: xPos,
        y: flip ? yBelow : yAbove,
        flipped: flip,
        hAlign,
      });
    },
    [onJumpToTime],
  );

  const renderHighlightedContent = () => {
    let wordIndex = 0;
    return words.map((token, i) => {
      const isSpace = /^\s+$/.test(token);
      if (isSpace) {
        return <span key={i}>{token}</span>;
      }
      const currentWordIndex = wordIndex;
      wordIndex++;

      const miscue = miscueMap?.get(currentWordIndex);
      const insertions = inlineInsertions?.get(currentWordIndex);

      // Build the word element (highlighted or plain)
      let wordEl: React.ReactNode;
      if (miscue) {
        const colors = MISCUE_COLORS[miscue.miscueType] || FALLBACK_COLOR;
        const hasTimestamp =
          miscue.timestamp !== null && miscue.timestamp !== undefined;
        wordEl = (
          <span
            key={`w-${i}`}
            title={`${miscue.miscueType.replace(/_/g, " ")}${miscue.spokenWord ? ` — spoken: "${miscue.spokenWord}"` : ""}${hasTimestamp ? " (click to jump)" : ""}`}
            className={`relative inline-block rounded-sm px-0.5 font-semibold transition-all ${colors.bgClass} ${colors.textClass} ${colors.borderBottomClass} ${
              hasTimestamp && onJumpToTime
                ? "cursor-pointer hover:brightness-90"
                : "cursor-help"
            }`}
            onClick={(e) => openPopup(e, miscue)}
          >
            {token}
          </span>
        );
      } else {
        wordEl = <span key={`w-${i}`}>{token}</span>;
      }

      // If no inline insertions follow, return just the word
      if (!insertions || insertions.length === 0) return wordEl;

      // Render word + inline inserted/repeated words
      return (
        <Fragment key={i}>
          {wordEl}
          {insertions.map((ins, j) => {
            const hasTs = ins.miscue.timestamp != null;
            const isRepetition = ins.miscue.miscueType === "REPETITION";
            const colors = MISCUE_COLORS[ins.miscue.miscueType] || FALLBACK_COLOR;
            const label = isRepetition
              ? `REPETITION — repeated: "${ins.spokenWord}"`
              : `INSERTION — inserted: "${ins.spokenWord}"`;
            return (
              <span key={`ins-${i}-${j}`}>
                {" "}
                <span
                  title={`${label}${hasTs ? " (click to jump)" : ""}`}
                  className={`relative inline-block rounded-sm px-0.5 font-semibold italic transition-all ${colors.bgClass} ${colors.textClass} border-b-2 border-dashed ${colors.borderBottomClass.replace("border-b-2 ", "")} ${
                    hasTs && onJumpToTime
                      ? "cursor-pointer hover:brightness-90"
                      : "cursor-help"
                  }`}
                  onClick={(e) => openPopup(e, ins.miscue)}
                >
                  {ins.spokenWord}
                </span>
              </span>
            );
          })}
        </Fragment>
      );
    });
  };

  const formatTimestamp = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Reset drag height when toggling expand
  useEffect(() => {
    if (expanded) setDragHeight(null);
  }, [expanded]);

  // When uncollapsing, restore to the initial height (captured before quiz mode)
  useEffect(() => {
    if (collapsible && !collapsed) {
      setDragHeight(initialHeight ?? null);
    }
  }, [collapsed, collapsible, initialHeight]);

  // When collapsible and collapsed, render the container itself as a clickable bar
  if (collapsible && collapsed) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleCollapsed}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onToggleCollapsed?.(); }}
        className="flex w-full cursor-pointer items-center justify-center rounded-[10px] border border-[#54A4FF] bg-[#EFFDFF] py-2 shadow-[0px_1px_20px_rgba(108,164,239,0.37)] transition-colors hover:bg-[#DDE8FF]"
      >
        <ChevronDown className="h-5 w-5 rotate-0 text-[#1A5FB4]" />
      </div>
    );
  }

  return (
    <div
      ref={outerRef}
      className={`relative flex min-h-30 flex-col ${dragHeight && !expanded ? "flex-none" : "flex-1"}`}
    >
      {/* Collapsible header inside the passage — clicking collapses back */}
      {collapsible && !expanded && onToggleCollapsed && passageTitle && (
        <div
          role="button"
          tabIndex={0}
          onClick={onToggleCollapsed}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onToggleCollapsed?.(); }}
          className="flex w-full cursor-pointer items-center justify-center rounded-t-[10px] border border-b-0 border-[#54A4FF] bg-[#EFFDFF] py-2 transition-colors hover:bg-[#DDE8FF]"
        >
          <ChevronDown className="h-5 w-5 rotate-180 text-[#1A5FB4]" />
        </div>
      )}

      {content && onToggleExpand && (
        <button
          type="button"
          onClick={onToggleExpand}
          className={`absolute right-4 z-20 flex h-7 w-7 items-center justify-center rounded-md bg-[rgba(84,164,255,0.15)] transition-colors hover:opacity-80 md:right-5 ${collapsible && !collapsed ? "top-12 md:top-13" : "top-4 md:top-5"}`}
          title={expanded ? "Collapse passage" : "Expand passage"}
        >
          {expanded ? (
            <Minimize2 className="h-3.5 w-3.5 text-[#1A5FB4]" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5 text-[#1A5FB4]" />
          )}
        </button>
      )}

      <div
        ref={containerRef}
        className={`oral-reading-scroll relative flex-1 overflow-auto rounded-[10px] border border-[#54A4FF] bg-[#EFFDFF] p-4 shadow-[0px_1px_20px_rgba(108,164,239,0.37)] md:p-5 ${collapsible && !collapsed && !expanded ? "rounded-t-none border-t-0" : ""}`}
      >
        {content ? (
          <p className="whitespace-pre-wrap text-center leading-relaxed text-[#00306E]" style={passageLevel ? passageTextStyle : undefined}>
            {hasMiscues ? renderHighlightedContent() : content}
          </p>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm text-[#00306E]/40">
              Click Add Passage button and select reading passages to start oral
              reading test
            </p>
          </div>
        )}

        {popup &&
          popup.miscue.timestamp !== null &&
          (() => {
            const colors =
              MISCUE_COLORS[popup.miscue.miscueType] || FALLBACK_COLOR;
            const arrowAlign =
              popup.hAlign === "left"
                ? "ml-4"
                : popup.hAlign === "right"
                  ? "mr-4 self-end"
                  : "self-center";

            return (
              <div
                ref={popupRef}
                className={`absolute z-30 flex ${popup.flipped ? "flex-col-reverse" : "flex-col"}`}
              >
                {popup.flipped && (
                  <div
                    className={`h-0 w-0 border-l-[6px] border-r-[6px] border-l-transparent border-r-transparent ${arrowAlign} ${colors.arrowBottomClass} border-b-[6px]`}
                  />
                )}

                <div
                  className={`rounded-lg border bg-white px-3 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.12)] ${colors.popupBorderClass}`}
                >
                  <div className="mb-1.5 text-center">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide ${colors.textClass}`}
                    >
                      {popup.miscue.miscueType.replace(/_/g, " ")}
                    </span>
                    {popup.miscue.spokenWord && (
                      <div className="text-[10px] text-[#31318A]/70">
                        Spoken: &ldquo;{popup.miscue.spokenWord}&rdquo;
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onJumpToTime?.(popup.miscue.timestamp!);
                      setPopup(null);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#6666FF] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:brightness-110"
                  >
                    <Play className="h-3 w-3" />
                    Jump to Word ({formatTimestamp(popup.miscue.timestamp!)})
                  </button>
                </div>

                {!popup.flipped && (
                  <div
                    className={`h-0 w-0 border-l-[6px] border-r-[6px] border-l-transparent border-r-transparent ${arrowAlign} ${colors.arrowTopClass} border-t-[6px]`}
                  />
                )}
              </div>
            );
          })()}
      </div>

      {!expanded && resizable && (
        <div
          onMouseDown={handleDragStart}
          className="flex h-4 cursor-row-resize items-center justify-center opacity-40 transition-opacity hover:opacity-80"
          title="Drag to resize"
        >
          <GripHorizontal className="h-4 w-4 text-[#54A4FF]" />
        </div>
      )}
    </div>
  );
}

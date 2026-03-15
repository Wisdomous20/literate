"use client";

import { useState, useMemo, useRef, useEffect, useCallback, Fragment } from "react";
import { X, Play } from "lucide-react";
import type { MiscueResult, AlignedWord } from "@/types/oral-reading";
import { getPassageTextStyle } from "@/components/oral-reading-test/passageDisplay";
import { normalizeWord } from "@/utils/textUtils";

const MISCUE_CONFIG = [
  {
    key: "MISPRONUNCIATION",
    label: "Mispronunciation",
    colorClass: "bg-[rgba(253,182,210,0.44)]",
    activeClass: "bg-[rgba(253,182,210,0.18)]",
    textClass: "text-[#C41048]",
    bgStyle: "rgba(253, 182, 210, 0.44)",
    borderBottomClass: "border-b-2 border-b-[#C41048]",
    popupBorderClass: "border-[#C41048]",
    arrowTopClass: "border-t-[#C41048]",
    arrowBottomClass: "border-b-[#C41048]",
  },
  {
    key: "OMISSION",
    label: "Omission",
    colorClass: "bg-[rgba(180,170,240,0.4)]",
    activeClass: "bg-[rgba(180,170,240,0.18)]",
    textClass: "text-[#4B3BA3]",
    bgStyle: "rgba(180, 170, 240, 0.4)",
    borderBottomClass: "border-b-2 border-b-[#4B3BA3]",
    popupBorderClass: "border-[#4B3BA3]",
    arrowTopClass: "border-t-[#4B3BA3]",
    arrowBottomClass: "border-b-[#4B3BA3]",
  },
  {
    key: "SUBSTITUTION",
    label: "Substitution",
    colorClass: "bg-[rgba(160,200,255,0.4)]",
    activeClass: "bg-[rgba(160,200,255,0.18)]",
    textClass: "text-[#1A5FB4]",
    bgStyle: "rgba(160, 200, 255, 0.4)",
    borderBottomClass: "border-b-2 border-b-[#1A5FB4]",
    popupBorderClass: "border-[#1A5FB4]",
    arrowTopClass: "border-t-[#1A5FB4]",
    arrowBottomClass: "border-b-[#1A5FB4]",
  },
  {
    key: "TRANSPOSITION",
    label: "Transposition",
    colorClass: "bg-[rgba(220,120,220,0.4)]",
    activeClass: "bg-[rgba(220,120,220,0.18)]",
    textClass: "text-[#8B008B]",
    bgStyle: "rgba(220, 120, 220, 0.4)",
    borderBottomClass: "border-b-2 border-b-[#8B008B]",
    popupBorderClass: "border-[#8B008B]",
    arrowTopClass: "border-t-[#8B008B]",
    arrowBottomClass: "border-b-[#8B008B]",
  },
  {
    key: "REVERSAL",
    label: "Reversal",
    colorClass: "bg-[rgba(200,165,130,0.35)]",
    activeClass: "bg-[rgba(200,165,130,0.18)]",
    textClass: "text-[#6E4023]",
    bgStyle: "rgba(200, 165, 130, 0.35)",
    borderBottomClass: "border-b-2 border-b-[#6E4023]",
    popupBorderClass: "border-[#6E4023]",
    arrowTopClass: "border-t-[#6E4023]",
    arrowBottomClass: "border-b-[#6E4023]",
  },
  {
    key: "INSERTION",
    label: "Insertion",
    colorClass: "bg-[rgba(140,220,160,0.4)]",
    activeClass: "bg-[rgba(140,220,160,0.18)]",
    textClass: "text-[#1E7A35]",
    bgStyle: "rgba(140, 220, 160, 0.4)",
    borderBottomClass: "border-b-2 border-b-[#1E7A35]",
    popupBorderClass: "border-[#1E7A35]",
    arrowTopClass: "border-t-[#1E7A35]",
    arrowBottomClass: "border-b-[#1E7A35]",
  },
  {
    key: "REPETITION",
    label: "Repetition",
    colorClass: "bg-[rgba(255,200,140,0.45)]",
    activeClass: "bg-[rgba(255,200,140,0.18)]",
    textClass: "text-[#B85C00]",
    bgStyle: "rgba(255, 200, 140, 0.45)",
    borderBottomClass: "border-b-2 border-b-[#B85C00]",
    popupBorderClass: "border-[#B85C00]",
    arrowTopClass: "border-t-[#B85C00]",
    arrowBottomClass: "border-b-[#B85C00]",
  },
  {
    key: "SELF_CORRECTION",
    label: "Self-Correction",
    colorClass: "bg-[rgba(250,230,140,0.45)]",
    activeClass: "bg-[rgba(250,230,140,0.18)]",
    textClass: "text-[#8A6D00]",
    bgStyle: "rgba(250, 230, 140, 0.45)",
    borderBottomClass: "border-b-2 border-b-[#8A6D00]",
    popupBorderClass: "border-[#8A6D00]",
    arrowTopClass: "border-t-[#8A6D00]",
    arrowBottomClass: "border-b-[#8A6D00]",
  },
] as const;

interface PopupState {
  miscue: MiscueResult;
  x: number;
  y: number;
  flipped: boolean;
  hAlign: "center" | "left" | "right";
}

interface ViewMiscuesModalProps {
  open: boolean;
  onClose: () => void;
  passageContent: string;
  miscues: MiscueResult[];
  alignedWords?: AlignedWord[];
  passageLevel?: string;
}

export default function ViewMiscuesModal({
  open,
  onClose,
  passageContent,
  miscues,
  alignedWords,
  passageLevel,
}: ViewMiscuesModalProps) {
  const [highlightedTypes, setHighlightedTypes] = useState<Set<string>>(
    new Set(),
  );
  const [showMiscues, setShowMiscues] = useState(true);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleHighlightType = useCallback((miscueType: string) => {
    setHighlightedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(miscueType)) {
        next.delete(miscueType);
      } else {
        next.add(miscueType);
      }
      return next;
    });
  }, []);

  const filteredMiscues = useMemo(() => {
    if (highlightedTypes.size === 0) return miscues;
    return miscues.filter((m) => highlightedTypes.has(m.miscueType));
  }, [miscues, highlightedTypes]);

  const miscueCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of miscues) {
      counts[m.miscueType] = (counts[m.miscueType] || 0) + 1;
    }
    return counts;
  }, [miscues]);

  // Map passage word index → inline inserted words (REPETITION and INSERTION miscues)
  const inlineInsertions = useMemo(() => {
    if (!filteredMiscues?.length || !alignedWords?.length) return null;

    const insertedMiscues = filteredMiscues.filter(
      (m) =>
        (m.miscueType === "INSERTION" || (m.miscueType === "REPETITION" && !m.expectedWord)) &&
        m.spokenWord,
    );
    if (insertedMiscues.length === 0) return null;

    const bySpokenIdx = new Map<number, MiscueResult>();
    for (const m of insertedMiscues) bySpokenIdx.set(m.wordIndex, m);

    const map = new Map<number, { spokenWord: string; miscue: MiscueResult }[]>();
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
  }, [filteredMiscues, alignedWords]);

  const miscueMap = useMemo(() => {
    if (!filteredMiscues || filteredMiscues.length === 0) return null;
    const map = new Map<number, MiscueResult>();
    for (const m of filteredMiscues) {
      if (m.miscueType === "INSERTION") continue;
      if (m.miscueType === "REPETITION" && !m.expectedWord) continue;
      if (!map.has(m.wordIndex)) {
        map.set(m.wordIndex, m);
      }
    }
    return map;
  }, [filteredMiscues]);

  const hasMiscues =
    (miscueMap !== null && miscueMap.size > 0) ||
    (inlineInsertions !== null && inlineInsertions.size > 0);

  const words = useMemo(() => {
    if (!passageContent) return [];
    return passageContent.split(/(\s+)/).filter(Boolean);
  }, [passageContent]);

  const passageTextStyle = getPassageTextStyle(passageLevel);

  // Close popup on outside click
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

  // Position popup
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

  // Auto-scroll container so popup is visible
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

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setHighlightedTypes(new Set());
      setShowMiscues(true);
      setPopup(null);
    }
  }, [open]);

  if (!open) return null;

  const getMiscueConfig = (miscueType: string) =>
    MISCUE_CONFIG.find((c) => c.key === miscueType) ?? MISCUE_CONFIG[0];

  const formatTimestamp = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

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

      let wordEl: React.ReactNode;
      if (miscue) {
        const cfg = getMiscueConfig(miscue.miscueType);
        const hasTimestamp =
          miscue.timestamp !== null && miscue.timestamp !== undefined;
        wordEl = (
          <span
            key={`w-${i}`}
            title={`${miscue.miscueType.replace(/_/g, " ")}${miscue.spokenWord ? ` — spoken: "${miscue.spokenWord}"` : ""}${hasTimestamp ? " (click for details)" : ""}`}
            className={`relative inline-block rounded-sm px-0.5 font-semibold transition-all ${cfg.colorClass} ${cfg.textClass} ${cfg.borderBottomClass} cursor-pointer hover:brightness-90`}
            onClick={(e) => {
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
              const spaceLeft =
                rect.left - containerRect.left + rect.width / 2;
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
            }}
          >
            {token}
          </span>
        );
      } else {
        wordEl = <span key={`w-${i}`}>{token}</span>;
      }

      if (!insertions || insertions.length === 0) return wordEl;

      return (
        <Fragment key={i}>
          {wordEl}
          {insertions.map((ins, j) => {
            const hasTs = ins.miscue.timestamp != null;
            const isRepetition = ins.miscue.miscueType === "REPETITION";
            const insCfg = getMiscueConfig(ins.miscue.miscueType);
            const label = isRepetition
              ? `REPETITION — repeated: "${ins.spokenWord}"`
              : `INSERTION — inserted: "${ins.spokenWord}"`;
            return (
              <span key={`ins-${i}-${j}`}>
                {" "}
                <span
                  title={`${label}${hasTs ? " (click for details)" : ""}`}
                  className={`relative inline-block rounded-sm px-0.5 font-semibold italic transition-all ${insCfg.colorClass} ${insCfg.textClass} border-b-2 border-dashed ${insCfg.borderBottomClass.replace("border-b-2 ", "")} cursor-pointer hover:brightness-90`}
                  onClick={(e) => {
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
                    const spaceLeft =
                      rect.left - containerRect.left + rect.width / 2;
                    const spaceRight =
                      containerRect.right - rect.left - rect.width / 2;
                    let hAlign: "center" | "left" | "right" = "center";
                    if (spaceLeft < popupHalfWidth) {
                      hAlign = "left";
                    } else if (spaceRight < popupHalfWidth) {
                      hAlign = "right";
                    }

                    setPopup({
                      miscue: ins.miscue,
                      x: xPos,
                      y: flip ? yBelow : yAbove,
                      flipped: flip,
                      hAlign,
                    });
                  }}
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

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* Backdrop — clicking closes the modal */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative z-50 mx-auto flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-[#54A4FF] bg-white shadow-[0_4px_40px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DAE6FF] px-6 py-4">
          <h2 className="text-lg font-bold text-[#00306E]">
            View Miscues
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#F0F0F0]"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-[#00306E]" />
          </button>
        </div>

        {/* Miscue type filter bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#DAE6FF] px-6 py-3">
          {MISCUE_CONFIG.map((item) => {
            const isActive = highlightedTypes.has(item.key);
            const count = miscueCounts[item.key] || 0;
            return (
              <button
                key={item.key}
                type="button"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors border ${
                  isActive
                    ? `${item.colorClass} ${item.textClass} border-current`
                    : "border-[#DAE6FF] bg-white text-[#31318A]/60 hover:bg-[#F4F8FF]"
                }`}
                onClick={() => toggleHighlightType(item.key)}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${item.colorClass} ${item.textClass}`}
                >
                  {count}
                </span>
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Passage content with highlighted words */}
        <div
          ref={containerRef}
          className="oral-reading-scroll relative flex-1 overflow-auto px-6 py-5"
        >
          <div className="rounded-xl border border-[#54A4FF] bg-[#EFFDFF] p-5 shadow-[0px_1px_20px_rgba(108,164,239,0.37)]">
            <p
              className="whitespace-pre-wrap text-center leading-relaxed text-[#00306E]"
              style={passageLevel ? passageTextStyle : undefined}
            >
              {hasMiscues && showMiscues ? renderHighlightedContent() : passageContent}
            </p>
          </div>
          {/* Original / Miscues toggle — bottom right */}
          <div className="mt-2 flex justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#31318A]">
                {showMiscues ? "Miscues" : "Original"}
              </span>
              <button
                type="button"
                onClick={() => setShowMiscues((prev) => !prev)}
                aria-label={showMiscues ? "Show original passage" : "Show miscue highlights"}
                title={showMiscues ? "Show original passage" : "Show miscue highlights"}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  showMiscues ? "bg-[#6666FF]" : "bg-[#C4C4FF]"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                    showMiscues ? "translate-x-4.25" : "translate-x-0.75"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Word detail popup */}
          {popup &&
            (() => {
              const cfg = getMiscueConfig(popup.miscue.miscueType);
              const arrowAlign =
                popup.hAlign === "left"
                  ? "ml-4"
                  : popup.hAlign === "right"
                    ? "mr-4 self-end"
                    : "self-center";
              const hasTimestamp =
                popup.miscue.timestamp !== null &&
                popup.miscue.timestamp !== undefined;

              return (
                <div
                  ref={popupRef}
                  className={`absolute z-30 flex ${popup.flipped ? "flex-col-reverse" : "flex-col"}`}
                >
                  {popup.flipped && (
                    <div
                      className={`h-0 w-0 border-l-[6px] border-r-[6px] border-l-transparent border-r-transparent ${arrowAlign} ${cfg.arrowBottomClass} border-b-[6px]`}
                    />
                  )}

                  <div
                    className={`rounded-lg border bg-white px-3 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.12)] ${cfg.popupBorderClass}`}
                  >
                    <div className="mb-1 text-center">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide ${cfg.textClass}`}
                      >
                        {popup.miscue.miscueType.replace(/_/g, " ")}
                      </span>
                      {popup.miscue.spokenWord && (
                        <div className="text-[10px] text-[#31318A]/70">
                          Spoken: &ldquo;{popup.miscue.spokenWord}&rdquo;
                        </div>
                      )}
                      {hasTimestamp && (
                        <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-[#31318A]/50">
                          <Play className="h-2.5 w-2.5" />
                          {formatTimestamp(popup.miscue.timestamp!)}
                        </div>
                      )}
                    </div>
                  </div>

                  {!popup.flipped && (
                    <div
                      className={`h-0 w-0 border-l-[6px] border-r-[6px] border-l-transparent border-r-transparent ${arrowAlign} ${cfg.arrowTopClass} border-t-[6px]`}
                    />
                  )}
                </div>
              );
            })()}
        </div>
      </div>
    </div>
  );
}

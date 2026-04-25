"use client";

import { useState, useRef, useEffect, type CSSProperties } from "react";
import { Minus, Plus, Trash2, Loader2 } from "lucide-react";
import type { MiscueType } from "./useEditMiscues";

// ─── Position helpers ───

function computePopoverStyle(
  anchorRect: DOMRect,
  containerRect: DOMRect,
  scrollTop: number,
): CSSProperties {
  const xPos = anchorRect.left - containerRect.left + anchorRect.width / 2;
  const yPos = anchorRect.bottom - containerRect.top + scrollTop + 6;
  return {
    position: "absolute",
    left: xPos,
    top: yPos,
    transform: "translateX(-50%)",
    zIndex: 40,
  };
}

// ─── Color map ───

const MISCUE_TEXT_COLORS: Record<string, string> = {
  OMISSION: "#4B3BA3",
  INSERTION: "#1E7A35",
  MISPRONUNCIATION: "#C41048",
  SUBSTITUTION: "#1A5FB4",
  REVERSAL: "#6E4023",
  TRANSPOSITION: "#8B008B",
  REPETITION: "#B85C00",
  SELF_CORRECTION: "#8A6D00",
};

// ─── Text Input Popover ───

interface TextInputPopoverProps {
  wordIndex: number;
  expectedWord: string;
  miscueType: MiscueType;
  anchorEl: HTMLElement | null;
  containerEl: HTMLElement | null;
  onConfirm: (
    wordIndex: number,
    expectedWord: string,
    spokenWord: string,
  ) => void;
  onCancel: () => void;
}

export function TextInputPopover({
  wordIndex,
  expectedWord,
  miscueType,
  anchorEl,
  containerEl,
  onConfirm,
  onCancel,
}: TextInputPopoverProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const style =
    anchorEl && containerEl
      ? computePopoverStyle(
          anchorEl.getBoundingClientRect(),
          containerEl.getBoundingClientRect(),
          containerEl.scrollTop,
        )
      : { position: "absolute" as const, zIndex: 40 };

  const color = MISCUE_TEXT_COLORS[miscueType] || "#31318A";

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onConfirm(wordIndex, expectedWord, trimmed);
    }
    onCancel();
  };

  return (
    <div
      style={style}
      className="w-48 rounded-lg border border-[#54A4FF] bg-white p-2 shadow-lg"
    >
      <div className="mb-1 text-[10px] font-bold uppercase" style={{ color }}>
        {miscueType.replace(/_/g, " ")}
      </div>
      <div className="mb-1.5 text-[10px] text-[#31318A]/60">
        {expectedWord ? (
          <>Word: &ldquo;{expectedWord}&rdquo;</>
        ) : (
          <>Insert a word</>
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder={
          expectedWord ? "What was spoken?" : "Type the inserted word"
        }
        className="mb-1.5 w-full rounded border border-[#54A4FF]/50 px-2 py-1 text-xs text-[#00306E] outline-none focus:border-[#6666FF]"
      />
      <div className="flex gap-1">
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 rounded bg-[#6666FF] px-2 py-1 text-[10px] font-bold text-white hover:bg-[#5555EE]"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600 hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Repetition Popover ───

interface RepetitionPopoverProps {
  wordIndex: number;
  expectedWord: string;
  anchorEl: HTMLElement | null;
  containerEl: HTMLElement | null;
  onConfirm: (wordIndex: number, expectedWord: string, count: number) => void;
  onCancel: () => void;
}

export function RepetitionPopover({
  wordIndex,
  expectedWord,
  anchorEl,
  containerEl,
  onConfirm,
  onCancel,
}: RepetitionPopoverProps) {
  const [count, setCount] = useState(2);

  const style =
    anchorEl && containerEl
      ? computePopoverStyle(
          anchorEl.getBoundingClientRect(),
          containerEl.getBoundingClientRect(),
          containerEl.scrollTop,
        )
      : { position: "absolute" as const, zIndex: 40 };

  return (
    <div
      style={style}
      className="w-44 rounded-lg border border-[#54A4FF] bg-white p-2 shadow-lg"
    >
      <div className="mb-1 text-[10px] font-bold uppercase text-[#B85C00]">
        Repetition
      </div>
      <div className="mb-1.5 text-[10px] text-[#31318A]/60">
        Word: &ldquo;{expectedWord}&rdquo;
      </div>
      <div className="mb-1.5 flex items-center justify-center gap-2">
       <button
  type="button"
  aria-label="Decrease count"
  onClick={() => setCount((c) => Math.max(2, c - 1))}
  className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
>
  <Minus className="h-3 w-3" />
</button>
        <span className="text-sm font-bold text-[#B85C00]">{count}×</span>
        <button
          type="button"
          aria-label="Increase count"
          onClick={() => setCount((c) => Math.min(10, c + 1))}
          className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => {
            onConfirm(wordIndex, expectedWord, count);
            onCancel();
          }}
          className="flex-1 rounded bg-[#B85C00] px-2 py-1 text-[10px] font-bold text-white hover:bg-[#A04F00]"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600 hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Context Menu Popover (right-click on existing miscue) ───

interface ContextMenuPopoverProps {
  x: number;
  y: number;
  miscueIndex: number;
  onRemove: (index: number) => void;
  onClose: () => void;
}

export function ContextMenuPopover({
  x,
  y,
  miscueIndex,
  onRemove,
  onClose,
}: ContextMenuPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ position: "absolute", left: x, top: y, zIndex: 50 }}
      className="rounded-lg border border-[#C41048]/30 bg-white py-1 shadow-lg"
    >
      <button
        type="button"
        onClick={() => {
          onRemove(miscueIndex);
          onClose();
        }}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#C41048] hover:bg-[#C41048]/10"
      >
        <Trash2 className="h-3 w-3" />
        Remove Miscue
      </button>
    </div>
  );
}

// ─── Miscue Action Popover (delete / change type on system-generated miscues) ───

const TYPE_OPTIONS: {
  type: MiscueType;
  label: string;
  color: string;
  bg: string;
}[] = [
  {
    type: "OMISSION",
    label: "Omission",
    color: "#4B3BA3",
    bg: "rgba(180,170,240,0.18)",
  },
  {
    type: "INSERTION",
    label: "Insertion",
    color: "#1E7A35",
    bg: "rgba(140,220,160,0.18)",
  },
  {
    type: "MISPRONUNCIATION",
    label: "Mispronunciation",
    color: "#C41048",
    bg: "rgba(253,182,210,0.2)",
  },
  {
    type: "SUBSTITUTION",
    label: "Substitution",
    color: "#1A5FB4",
    bg: "rgba(160,200,255,0.18)",
  },
  {
    type: "REVERSAL",
    label: "Reversal",
    color: "#6E4023",
    bg: "rgba(200,165,130,0.15)",
  },
  {
    type: "TRANSPOSITION",
    label: "Transposition",
    color: "#8B008B",
    bg: "rgba(220,120,220,0.18)",
  },
  {
    type: "REPETITION",
    label: "Repetition",
    color: "#B85C00",
    bg: "rgba(255,200,140,0.2)",
  },
  {
    type: "SELF_CORRECTION",
    label: "Self-Correction",
    color: "#8A6D00",
    bg: "rgba(250,230,140,0.2)",
  },
];

interface MiscueActionPopoverProps {
  miscueType: MiscueType;
  spokenWord?: string | null;
  isLoading: boolean;
  onDelete: () => void;
  onChangeType: (newType: MiscueType) => void;
  onClose: () => void;
}

export function MiscueActionPopover({
  miscueType,
  spokenWord,
  isLoading,
  onDelete,
  onChangeType,
  onClose,
}: MiscueActionPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const color = MISCUE_TEXT_COLORS[miscueType] || "#31318A";

  return (
    <div
      ref={ref}
      className="w-56 rounded-lg border border-[#54A4FF] bg-white p-2.5 shadow-lg"
    >
      {/* Current type */}
      <div className="mb-1.5 text-center">
        <span
          className="text-[10px] font-bold uppercase tracking-wide"
          style={{ color }}
        >
          {miscueType.replace(/_/g, " ")}
        </span>
        {spokenWord && (
          <div className="text-[10px] text-[#31318A]/70">
            Spoken: &ldquo;{spokenWord}&rdquo;
          </div>
        )}
      </div>

      {/* Permanent delete */}
      <div className="mb-2">
        <button
          type="button"
          disabled={isLoading}
          onClick={onDelete}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#C41048] px-2 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#A30D3B] disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
          Delete permanently
        </button>
      </div>

      {/* Change type */}
      <div className="mb-1 text-[10px] font-semibold text-[#31318A]/60">
        Change type:
      </div>
      <div className="flex flex-wrap gap-1">
        {TYPE_OPTIONS.filter((t) => t.type !== miscueType).map((opt) => (
          <button
            key={opt.type}
            type="button"
            disabled={isLoading}
            onClick={() => onChangeType(opt.type)}
            className="rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-all hover:brightness-90 disabled:opacity-50"
            style={{ color: opt.color, backgroundColor: opt.bg }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import type { EditTool, MiscueType } from "./useEditMiscues";
import {
  Undo2,
  Redo2,
  Check,
  X,
  RotateCcw,
} from "lucide-react";

// ─── Tool config ───

interface ToolConfig {
  type: MiscueType;
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  bgActive: string;
  instruction: string;
}

const TOOL_CONFIG: ToolConfig[] = [
  {
    type: "OMISSION",
    label: "Omission",
    shortLabel: "OMISSION",
    color: "#4B3BA3",
    bg: "rgba(180,170,240,0.18)",
    bgActive: "rgba(180,170,240,0.5)",
    instruction: "Click a word the student skipped.",
  },
  {
    type: "INSERTION",
    label: "Insertion",
    shortLabel: "INSERTION",
    color: "#1E7A35",
    bg: "rgba(140,220,160,0.18)",
    bgActive: "rgba(140,220,160,0.5)",
    instruction: "Click the word where an extra word was inserted, then type the spoken word.",
  },
  {
    type: "MISPRONUNCIATION",
    label: "Mispronunciation",
    shortLabel: "MISPRONUNCIATION",
    color: "#C41048",
    bg: "rgba(253,182,210,0.2)",
    bgActive: "rgba(253,182,210,0.55)",
    instruction: "Click the mispronounced word, then type what was actually said.",
  },
  {
    type: "SUBSTITUTION",
    label: "Substitution",
    shortLabel: "SUBSTITUTION",
    color: "#1A5FB4",
    bg: "rgba(160,200,255,0.18)",
    bgActive: "rgba(160,200,255,0.5)",
    instruction: "Click the substituted word, then type the replacement word.",
  },
  {
    type: "REVERSAL",
    label: "Reversal",
    shortLabel: "REVERSAL",
    color: "#6E4023",
    bg: "rgba(200,165,130,0.15)",
    bgActive: "rgba(200,165,130,0.45)",
    instruction: "Click the word that was read in reverse (e.g. 'was' → 'saw').",
  },
  {
    type: "TRANSPOSITION",
    label: "Transposition",
    shortLabel: "TRANSPOSITION",
    color: "#8B008B",
    bg: "rgba(220,120,220,0.18)",
    bgActive: "rgba(220,120,220,0.5)",
    instruction: "Click the first word, then click the second word to mark the swap.",
  },
  {
    type: "REPETITION",
    label: "Repetition",
    shortLabel: "REPETITION",
    color: "#B85C00",
    bg: "rgba(255,200,140,0.2)",
    bgActive: "rgba(255,200,140,0.55)",
    instruction: "Click the repeated word, then enter how many times it was repeated.",
  },
  {
    type: "SELF_CORRECTION",
    label: "Self-Correction",
    shortLabel: "SELF_CORRECTION",
    color: "#8A6D00",
    bg: "rgba(250,230,140,0.2)",
    bgActive: "rgba(250,230,140,0.55)",
    instruction: "Click the word where the student self-corrected.",
  },
];

// ─── Props ───

interface MiscueToolbarProps {
  activeTool: EditTool;
  onSelectTool: (tool: EditTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onCancel: () => void;
  onResetAll: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  transpositionFirst: number | null;
}

// ─── Component ───

export function MiscueToolbar({
  activeTool,
  onSelectTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onCancel,
  onResetAll,
  isSaving,
  hasUnsavedChanges,
  transpositionFirst,
}: MiscueToolbarProps) {
  const activeConfig = TOOL_CONFIG.find((t) => t.type === activeTool);

  return (
    <div className="mb-2 rounded-lg border border-[#54A4FF]/40 bg-white/80 px-3 py-2 shadow-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Tool buttons */}
        {TOOL_CONFIG.map((tool) => {
          const isActive = activeTool === tool.type;
          return (
            <button
              key={tool.type}
              type="button"
              onClick={() => onSelectTool(isActive ? null : tool.type)}
              title={tool.label}
              className="flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-bold transition-all"
              style={{
                color: tool.color,
                backgroundColor: isActive ? tool.bgActive : tool.bg,
                boxShadow: isActive
                  ? `0 0 0 1.5px ${tool.color}`
                  : "none",
              }}
            >
              {tool.shortLabel}
            </button>
          );
        })}

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-[#54A4FF]/30" />

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#31318A] transition-colors hover:bg-[#31318A]/10 disabled:opacity-30 disabled:pointer-events-none"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#31318A] transition-colors hover:bg-[#31318A]/10 disabled:opacity-30 disabled:pointer-events-none"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-[#54A4FF]/30" />

        {/* Save/Close */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          title="Save changes"
          className="flex shrink-0 items-center gap-1 rounded-md bg-[#1E7A35] px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-[#166B2B] disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          <span>Save</span>
        </button>
        <button
          type="button"
          onClick={onResetAll}
          disabled={!canUndo}
          title="Undo all changes"
          className="flex shrink-0 items-center gap-1 rounded-md bg-[#31318A]/10 px-2.5 py-1 text-[11px] font-bold text-[#31318A] transition-colors hover:bg-[#31318A]/20 disabled:opacity-30 disabled:pointer-events-none"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Undo All</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          title={
            hasUnsavedChanges
              ? "Close editing with unsaved changes"
              : "Close editing"
          }
          className="flex shrink-0 items-center gap-1 rounded-md bg-[#C41048]/10 px-2.5 py-1 text-[11px] font-bold text-[#C41048] transition-colors hover:bg-[#C41048]/20"
        >
          <X className="h-3.5 w-3.5" />
          <span>Close</span>
        </button>
      </div>

      {/* Instruction line */}
      <div className="min-h-[18px] text-center text-[10px] font-medium text-[#31318A]/70">
        {activeTool === "TRANSPOSITION" && transpositionFirst !== null ? (
          <span className="text-[#8B008B] font-semibold">
            First word selected — now click the second word to complete transposition
          </span>
        ) : activeConfig ? (
          <span>{activeConfig.instruction}</span>
        ) : (
          <span>Select a tool above, then click words in the passage to add miscues.</span>
        )}
      </div>
    </div>
  );
}

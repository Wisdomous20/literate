"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";

export type BehaviorType =
  | "WORD_BY_WORD_READING"
  | "MONOTONOUS_READING"
  | "DISMISSAL_OF_PUNCTUATION";

export interface BehaviorItem {
  key?: BehaviorType;
  label: string;
  description: string;
  checked?: boolean;
}

interface BehaviorChecklistProps {
  behaviors: BehaviorItem[];
  otherObservations?: string;
  onSave?: (behaviorTypes: BehaviorType[]) => Promise<void> | void;
}

const defaultBehaviors: BehaviorItem[] = [
  {
    label: "Does word-by-word reading",
    description: "(Nagbabasa nang pa-isa isang salita)",
  },
  {
    label: "Lacks expression: reads in a monotonous tone",
    description: "(Walang damdamin; walang pagbabago ang tono)",
  },
  {
    label: "Disregards Punctuation",
    description: "(Hindi pinapansin ang mga bantas)",
  },
  {
    label: "Employs little or no method of analysis",
    description: "(Bahagya o walang paraan ng pagsusuri)",
  },
];

export default function BehaviorChecklist({
  behaviors = defaultBehaviors,
  otherObservations = "",
  onSave,
}: BehaviorChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    behaviors.map((b) => b.checked ?? false),
  );
  const [observations, setObservations] = useState(otherObservations);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // snapshot for cancel
  const [savedChecked, setSavedChecked] = useState<boolean[]>(
    behaviors.map((b) => b.checked ?? false),
  );
  const [savedObservations, setSavedObservations] = useState(otherObservations);

  useEffect(() => {
    setCheckedItems(behaviors.map((b) => b.checked ?? false));
    setSavedChecked(behaviors.map((b) => b.checked ?? false));
  }, [behaviors]);

  useEffect(() => {
    setObservations(otherObservations);
    setSavedObservations(otherObservations);
  }, [otherObservations]);

  const toggleItem = (index: number) => {
    if (!isEditMode) return;
    setCheckedItems((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const selectedBehaviorTypes = () =>
    behaviors
      .filter((item, index) => item.key && checkedItems[index])
      .map((item) => item.key!);

  const handleSave = async () => {
    if (!onSave) {
      setSavedChecked([...checkedItems]);
      setSavedObservations(observations);
      setIsEditMode(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(selectedBehaviorTypes());
      setSavedChecked([...checkedItems]);
      setSavedObservations(observations);
      setIsEditMode(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCheckedItems([...savedChecked]);
    setObservations(savedObservations);
    setIsEditMode(false);
  };

  const handleClear = () => {
    setCheckedItems(behaviors.map(() => false));
    setObservations("");
  };

  return (
    <div className="bg-white border-t border-l border-r-4 border-b-4 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9] border-b-[#6653F9] shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-[10px] p-5 pb-3 flex flex-col">
      {/* Header row */}
      <div className="flex items-start justify-between mb-0.5">
        <h3 className="text-base font-bold text-[#003366]">
          Oral Behavior Checklist
        </h3>
        {!isEditMode && (
          <button
            type="button"
            onClick={() => setIsEditMode(true)}
            className="flex items-center gap-1 rounded-full border border-[#6666FF]/30 bg-[#F0F4FF] px-3 py-1 text-[10px] font-semibold text-[#6666FF] transition-colors hover:bg-[#E0E8FF]"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        )}
      </div>
      <p className="mb-4 font-kanit text-sm text-[rgba(40,19,19,0.71)]">
        Behavior analysis during reading
      </p>

      <div className="flex flex-col gap-0">
        {behaviors.map((item, i) => (
          <div key={item.label}>
            <button
              type="button"
              onClick={() => toggleItem(i)}
              disabled={!isEditMode}
              className={`flex items-start gap-3 py-3 w-full text-left ${isEditMode ? "cursor-pointer" : "cursor-default"}`}
            >
              <div
                className={`w-8 h-8 shrink-0 rounded border mt-0.5 flex items-center justify-center transition-colors ${
                  checkedItems[i]
                    ? "bg-[#5D5DFB] border-[#5D5DFB]"
                    : isEditMode
                      ? "bg-white border-[#5D5DFB]"
                      : "bg-white border-[#9CA3AF]"
                }`}
              >
                {checkedItems[i] && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8l3 3 7-7"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#31318A]">
                  {item.label}
                </span>
                <span className="text-[10px] text-[#31318A]">
                  {item.description}
                </span>
              </div>
            </button>
            <div className="border-b border-[rgba(18,48,220,0.25)]" />
          </div>
        ))}
      </div>

      {/* Other Observations */}
      <div className="mt-2">
        <label className="text-[10px] font-semibold text-[#31318A] block mb-1">
          Other Observations (Ibang Puna)
        </label>
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          disabled={!isEditMode}
          placeholder="Enter observations..."
          className={`w-full p-3 bg-[rgba(201,201,250,0.15)] rounded text-xs text-[#31318A] placeholder:text-[#31318A]/40 resize-none focus:outline-none focus:ring-1 focus:ring-[#5D5DFB] ${!isEditMode ? "opacity-70 cursor-default" : ""}`}
          rows={4}
        />
      </div>

      {/* Buttons */}
      {isEditMode ? (
        <div className="flex items-center justify-between gap-2 mt-3">
          <button
            type="button"
            onClick={handleClear}
            disabled={isSaving}
            className="px-4 py-1.5 text-xs font-bold text-[#31318A] bg-[rgba(108,164,239,0.19)] rounded-full hover:bg-[rgba(108,164,239,0.3)] transition-colors disabled:opacity-50"
          >
            Clear
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-1.5 text-xs font-bold text-[#6666FF] border border-[#6666FF]/40 bg-white rounded-full hover:bg-[#F0F4FF] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#6666FF] rounded-full hover:bg-[#5555EE] transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Save Observation"
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end mt-3">
          <span className="text-[10px] text-[#31318A]/50 italic">
            Click Edit to modify
          </span>
        </div>
      )}
    </div>
  );
}

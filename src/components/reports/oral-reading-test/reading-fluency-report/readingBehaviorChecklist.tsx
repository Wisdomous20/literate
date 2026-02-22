"use client";

import { useState } from "react";

export interface BehaviorItem {
  label: string;
  description: string;
  checked?: boolean;
}

interface BehaviorChecklistProps {
  behaviors: BehaviorItem[];
  otherObservations?: string;
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
}: BehaviorChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    behaviors.map((b) => b.checked ?? false)
  );
  const [observations, setObservations] = useState(otherObservations);

  const toggleItem = (index: number) => {
    setCheckedItems((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  return (
    <div className="bg-[#EFFDFF] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-2xl p-5 flex flex-col">
      <h3 className="text-base font-bold text-[#003366] mb-0.5">Oral Behavior Checklist</h3>
      <p className="text-sm text-[rgba(40,19,19,0.71)] mb-4" style={{ fontFamily: "var(--font-kanit)" }}>
        Behavior analysis during reading
      </p>

      <div className="flex flex-col gap-0">
        {behaviors.map((item, i) => (
          <div key={item.label}>
            <button
              type="button"
              onClick={() => toggleItem(i)}
              className="flex items-start gap-3 py-3 w-full text-left"
            >
              <div
                className={`w-8 h-8 shrink-0 rounded border border-[#5D5DFB] mt-0.5 flex items-center justify-center transition-colors ${
                  checkedItems[i] ? "bg-[#5D5DFB]" : "bg-white"
                }`}
              >
                {checkedItems[i] && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#31318A]">{item.label}</span>
                <span className="text-[10px] text-[#31318A]">{item.description}</span>
              </div>
            </button>
            <div className="border-b border-[rgba(18,48,220,0.25)]" />
          </div>
        ))}
      </div>

      {/* Other Observations */}
      <div className="mt-4">
        <label className="text-[10px] font-semibold text-[#31318A] block mb-1">
          Other Observations (Ibang Puna)
        </label>
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Enter observations..."
          className="w-full p-3 bg-[rgba(201,201,250,0.15)] rounded text-xs text-[#31318A] placeholder:text-[#31318A]/40 resize-none focus:outline-none focus:ring-1 focus:ring-[#5D5DFB]"
          rows={3}
        />
      </div>

      {/* Save / Delete buttons */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          type="button"
          className="px-3 py-1 text-[7px] font-bold italic text-[#31318A] bg-[rgba(108,164,239,0.19)] rounded hover:bg-[rgba(108,164,239,0.3)] transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          className="px-3 py-1 text-[7px] font-bold italic text-[#31318A] bg-[rgba(108,164,239,0.19)] rounded hover:bg-[rgba(108,164,239,0.3)] transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

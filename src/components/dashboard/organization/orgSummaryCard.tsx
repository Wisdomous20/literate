"use client";

import { useState } from "react";
import { Building2, Pencil } from "lucide-react";
import { renameOrgAction } from "@/app/actions/org/renameOrg";
import type { OrgSummary } from "./types";

interface OrgSummaryCardProps {
  onRenamed: () => void;
  org: OrgSummary;
}

export function OrgSummaryCard({ onRenamed, org }: OrgSummaryCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(org.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workspaceCode = `ORG-${org.id.slice(0, 8).toUpperCase()}`;

  async function handleSave() {
    if (!draft.trim() || saving) return;
    if (draft.trim() === org.name) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError(null);

    const res = await renameOrgAction(draft.trim());
    setSaving(false);

    if (!res.success) {
      setError(res.error ?? "Failed to rename");
      return;
    }

    setEditing(false);
    onRenamed();
  }

  return (
    <section className="overflow-hidden rounded-[32px] border border-[rgba(102,102,255,0.18)] bg-white shadow-[0_24px_64px_rgba(15,23,88,0.09)]">
      <div className="border-b border-[rgba(102,102,255,0.12)] bg-white px-6 py-6 sm:px-7 sm:py-7">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-[#5D5DFB] shadow-[0_16px_32px_rgba(93,93,251,0.22)]">
            <Building2 className="h-6 w-6 text-white" />
          </div>

          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5D5DFB]">
              Organization details
            </p>
            {editing ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSave();
                    if (e.key === "Escape") {
                      setDraft(org.name);
                      setEditing(false);
                    }
                  }}
                  className="h-12 w-full max-w-lg rounded-2xl border border-[#CBD4FF] bg-white px-4 text-lg font-bold text-[#16215C] outline-none transition focus:border-[#5D5DFB] focus:ring-4 focus:ring-[#5D5DFB]/10"
                />
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="rounded-2xl bg-[#5D5DFB] px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#4D4DEA] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(org.name);
                    setEditing(false);
                    setError(null);
                  }}
                  className="rounded-2xl border border-[#D8DEFF] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#6072A6] transition hover:bg-[#F7F8FF]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-bold tracking-[-0.03em] text-[#16215C] sm:text-[2.4rem]">
                  {org.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  aria-label="Rename organization"
                  title="Rename"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[#D8DEFF] bg-white px-4 text-sm font-semibold text-[#5D5DFB] transition hover:border-[#5D5DFB]/30 hover:bg-[#F6F7FF]"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </button>
              </div>
            )}
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6072A6]">
              Keep the organization name, subscription, and workspace settings in
              one clean reference area.
            </p>
            {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 xl:grid-cols-3 sm:px-7">
        <DetailCard
          label="Current plan"
          value={org.plan ?? "No active plan"}
          hint={
            org.plan
              ? "This plan sets the current member capacity."
              : "Choose a plan before expanding the team."
          }
        />
        <DetailCard
          label="Workspace ID"
          value={workspaceCode}
          hint="Useful when matching support notes or internal records."
        />
        <DetailCard
          label="Seat limit"
          value={`${org.maxMembers} member${org.maxMembers === 1 ? "" : "s"}`}
          hint="Maximum active members allowed at one time."
        />
      </div>
    </section>
  );
}

function DetailCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-[rgba(102,102,255,0.12)] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F9FF_100%)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6072A6]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#16215C]">
        {value}
      </p>
      <p className="mt-1 text-xs leading-6 text-[#6E7FAF]">{hint}</p>
    </div>
  );
}

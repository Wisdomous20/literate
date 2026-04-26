"use client";

import { Building2 } from "lucide-react";
import type { OrgSummary } from "./types";

interface OrganizationHeroProps {
  disabledMembers: number;
  org: OrgSummary;
  seatsRemaining: number;
}

export function OrganizationHero({
  disabledMembers,
  org,
  seatsRemaining,
}: OrganizationHeroProps) {
  return (
    <section
      data-tour-target="org-hero"
      className="overflow-hidden rounded-[32px] border border-[rgba(102,102,255,0.12)] bg-[linear-gradient(135deg,#FFFFFF_0%,#F6F8FF_52%,#EEF2FF_100%)] shadow-[0_22px_60px_rgba(15,23,88,0.08)]"
    >
      <div className="grid gap-8 px-6 py-6 sm:px-7 sm:py-7 xl:grid-cols-[minmax(0,1.28fr)_360px] xl:items-end">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-[#5D5DFB] shadow-[0_18px_32px_rgba(93,93,251,0.24)]">
            <Building2 className="h-7 w-7 text-white" />
          </div>

          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5D5DFB]">
              Organization workspace
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#16215C] sm:text-[2.5rem]">
              Keep team management clear, organized, and easy to scan.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6072A6] sm:text-[15px]">
              Use this page to handle invitations, access changes, and account
              support without repeating the same information in multiple places.
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-[rgba(102,102,255,0.14)] bg-white/92 p-5 shadow-[0_14px_32px_rgba(15,23,88,0.06)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6072A6]">
            Workspace status
          </p>
          <div className="mt-4 space-y-4">
            <StatusRow
              label="Seats available"
              value={String(seatsRemaining)}
              hint={
                seatsRemaining > 0
                  ? "Ready for new invitations."
                  : "No open seats right now."
              }
            />
            <StatusRow
              label="Disabled accounts"
              value={String(disabledMembers)}
              hint={
                disabledMembers > 0
                  ? "These can be reviewed in the roster below."
                  : "Everyone in the directory is active."
              }
            />
            <StatusRow
              label="Team directory"
              value={String(org.totalMembers)}
              hint="Total member records in the organization."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[rgba(102,102,255,0.08)] pb-4 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#16215C]">{label}</p>
        <p className="mt-1 text-xs leading-6 text-[#6E7FAF]">{hint}</p>
      </div>
      <p className="text-2xl font-bold tracking-[-0.02em] text-[#16215C]">
        {value}
      </p>
    </div>
  );
}

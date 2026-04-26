"use client";

import { useState } from "react";
import { AlertCircle, Building2, Loader2 } from "lucide-react";
import { createOrgAction } from "@/app/actions/org/createOrg";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex w-full max-w-md items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      <span className="flex-1">{message}</span>
    </div>
  );
}

export function CreateOrgPanel({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    const res = await createOrgAction(name.trim());
    setSubmitting(false);

    if (!res.success) {
      setError(res.error ?? "Failed to create organization");
      return;
    }

    onCreated();
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(102,102,255,0.14),transparent_25%),linear-gradient(180deg,#F8F9FF_0%,#EEF3FF_100%)] px-6 py-12">
      <form
        data-tour-target="org-create-panel"
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-[32px] border border-[rgba(102,102,255,0.14)] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFF_100%)] p-8 shadow-[0_24px_64px_rgba(12,26,109,0.1)]"
      >
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5D5DFB] shadow-[0_16px_28px_rgba(102,102,255,0.24)]">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5D5DFB]">
              Organization
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-[-0.02em] text-[#16215C]">
              Create your organization
            </h2>
            <p className="mt-2 max-w-md text-sm leading-7 text-[#6072A6]">
              Set up your workspace first, then you can invite members and
              manage access from one place.
            </p>
          </div>
        </div>

        <label
          htmlFor="orgName"
          className="block text-sm font-semibold text-[#31318A]"
        >
          Organization name
        </label>
        <input
          id="orgName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Maria's Reading Academy"
          className="mt-2 h-12 w-full rounded-2xl border border-[#CBD4FF] bg-white px-4 text-sm font-medium text-[#1B2A63] outline-none transition focus:border-[#5D5DFB] focus:ring-4 focus:ring-[#5D5DFB]/10"
        />

        {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          data-tour-target="org-create-button"
          disabled={!name.trim() || submitting}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5D5DFB] px-4 text-sm font-bold text-white transition hover:bg-[#4D4DEA] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Creating..." : "Create organization"}
        </button>
      </form>
    </main>
  );
}

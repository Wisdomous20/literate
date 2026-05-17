"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart2,
  BookOpen,
  FilePenLine,
  FileText,
  Globe,
  Save,
  X,
} from "lucide-react";
import { PassageWorkspaceHeader } from "@/components/admin-dash/passages/passageWorkspaceHeader";
import { usePassageById } from "@/lib/hooks/usePassageById";
import { updatePassageAction } from "@/app/actions/admin/updatePassage";
import { cn } from "@/lib/utils";

type AllowedLanguage = "Filipino" | "English";
type AllowedTestType = "PRE_TEST" | "POST_TEST";

const levels = [
  { label: "Kindergarten", value: 0 },
  { label: "Grade 1", value: 1 },
  { label: "Grade 2", value: 2 },
  { label: "Grade 3", value: 3 },
  { label: "Grade 4", value: 4 },
  { label: "Grade 5", value: 5 },
  { label: "Grade 6", value: 6 },
  { label: "Grade 7", value: 7 },
  { label: "Grade 8", value: 8 },
  { label: "Grade 9", value: 9 },
  { label: "Grade 10", value: 10 },
  { label: "Grade 11", value: 11 },
  { label: "Grade 12", value: 12 },
];

export default function PassageViewPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const passageId = params.id as string;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState<AllowedLanguage>("English");
  const [level, setLevel] = useState<number>(0);
  const [testType, setTestType] = useState<AllowedTestType>("PRE_TEST");

  const { data: passage, isLoading, error } = usePassageById(passageId);

  useEffect(() => {
    if (!passage) {
      return;
    }

    setTitle(passage.title);
    setContent(passage.content);
    setLanguage((passage.language as AllowedLanguage) ?? "English");
    setLevel(passage.level);
    setTestType((passage.testType as AllowedTestType) ?? "PRE_TEST");
  }, [passage]);

  const wordCount = useMemo(
    () => content.trim().split(/\s+/).filter(Boolean).length,
    [content]
  );

  const hasChanges =
    !!passage &&
    (title !== passage.title ||
      content !== passage.content ||
      language !== passage.language ||
      level !== passage.level ||
      testType !== passage.testType);

  const handleCancel = () => {
    if (!passage) {
      return;
    }

    setTitle(passage.title);
    setContent(passage.content);
    setLanguage((passage.language as AllowedLanguage) ?? "English");
    setLevel(passage.level);
    setTestType((passage.testType as AllowedTestType) ?? "PRE_TEST");
    setErrorMessage("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!passage) {
      return;
    }

    setErrorMessage("");

    if (!title.trim()) {
      setErrorMessage("Title is required.");
      return;
    }

    if (!content.trim()) {
      setErrorMessage("Passage content is required.");
      return;
    }

    setIsSaving(true);

    try {
      await updatePassageAction({
        id: passage.id,
        title: title.trim(),
        content: content.trim(),
        language,
        level,
        testType,
      });
      await queryClient.invalidateQueries({ queryKey: ["passage", passage.id] });
      await queryClient.invalidateQueries({ queryKey: ["passages"] });
      setIsEditing(false);
    } catch (saveError) {
      setErrorMessage(
        saveError instanceof Error ? saveError.message : "Failed to update passage."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-[#F4FCFD]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#31318A] border-t-transparent" />
          <span className="text-sm font-medium text-[#00306E]/60">
            Loading passage...
          </span>
        </div>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4FCFD]">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          {error?.message || "Passage not found"}
        </div>
      </div>
    );
  }

  const badges = [
    {
      icon: <FileText className="h-3 w-3" />,
      label: testType === "PRE_TEST" ? "Pre-Test" : "Post-Test",
      color: "border border-violet-200 bg-violet-100 text-violet-700 whitespace-nowrap",
    },
    {
      icon: <BarChart2 className="h-3 w-3" />,
      label: level === 0 ? "Kindergarten" : `Grade ${level}`,
      color: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    {
      icon: <Globe className="h-3 w-3" />,
      label: language,
      color: "bg-sky-50 text-sky-700 border border-sky-200",
    },
    {
      icon: <BookOpen className="h-3 w-3" />,
      label: `${wordCount} words`,
      color: "bg-slate-100 text-slate-600 border border-slate-200",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(124,198,254,0.14),transparent_22%),linear-gradient(180deg,#F4F8FC_0%,#EDF3F9_100%)]">
      <PassageWorkspaceHeader
        passageId={passageId}
        title={passage.title}
        active="passage"
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[30px] border border-[#D9E5F5] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className="border-b border-[#E7EEF7] p-6 xl:border-b-0 xl:border-r">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7B92AC]">
                    Passage
                  </p>
                  {!isEditing ? (
                    <>
                      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#0F2744]">
                        {passage.title}
                      </h2>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {badges.map((badge, index) => (
                          <span
                            key={index}
                            className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${badge.color}`}
                          >
                            {badge.icon}
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="mt-3 grid gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#16324F]">
                          Title
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          className="min-h-11 w-full rounded-2xl border border-[#D6E3F8] bg-[#F9FBFE] px-4 py-3 text-sm text-[#16324F] outline-none transition focus:border-[#2453A6]"
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <SelectField
                          label="Language"
                          value={language}
                          onChange={(value) => setLanguage(value as AllowedLanguage)}
                          options={[
                            { label: "English", value: "English" },
                            { label: "Filipino", value: "Filipino" },
                          ]}
                        />
                        <SelectField
                          label="Level"
                          value={String(level)}
                          onChange={(value) => setLevel(Number(value))}
                          options={levels.map((entry) => ({
                            label: entry.label,
                            value: String(entry.value),
                          }))}
                        />
                        <SelectField
                          label="Test Type"
                          value={testType}
                          onChange={(value) => setTestType(value as AllowedTestType)}
                          options={[
                            { label: "Pre-Test", value: "PRE_TEST" },
                            { label: "Post-Test", value: "POST_TEST" },
                          ]}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0C2D57] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163D70]"
                    >
                      <FilePenLine className="h-4 w-4" />
                      Edit passage
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D6E3F8] bg-white px-4 py-2 text-sm font-semibold text-[#16324F] transition hover:bg-[#EEF5FF]"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        className={cn(
                          "inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition",
                          isSaving || !hasChanges
                            ? "cursor-not-allowed bg-[#7C93B2]"
                            : "bg-[#0C2D57] hover:bg-[#163D70]"
                        )}
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Save changes"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {errorMessage && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#102A43]">
                    Passage Content
                  </h3>
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B92AC]">
                    {wordCount} words
                  </span>
                </div>

                {!isEditing ? (
                  <div className="max-h-[520px] overflow-auto rounded-[24px] border border-[#E3ECF7] bg-[linear-gradient(180deg,#FAFCFF_0%,#F5F9FD_100%)] px-5 py-5 text-[15px] leading-8 text-[#24415F] whitespace-pre-wrap">
                    {passage.content}
                  </div>
                ) : (
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={18}
                    className="min-h-[380px] w-full rounded-[24px] border border-[#D6E3F8] bg-[#F9FBFE] px-5 py-4 text-[15px] leading-8 text-[#16324F] outline-none transition focus:border-[#2453A6]"
                  />
                )}
              </div>
            </div>

            <aside className="bg-[linear-gradient(180deg,#F8FBFE_0%,#F3F7FC_100%)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7B92AC]">
                Passage Summary
              </p>
              <div className="mt-5 grid gap-3">
                <SummaryCard label="Title" value={title || passage.title} />
                <SummaryCard label="Language" value={language} />
                <SummaryCard
                  label="Level"
                  value={level === 0 ? "Kindergarten" : `Grade ${level}`}
                />
                <SummaryCard
                  label="Assessment"
                  value={testType === "PRE_TEST" ? "Pre-Test" : "Post-Test"}
                />
                <SummaryCard label="Word Count" value={String(wordCount)} />
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[#DDE7F4] bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B92AC]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#16324F]">
        {value}
      </p>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#16324F]">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-2xl border border-[#D6E3F8] bg-[#F9FBFE] px-4 py-3 text-sm text-[#16324F] outline-none transition focus:border-[#2453A6]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

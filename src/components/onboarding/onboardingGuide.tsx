"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  MousePointerClick,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type GuideStep = {
  label: string;
  control: string;
  description: string;
  outcome: string;
};

export type OnboardingSurface = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  flow: GuideStep[];
  tip: string;
  matches: (pathname: string) => boolean;
};

export const STORAGE_VERSION = "v3";

export const onboardingSurfaces: OnboardingSurface[] = [
  {
    id: "dashboard",
    eyebrow: "Start here",
    title: "Welcome to your dashboard",
    description:
      "This is your main workspace. From here, you can manage classes, monitor reading progress, review performance patterns, and choose which assessment to run next.",
    icon: LayoutDashboard,
    flow: [
      {
        label: "Choose the school year",
        control: "School Year selector",
        description:
          "Use this selector near the dashboard header to switch the dashboard to the correct school year.",
        outcome:
          "The class inventory and dashboard summaries refresh so you are working with the right learners.",
      },
      {
        label: "Create or open a class",
        control: "Create Class / Class cards",
        description:
          "Click Create Class to add a new roster, or click an existing class card to open that class.",
        outcome:
          "You move from a high-level dashboard into the class workspace where student records live.",
      },
      {
        label: "Review class performance",
        control: "Classification chart",
        description:
          "Use the chart to quickly see how many students fall into each reading classification.",
        outcome:
          "You can decide whether to assess, re-assess, or review reports before planning instruction.",
      },
      {
        label: "Start an assessment",
        control: "Sidebar assessment links",
        description:
          "Use Oral Reading Test, Reading Fluency Test, or Reading Comprehension Test in the sidebar.",
        outcome:
          "LiteRate opens the assessment workflow you chose while keeping you inside the teacher workspace.",
      },
    ],
    tip: "Begin with one active school year so your classes, students, and reports stay tidy.",
    matches: (pathname) => pathname === "/dashboard",
  },
  {
    id: "oral-reading-test",
    eyebrow: "Assessment guide",
    title: "Welcome to Oral Reading Test",
    description:
      "This page guides you through a complete oral reading assessment. You will set up the student, choose a passage, record the reading, and continue to comprehension when the recording is ready.",
    icon: BookOpenCheck,
    flow: [
      {
        label: "Prepare student details",
        control: "Student, Grade, and Class fields",
        description:
          "Enter a new student or choose an existing one, then select the grade level and class.",
        outcome:
          "The assessment result can be saved to the correct student profile and class record.",
      },
      {
        label: "Select a passage",
        control: "Add Passage",
        description:
          "Click Add Passage to open the passage picker, then choose language, level, and test type.",
        outcome:
          "The selected passage appears on the page and the reading controls become meaningful.",
      },
      {
        label: "Check readiness",
        control: "Countdown and Readiness Check",
        description:
          "Use Countdown to give the learner a clear start cue, and Readiness Check to confirm audio and instructions.",
        outcome:
          "You reduce recording mistakes before moving into the full-screen reading experience.",
      },
      {
        label: "Record the oral reading",
        control: "Start Reading",
        description:
          "Click Start Reading to open the passage in full-screen mode and begin the recording workflow.",
        outcome:
          "When recording ends, you return to the test page with audio saved for review and analysis.",
      },
      {
        label: "Fix or reset the recording",
        control: "Try Again / Start Over",
        description:
          "Use Try Again when only the recording needs to be replaced. Use Start Over when the whole setup is wrong.",
        outcome:
          "You can correct mistakes without accidentally saving a poor-quality attempt.",
      },
      {
        label: "Move to comprehension",
        control: "Continue",
        description:
          "After a valid recording, click Continue to open the paired comprehension portion.",
        outcome:
          "The oral reading flow continues into comprehension so the final report has a fuller picture.",
      },
    ],
    tip: "Use the readiness check before recording so the student hears the instructions clearly.",
    matches: (pathname) => pathname.startsWith("/dashboard/oral-reading-test"),
  },
  {
    id: "reading-fluency-test",
    eyebrow: "Assessment guide",
    title: "Welcome to Reading Fluency Test",
    description:
      "This page helps you measure how smoothly and accurately a student reads. Choose a passage, record one complete reading, and LiteRate will analyze pace, accuracy, miscues, and fluency level.",
    icon: Sparkles,
    flow: [
      {
        label: "Set the learner context",
        control: "Student, Grade, and Class fields",
        description:
          "Select or enter the student, then choose the grade level and class.",
        outcome:
          "LiteRate knows where to store the fluency result after analysis.",
      },
      {
        label: "Choose the reading passage",
        control: "Add Passage",
        description:
          "Open the passage picker and choose a text that matches the learner and assessment purpose.",
        outcome:
          "The passage loads into the reading area and prepares the recording workflow.",
      },
      {
        label: "Record the fluency sample",
        control: "Start Reading",
        description:
          "Start the full-screen reading mode and capture one complete read.",
        outcome:
          "LiteRate processes pace, accuracy, miscues, and fluency classification from the recording.",
      },
      {
        label: "Inspect the passage",
        control: "Miscues toggle",
        description:
          "Switch between the original passage and highlighted miscues once analysis is available.",
        outcome:
          "You can see which specific reading behaviors affected the fluency score.",
      },
      {
        label: "Save the evidence",
        control: "Export PDF",
        description:
          "Click Export PDF from the results panel after analysis completes.",
        outcome:
          "You get a shareable fluency report for records, conferences, or instruction planning.",
      },
      {
        label: "Redo if needed",
        control: "Try Again / Start Over",
        description:
          "Use Try Again for a new recording, or Start Over to reset the student, passage, and recording.",
        outcome:
          "You can recover from setup or audio issues before relying on the result.",
      },
    ],
    tip: "A quiet room and one complete recording give the strongest fluency analysis.",
    matches: (pathname) =>
      pathname.startsWith("/dashboard/reading-fluency-test"),
  },
  {
    id: "reading-comprehension-test",
    eyebrow: "Assessment guide",
    title: "Welcome to Reading Comprehension Test",
    description:
      "This page helps you check how well a student understands a passage. Set up the learner, open the question set, collect answers, and submit them for scoring and classification.",
    icon: ListChecks,
    flow: [
      {
        label: "Complete setup",
        control: "Student, Grade, Class, and Add Passage",
        description:
          "Choose the learner details first, then click Add Passage to load the reading and its linked questions.",
        outcome:
          "The comprehension flow is tied to the right student and the right passage.",
      },
      {
        label: "Begin comprehension",
        control: "Continue to Comprehension",
        description:
          "Click this button when the student has read the passage and is ready to answer.",
        outcome:
          "The page switches from setup mode into the question-taking experience.",
      },
      {
        label: "Manage the attempt",
        control: "Pause",
        description:
          "Pause the visible timer when the student is not actively answering.",
        outcome:
          "Elapsed time stays more accurate when there are interruptions.",
      },
      {
        label: "Answer questions",
        control: "Question cards",
        description:
          "Use the answer choices or essay fields inside each question card.",
        outcome:
          "Responses are collected locally until you submit the attempt.",
      },
      {
        label: "Submit and review",
        control: "Submit",
        description:
          "Click Submit to send completed answers for scoring and classification.",
        outcome:
          "LiteRate shows the score, classification, and comprehension breakdown panel.",
      },
      {
        label: "Retry the attempt",
        control: "Try Again",
        description:
          "Use this after submission if the student needs to redo the answer attempt.",
        outcome:
          "Answers and scoring reset while the selected learner and passage stay in place.",
      },
    ],
    tip: "Encourage students to answer what they can first; unanswered items can skew the final read.",
    matches: (pathname) =>
      pathname.startsWith("/dashboard/reading-comprehension-test"),
  },
  {
    id: "class-view",
    eyebrow: "Class guide",
    title: "Welcome to class view",
    description:
      "This is where you manage one class in detail. You can add students, search the roster, filter assessment history, review class statistics, and open individual student reports.",
    icon: Users,
    flow: [
      {
        label: "Review the roster",
        control: "Student table",
        description:
          "Use the table to confirm who is in the class and who has recent assessment activity.",
        outcome:
          "You get a class-level view before opening individual reports.",
      },
      {
        label: "Add missing learners",
        control: "Add Student",
        description:
          "Open the Add Student modal when a learner is not yet in this class roster.",
        outcome:
          "The student becomes available for future assessment workflows.",
      },
      {
        label: "Find the right student",
        control: "Search students and Sort",
        description:
          "Search by name or cycle sorting options when the roster grows.",
        outcome:
          "You can locate a learner quickly without scanning the whole table.",
      },
      {
        label: "Filter assessment history",
        control: "Assessment tabs",
        description:
          "Switch the table and statistics sidebar between all assessments and individual test types.",
        outcome:
          "The class view narrows to the assessment evidence you are currently reviewing.",
      },
      {
        label: "Open reports",
        control: "Student row actions",
        description:
          "Open reports, update student details, or remove a student depending on the available row controls.",
        outcome:
          "You move from class-level management into student-specific evidence and next steps.",
      },
    ],
    tip: "Keep one class per school year and grade group so the dashboard summaries stay meaningful.",
    matches: (pathname) => pathname.startsWith("/dashboard/class"),
  },
  {
    id: "organization",
    eyebrow: "Organization guide",
    title: "Welcome to Organization",
    description:
      "This is where organization admins manage the shared workspace. You can review seats, rename the organization, invite members, and manage member access from one place.",
    icon: Users,
    flow: [
      {
        label: "Review workspace status",
        control: "Organization summary",
        description:
          "Start with the top summary to understand available seats, disabled accounts, and total member records.",
        outcome:
          "You know whether the team has room for new members before sending invites.",
      },
      {
        label: "Update organization details",
        control: "Rename organization",
        description:
          "Use the Rename button if the workspace name needs to match your school or team name.",
        outcome:
          "The organization label stays clear across invitations, member screens, and admin references.",
      },
      {
        label: "Invite a team member",
        control: "Invite member form",
        description:
          "Fill in the member name and email, then send an invitation when seats are available.",
        outcome:
          "The member receives an invite and appears in the team workflow after accepting.",
      },
      {
        label: "Manage member access",
        control: "Members directory",
        description:
          "Use member row actions to generate passwords, set custom passwords, disable, or re-enable accounts.",
        outcome:
          "You can keep account access current without leaving the organization page.",
      },
    ],
    tip: "Check available seats before inviting members so you can avoid failed invitations or seat-limit confusion.",
    matches: (pathname) => pathname === "/dashboard/organization",
  },
  {
    id: "settings",
    eyebrow: "Settings guide",
    title: "Welcome to Settings",
    description:
      "This page is focused on account-level controls. You can update your profile name, change your password through email verification, and review or manage your subscription.",
    icon: Settings,
    flow: [
      {
        label: "Update your profile",
        control: "Profile card",
        description:
          "Edit your first and last name, then save changes when the profile needs updating.",
        outcome:
          "Your display name updates across the teacher workspace.",
      },
      {
        label: "Change your password",
        control: "Password card",
        description:
          "Enter your current password and new password, then request the verification code.",
        outcome:
          "LiteRate sends a code to your email before applying the password change.",
      },
      {
        label: "Review your subscription",
        control: "Subscription card",
        description:
          "Check plan status, seats, billing period, and available plan actions.",
        outcome:
          "You can change plan or stop renewal from the subscription area when those actions are available.",
      },
    ],
    tip: "Keep profile and subscription details current so billing, invitations, and account recovery stay easier to manage.",
    matches: (pathname) => pathname === "/dashboard/settings-page",
  },
];

export function getStorageKey(userId: string, surfaceId: string) {
  return `literater:onboarding:${STORAGE_VERSION}:${userId}:${surfaceId}`;
}

export function getCurrentSurface(pathname: string) {
  return onboardingSurfaces.find((surface) => surface.matches(pathname));
}

export function OnboardingGuide() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const surface = getCurrentSurface(pathname);
  const userId = session?.user?.id;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!surface || !userId) return null;

  const Icon = surface.icon;
  const safeActiveStepIndex = Math.min(activeStepIndex, surface.flow.length - 1);
  const activeStep = surface.flow[safeActiveStepIndex];
  const isFirstStep = safeActiveStepIndex === 0;
  const isLastStep = safeActiveStepIndex === surface.flow.length - 1;

  const markSeenAndClose = () => {
    try {
      localStorage.setItem(getStorageKey(userId, surface.id), "seen");
    } catch {
      /* localStorage can be unavailable in privacy-restricted contexts. */
    }
    setIsOpen(false);
  };

  const goToPreviousStep = () => {
    setActiveStepIndex((current) => Math.max(0, current - 1));
  };

  const goToNextStep = () => {
    setActiveStepIndex((current) =>
      Math.min(surface.flow.length - 1, current + 1),
    );
  };

  const startPageTour = () => {
    window.dispatchEvent(new Event("literater:restart-onboarding-tour"));
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setActiveStepIndex(0);
          setIsOpen(true);
        }}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-[#D9E2FF] bg-white px-4 py-2.5 text-sm font-bold text-[#31318A] shadow-[0_12px_30px_rgba(49,49,138,0.18)] transition-all hover:-translate-y-0.5 hover:border-[#6666FF] hover:text-[#5555EE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C4C4FF]/70"
        aria-label={`Open onboarding guide for ${surface.title}`}
      >
        <HelpCircle className="h-4 w-4" />
        Guide
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Close onboarding guide"
            className="absolute inset-0 bg-[#08122B]/55 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_28px_80px_rgba(8,18,43,0.28)]"
          >
            <div className="relative overflow-hidden bg-linear-to-br from-[#F8F9FF] via-white to-[#E9EDFF] px-6 pb-6 pt-5 md:px-8 md:pb-8">
              <div className="absolute -right-16 -top-24 h-52 w-52 rounded-full bg-[#6666FF]/15" />
              <div className="absolute bottom-0 left-10 h-24 w-24 rounded-full bg-[#00A3FF]/10" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6666FF] text-white shadow-[0_12px_28px_rgba(102,102,255,0.35)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-[#6666FF]">
                      {surface.eyebrow}
                    </p>
                    <h2
                      id="onboarding-title"
                      className="mt-1 text-2xl font-black tracking-[-0.03em] text-[#00306E] md:text-3xl"
                    >
                      {surface.title}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full bg-white/90 p-2 text-[#00306E]/70 shadow-sm transition hover:bg-white hover:text-[#00306E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C4C4FF]/70"
                  aria-label="Close onboarding guide"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="relative mt-5 max-w-3xl text-sm leading-6 text-[#00306E]/75 md:text-base">
                {surface.description}
              </p>
            </div>

            <div className="grid gap-5 overflow-y-auto p-6 md:p-8 lg:grid-cols-[0.82fr_1.25fr_0.72fr]">
              <div className="rounded-3xl border border-[#D9E2FF] bg-[#FBFCFF] p-4">
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#31318A]">
                  Flow map
                </h3>
                <div className="mt-4 space-y-2">
                  {surface.flow.map((step, index) => (
                    <button
                      key={step.label}
                      type="button"
                      onClick={() => setActiveStepIndex(index)}
                      className={`flex w-full gap-3 rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C4C4FF]/70 ${
                        index === safeActiveStepIndex
                          ? "border-[#6666FF] bg-white shadow-[0_10px_24px_rgba(102,102,255,0.14)]"
                          : "border-transparent hover:border-[#D9E2FF] hover:bg-white/70"
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                          index === safeActiveStepIndex
                            ? "bg-[#6666FF] text-white"
                            : "bg-[#EEF0FF] text-[#5555EE]"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#00306E]">
                          {step.label}
                        </p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#6666FF]">
                          {step.control}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-[#D9E2FF] bg-white p-5 shadow-[0_10px_30px_rgba(102,102,255,0.08)]">
                <div className="absolute -right-10 top-8 h-28 w-28 rounded-full bg-[#6666FF]/10" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#6666FF]">
                      Step {safeActiveStepIndex + 1} of {surface.flow.length}
                    </p>
                    <span className="rounded-full bg-[#EEF0FF] px-3 py-1 text-xs font-black text-[#5555EE]">
                      {activeStep.control}
                    </span>
                  </div>

                  <h3 className="mt-4 text-2xl font-black tracking-[-0.03em] text-[#00306E]">
                    {activeStep.label}
                  </h3>

                  <div className="mt-5 rounded-3xl border border-[#C4C4FF]/60 bg-[#F8F9FF] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#31318A]/70">
                      What this control does
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#00306E]/78">
                      {activeStep.description}
                    </p>
                  </div>

                  <div className="mt-4 rounded-3xl border border-[#D7F3E3] bg-[#F3FFF8] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1E9E59]">
                      What happens next
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#00306E]/78">
                      {activeStep.outcome}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={goToPreviousStep}
                      disabled={isFirstStep}
                      className="inline-flex items-center gap-2 rounded-full border border-[#D9E2FF] px-4 py-2 text-sm font-bold text-[#31318A] transition hover:border-[#6666FF] hover:bg-[#F8F9FF] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C4C4FF]/70"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>

                    <button
                      type="button"
                      onClick={isLastStep ? markSeenAndClose : goToNextStep}
                      className="inline-flex items-center gap-2 rounded-full bg-[#6666FF] px-5 py-2 text-sm font-bold text-white shadow-[0_10px_22px_rgba(102,102,255,0.3)] transition hover:bg-[#5555EE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C4C4FF]/70"
                    >
                      {isLastStep ? "Finish guide" : "Next"}
                      {!isLastStep && <ChevronRight className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <aside className="flex flex-col justify-between overflow-hidden rounded-3xl border border-[#D9E2FF] bg-linear-to-br from-[#FFFDF7] via-white to-[#EEF0FF] p-5 shadow-[0_10px_30px_rgba(0,48,110,0.08)]">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFE9A8] text-[#7A4A00] shadow-[0_8px_20px_rgba(255,203,82,0.28)]">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-black text-[#00306E]">
                    Teacher tip
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#00306E]/72">
                    {surface.tip}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-2 rounded-2xl border border-[#D9E2FF] bg-white/80 px-3 py-2 text-xs font-bold text-[#31318A]">
                  <CheckCircle2 className="h-4 w-4 text-[#1E9E59]" />
                  You can reopen this guide anytime.
                </div>
              </aside>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#D9E2FF] bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
              <p className="text-xs font-semibold text-[#00306E]/55">
                This appears once for each main workspace area on this device.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startPageTour}
                  className="inline-flex items-center gap-2 rounded-full border border-[#D9E2FF] bg-[#F8F9FF] px-4 py-2 text-sm font-bold text-[#31318A] transition hover:border-[#6666FF] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C4C4FF]/70"
                >
                  <MousePointerClick className="h-4 w-4" />
                  Start page tour
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-[#D9E2FF] px-4 py-2 text-sm font-bold text-[#31318A] transition hover:border-[#6666FF] hover:bg-[#F8F9FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C4C4FF]/70"
                >
                  Keep open for later
                </button>
                <button
                  type="button"
                  onClick={markSeenAndClose}
                  className="rounded-full bg-[#6666FF] px-5 py-2 text-sm font-bold text-white shadow-[0_10px_22px_rgba(102,102,255,0.3)] transition hover:bg-[#5555EE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C4C4FF]/70"
                >
                  I&apos;m ready
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

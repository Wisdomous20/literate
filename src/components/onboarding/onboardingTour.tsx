"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { getCurrentSurface } from "@/components/onboarding/onboardingGuide";

type TourStep = {
  selector: string;
  title: string;
  body: string;
  next: string;
};

type TourRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const TOUR_VERSION = "v1";

const tourStepsBySurface: Record<string, TourStep[]> = {
  dashboard: [
    {
      selector: '[data-tour-target="school-year-button"]',
      title: "School Year",
      body: "This button switches the dashboard data to another school year when available.",
      next: "After changing the year, the class inventory and summaries update to match it.",
    },
    {
      selector: '[data-tour-target="create-class-button"]',
      title: "Create Class",
      body: "This button opens the class creation form.",
      next: "Create a class first, then add students inside the class view.",
    },
    {
      selector: '[data-tour-target="class-cards"]',
      title: "Class cards",
      body: "Each card represents a class. Clicking a class opens the detailed class view.",
      next: "Inside a class, you can manage students and inspect their assessment history.",
    },
    {
      selector: '[data-tour-target="classification-chart"]',
      title: "Classification chart",
      body: "This summarizes student reading classifications for the selected school year.",
      next: "Use it to spot whether many students are independent, instructional, or frustrated readers.",
    },
    {
      selector: '[data-tour-target="sidebar-assessments"]',
      title: "Assessment shortcuts",
      body: "These sidebar links take you directly to each assessment workflow.",
      next: "Choose Oral Reading, Reading Fluency, or Reading Comprehension when you are ready to assess.",
    },
  ],
  "oral-reading-test": [
    {
      selector: '[data-tour-target="assessment-student-setup"]',
      title: "Student setup",
      body: "Start here by entering or selecting the student, grade level, and class.",
      next: "This makes sure the result is attached to the correct student record.",
    },
    {
      selector: '[data-tour-target="add-passage-button"]',
      title: "Add Passage",
      body: "This opens the passage picker where you choose what the student will read.",
      next: "Once a passage is selected, the reading and recording controls become part of the flow.",
    },
    {
      selector: '[data-tour-target="recording-controls"]',
      title: "Recording controls",
      body: "This area starts the reading recording, shows elapsed time, and later displays playback or retry actions.",
      next: "Record one complete reading before moving to comprehension.",
    },
    {
      selector: '[data-tour-target="assessment-sidebar"]',
      title: "Analysis panel",
      body: "After processing, this side panel shows miscues, scores, and classification details.",
      next: "Review this before exporting or continuing the assessment.",
    },
    {
      selector: '[data-tour-target="assessment-continue-button"]',
      title: "Continue",
      body: "After a valid recording, this button opens the comprehension part of the oral reading assessment.",
      next: "Use it when the recording is ready and the student can answer comprehension questions.",
    },
  ],
  "reading-fluency-test": [
    {
      selector: '[data-tour-target="assessment-student-setup"]',
      title: "Student setup",
      body: "Select the learner, grade level, and class before recording.",
      next: "This keeps the fluency result organized under the right student.",
    },
    {
      selector: '[data-tour-target="add-passage-button"]',
      title: "Add Passage",
      body: "This loads the passage the student will read for fluency analysis.",
      next: "Choose a passage that matches the learner and assessment purpose.",
    },
    {
      selector: '[data-tour-target="recording-controls"]',
      title: "Start Reading",
      body: "This area starts recording and later lets you retry or play back the recording.",
      next: "LiteRate analyzes pace, accuracy, miscues, and fluency level from the recording.",
    },
    {
      selector: '[data-tour-target="assessment-sidebar"]',
      title: "Fluency results",
      body: "The side panel shows the analysis once processing is complete.",
      next: "Use it to review miscues and export the fluency report.",
    },
  ],
  "reading-comprehension-test": [
    {
      selector: '[data-tour-target="assessment-student-setup"]',
      title: "Student setup",
      body: "Choose the student, grade level, and class before starting the test.",
      next: "This ensures the comprehension result is saved to the correct learner.",
    },
    {
      selector: '[data-tour-target="add-passage-button"]',
      title: "Add Passage",
      body: "This opens the passage picker and prepares the linked question set.",
      next: "After choosing a passage, continue when the learner is ready for questions.",
    },
    {
      selector: '[data-tour-target="assessment-workspace"]',
      title: "Question workspace",
      body: "This main area becomes the passage and question-taking space.",
      next: "Students answer here, then submit for scoring and classification.",
    },
    {
      selector: '[data-tour-target="assessment-sidebar"]',
      title: "Breakdown panel",
      body: "After submission, this panel shows comprehension performance and category breakdowns.",
      next: "Use it to see where the student was strongest or needs support.",
    },
  ],
  "class-view": [
    {
      selector: '[data-tour-target="class-header"]',
      title: "Class header",
      body: "This identifies the class and school year you are managing.",
      next: "Use it as your anchor before adding students or reviewing reports.",
    },
    {
      selector: '[data-tour-target="create-student-button"]',
      title: "Create Student",
      body: "This opens the form for adding a learner to this class.",
      next: "Once added, the student appears in the roster and can be assessed.",
    },
    {
      selector: '[data-tour-target="class-search"]',
      title: "Search students",
      body: "Type here to filter the roster by student name.",
      next: "This helps you find one learner quickly in a larger class.",
    },
    {
      selector: '[data-tour-target="assessment-tabs"]',
      title: "Assessment tabs",
      body: "These tabs filter the roster and statistics by assessment type.",
      next: "Use them when you want to focus only on oral reading, fluency, or comprehension evidence.",
    },
    {
      selector: '[data-tour-target="student-table"]',
      title: "Student table",
      body: "This table shows students, recent assessment activity, and row actions.",
      next: "Open a student report from here when you need detailed progress evidence.",
    },
    {
      selector: '[data-tour-target="statistics-sidebar"]',
      title: "Class statistics",
      body: "This sidebar summarizes how the class is performing for the selected filter.",
      next: "Use these counts to plan follow-up assessment or instruction.",
    },
  ],
};

function getTourStorageKey(userId: string, surfaceId: string) {
  return `literater:spotlight-tour:${TOUR_VERSION}:${userId}:${surfaceId}`;
}

function getRectForSelector(selector: string): TourRect | null {
  const target = document.querySelector(selector);
  if (!target) return null;

  const rect = target.getBoundingClientRect();
  return {
    top: Math.max(8, rect.top - 8),
    left: Math.max(8, rect.left - 8),
    width: Math.min(window.innerWidth - 16, rect.width + 16),
    height: Math.min(window.innerHeight - 16, rect.height + 16),
  };
}

function getTooltipPosition(rect: TourRect | null) {
  if (!rect) {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const preferredTop = rect.top + rect.height + 18;
  const top =
    preferredTop + 270 < window.innerHeight
      ? preferredTop
      : Math.max(18, rect.top - 288);

  const left = Math.min(
    Math.max(18, rect.left + rect.width / 2 - 190),
    window.innerWidth - 398,
  );

  return {
    top: `${top}px`,
    left: `${left}px`,
    transform: "none",
  };
}

export function OnboardingTour() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TourRect | null>(null);

  const surface = getCurrentSurface(pathname);
  const userId = session?.user?.id;
  const steps = surface ? (tourStepsBySurface[surface.id] ?? []) : [];
  const safeActiveStepIndex = Math.min(activeStepIndex, steps.length - 1);
  const activeStep = steps[safeActiveStepIndex];

  const tooltipStyle = useMemo(
    () => getTooltipPosition(targetRect),
    [targetRect],
  );

  useEffect(() => {
    const handleRestartTour = () => {
      setActiveStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener(
      "literater:restart-onboarding-tour",
      handleRestartTour,
    );
    return () =>
      window.removeEventListener(
        "literater:restart-onboarding-tour",
        handleRestartTour,
      );
  }, []);

  useEffect(() => {
    if (status === "loading" || !surface || !userId || steps.length === 0) {
      return;
    }

    try {
      if (localStorage.getItem(getTourStorageKey(userId, surface.id))) return;
    } catch {
      return;
    }

    const timer = window.setTimeout(() => {
      setActiveStepIndex(0);
      setIsOpen(true);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [status, surface, steps.length, userId]);

  useEffect(() => {
    if (!isOpen || !activeStep) return;

    let frame = 0;

    const updateRect = () => {
      const target = document.querySelector(activeStep.selector);
      target?.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: "smooth",
      });

      frame = window.requestAnimationFrame(() => {
        setTargetRect(getRectForSelector(activeStep.selector));
      });
    };

    const timer = window.setTimeout(updateRect, 120);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [activeStep, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
      if (event.key === "ArrowRight") {
        setActiveStepIndex((current) => Math.min(steps.length - 1, current + 1));
      }
      if (event.key === "ArrowLeft") {
        setActiveStepIndex((current) => Math.max(0, current - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, steps.length]);

  if (!surface || !userId || steps.length === 0) return null;

  const isFirstStep = safeActiveStepIndex === 0;
  const isLastStep = safeActiveStepIndex === steps.length - 1;

  const closeTour = (completed: boolean) => {
    if (completed) {
      try {
        localStorage.setItem(getTourStorageKey(userId, surface.id), "seen");
      } catch {
        /* localStorage can be unavailable in privacy-restricted contexts. */
      }
    }
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && activeStep && (
        <div className="fixed inset-0 z-[70] pointer-events-none">
          {targetRect ? (
            <>
              <div
                className="absolute left-0 top-0 bg-[#08122B]/62"
                style={{ right: 0, height: targetRect.top }}
              />
              <div
                className="absolute left-0 bg-[#08122B]/62"
                style={{
                  top: targetRect.top,
                  width: targetRect.left,
                  height: targetRect.height,
                }}
              />
              <div
                className="absolute bg-[#08122B]/62"
                style={{
                  top: targetRect.top,
                  left: targetRect.left + targetRect.width,
                  right: 0,
                  height: targetRect.height,
                }}
              />
              <div
                className="absolute left-0 bg-[#08122B]/62"
                style={{ top: targetRect.top + targetRect.height, right: 0, bottom: 0 }}
              />
              <div
                className="absolute rounded-3xl border-2 border-[#FFE174] shadow-[0_0_0_6px_rgba(255,225,116,0.22),0_20px_50px_rgba(0,0,0,0.28)]"
                style={targetRect}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-[#08122B]/62" />
          )}

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-title"
            className="pointer-events-auto fixed w-[380px] max-w-[calc(100vw-36px)] rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-[0_28px_80px_rgba(8,18,43,0.32)]"
            style={tooltipStyle}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#6666FF]">
                  Step {safeActiveStepIndex + 1} of {steps.length}
                </p>
                <h2
                  id="tour-title"
                  className="mt-2 text-xl font-black tracking-[-0.03em] text-[#00306E]"
                >
                  {activeStep.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => closeTour(false)}
                className="rounded-full bg-[#F8F9FF] p-2 text-[#00306E]/65 transition hover:bg-[#EEF0FF] hover:text-[#00306E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C4C4FF]/70"
                aria-label="Close tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-[#F8F9FF] p-4">
              <p className="text-sm leading-6 text-[#00306E]/78">
                {activeStep.body}
              </p>
            </div>

            <div className="mt-3 rounded-2xl border border-[#D7F3E3] bg-[#F3FFF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1E9E59]">
                What happens next
              </p>
              <p className="mt-2 text-sm leading-5 text-[#00306E]/75">
                {activeStep.next}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setActiveStepIndex((current) => Math.max(0, current - 1))
                }
                disabled={isFirstStep}
                className="inline-flex items-center gap-2 rounded-full border border-[#D9E2FF] px-4 py-2 text-sm font-bold text-[#31318A] transition hover:border-[#6666FF] hover:bg-[#F8F9FF] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C4C4FF]/70"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => closeTour(true)}
                  className="rounded-full px-3 py-2 text-sm font-bold text-[#00306E]/55 transition hover:text-[#00306E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C4C4FF]/70"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isLastStep) {
                      closeTour(true);
                      return;
                    }
                    setActiveStepIndex((current) =>
                      Math.min(steps.length - 1, current + 1),
                    );
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#6666FF] px-5 py-2 text-sm font-bold text-white shadow-[0_10px_22px_rgba(102,102,255,0.3)] transition hover:bg-[#5555EE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C4C4FF]/70"
                >
                  {isLastStep ? "Finish" : "Next"}
                  {!isLastStep && <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-1.5">
              {steps.map((step, index) => (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActiveStepIndex(index)}
                  aria-label={`Go to tour step ${index + 1}`}
                  className={`h-1.5 flex-1 rounded-full transition ${
                    index === safeActiveStepIndex
                      ? "bg-[#6666FF]"
                      : "bg-[#D9E2FF] hover:bg-[#C4C4FF]"
                  }`}
                />
              ))}
            </div>
          </section>

          <button
            type="button"
            onClick={() => closeTour(false)}
            className="pointer-events-auto fixed inset-0 -z-10 cursor-default"
            aria-label="Close tour backdrop"
          />
        </div>
      )}
    </>
  );
}

"use client";

import { Sparkles } from "lucide-react";
import type { AssessmentLinkData } from "./types";
import {
  getAssessmentTitle,
  pageShellClass,
  panelClass,
  primaryButtonClass,
  SharedAssessmentHeaderByType,
  surfaceClass,
} from "./ui";

interface IntroStepProps {
  data: AssessmentLinkData;
  timeRemainingText: string;
  onStart: () => void;
  needsRecording: boolean;
  hasQuiz: boolean;
}

export function IntroStep({
  data,
  timeRemainingText,
  onStart,
  needsRecording,
  hasQuiz,
}: IntroStepProps) {
  return (
    <div className={`${pageShellClass} flex min-h-screen flex-col`}>
      <SharedAssessmentHeaderByType
        type={data.type}
        subtitle={`${data.student.name} - ${data.passage.title}`}
        badge="Shared link"
      />

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-8 md:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className={`${surfaceClass} px-6 py-7 md:px-8 md:py-9`}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF1FF]">
                <Sparkles className="h-6 w-6 text-[#5D5DFB]" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#7C84C4]">
                  Ready to begin
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#263168] md:text-[2rem]">
                  Your assessment workspace is set up.
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className={panelClass + " px-4 py-4"}>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7C84C4]">
                  Student
                </p>
                <p className="mt-2 text-base font-semibold text-[#263168]">
                  {data.student.name}
                </p>
              </div>
              <div className={panelClass + " px-4 py-4"}>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7C84C4]">
                  Grade
                </p>
                <p className="mt-2 text-base font-semibold text-[#263168]">
                  {data.student.level ? `Grade ${data.student.level}` : "Not set"}
                </p>
              </div>
              <div className={panelClass + " px-4 py-4"}>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7C84C4]">
                  Link expiry
                </p>
                <p className="mt-2 text-base font-semibold text-[#263168]">
                  {timeRemainingText}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-[#E6E1FF] bg-[#FAF8FF] px-5 py-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8A5DE8]">
                Passage
              </p>
              <h3 className="mt-2 text-lg font-semibold text-[#2A3266]">
                {data.passage.title}
              </h3>
              <p className="mt-2 text-sm text-[#66739B]">
                Grade {data.passage.level} - {getAssessmentTitle(data.type)}
              </p>
            </div>
          </section>

          <aside className={`${surfaceClass} px-6 py-7 md:px-7 md:py-8`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7C84C4]">
              What to expect
            </p>
            <div className="mt-5 space-y-4">
              {needsRecording && (
                <div className={panelClass + " px-4 py-4"}>
                  <p className="text-sm font-semibold text-[#263168]">
                    1. Read aloud
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#66739B]">
                    The passage opens in a focused reading view while your voice
                    is recorded.
                  </p>
                </div>
              )}
              {needsRecording && hasQuiz && (
                <div className={panelClass + " px-4 py-4"}>
                  <p className="text-sm font-semibold text-[#263168]">
                    2. Answer questions
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#66739B]">
                    After reading, continue to the comprehension questions for
                    the same passage.
                  </p>
                </div>
              )}
              {!needsRecording && hasQuiz && (
                <>
                  <div className={panelClass + " px-4 py-4"}>
                    <p className="text-sm font-semibold text-[#263168]">
                      1. Read carefully
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#66739B]">
                      Take your time with the passage before moving into the
                      questions.
                    </p>
                  </div>
                  <div className={panelClass + " px-4 py-4"}>
                    <p className="text-sm font-semibold text-[#263168]">
                      2. Submit your answers
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#66739B]">
                      Review your responses in the same workspace before
                      finishing.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 rounded-3xl border border-[#DCE4FF] bg-white px-4 py-4">
              <p className="text-sm font-medium text-[#4B50E6]">
                Find a quiet space
                {needsRecording && " and make sure your microphone is working"}.
              </p>
            </div>

            <div className="mt-6 flex justify-start">
              <button
                type="button"
                onClick={onStart}
                className={`${primaryButtonClass} w-full sm:w-auto sm:min-w-56`}
              >
                {needsRecording ? "Start Reading" : "Start Assessment"}
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

"use client";

import Image from "next/image";

interface WelcomeSectionProps {
  schoolYear: string;
}

export function WelcomeSection({
  schoolYear,
}: WelcomeSectionProps) {
  return (
    <div className="relative min-h-38 overflow-hidden rounded-2xl border border-[#DED7FF] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8F6FF_48%,#F1F5FF_100%)] shadow-[0_14px_40px_rgba(76,59,171,0.09)] font-poppins md:min-h-45">
      <div className="pointer-events-none absolute left-[-135px] top-[-150px] h-[300px] w-[300px] rounded-full bg-[#CFC6FF]" />
      <div className="pointer-events-none absolute right-[25%] top-[-100px] h-[200px] w-[200px] rounded-full bg-[#FFE1F0]/70 blur-sm" />
      <div className="pointer-events-none absolute bottom-[-160px] right-[-115px] h-[320px] w-[320px] rounded-full bg-[#C8F4FF]/60 blur-md" />

      <div className="relative z-10 min-h-38 px-5 py-5 md:min-h-45 md:px-8 md:py-6 md:pr-[250px] lg:pr-[300px]">
        <div className="max-w-[540px]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6C4EEB]">
            School Year {schoolYear}
          </p>
          <h2 className="text-[1.65rem] font-bold leading-tight tracking-tight text-[#323743] md:text-3xl">
            Reading assessment workspace
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#575E6B] sm:text-base">
            Track classes, assessment progress, and reading insights from one
            focused view.
          </p>
        </div>

        <div className="pointer-events-none absolute right-[-10px] top-1/2 hidden h-[220px] w-[220px] -translate-y-1/2 md:block lg:right-4 lg:h-[250px] lg:w-[250px] xl:right-8">
          <div className="absolute inset-[17%] rounded-full bg-[radial-gradient(circle,#FFFFFF_0%,#EFE9FF_58%,rgba(255,255,255,0)_74%)]" />
          <Image
            src="/assets/IMG_6_5.svg"
            alt="LiteRate Bee Mascot"
            fill
            className="auth-mascot-clean object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}

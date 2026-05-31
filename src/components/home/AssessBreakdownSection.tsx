import Image from "next/image";
import { AnimatedSection, AnimatedList } from "./AnimatedSection";

const tests = [
  {
    id: "oral-reading",
    label: "Oral Reading Test",
    color: "#C41048",
    shadowColor: "#F9A8C0",
    bg: "#FFF0F3",
    icon: "/assets/ORT_1.png",
    tagline: "Miscue analysis & passage scoring",
    measures: [
      "Reading Fluency Test",
      "Reading Comprehension Test",
      "Reading Level Report",
    ],
  },
  {
    id: "oral-fluency",
    label: "Oral Fluency Test",
    color: "#1E7A35",
    shadowColor: "#A7F3C0",
    bg: "#F0FFF4",
    icon: "/assets/RFT_1.png",
    tagline: "Speed & fluency benchmark scoring",
    measures: [
      "Fluency Test Activity",
      "Reading Fluency Report",
    ],
  },
  {
    id: "comprehension",
    label: "Reading Comprehension",
    color: "#1766D6",
    shadowColor: "#93C5FD",
    bg: "#EFF6FF",
    icon: "/assets/RCT_1.png",
    duration: "~8 min / student",
    tagline: "Structured question-based evaluation",
    measures: [
      "Reading Activity",
      "Reading Comprehension Report",
    ],
  },
];

export default function AssessBreakdownSection() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F5F3FF]/30 to-transparent -z-10 pointer-events-none" />

      <div className="px-6 md:px-12">
        <AnimatedSection direction="up" delay={0.05}>
          <div className="mb-10 text-center sm:mb-16">
            <p className="text-[#6C4EEB] text-sm font-semibold uppercase tracking-widest mb-3">
              What We Measure
            </p>
            <h2 className="mb-4 text-3xl font-bold leading-tight text-[#323743] sm:text-4xl lg:text-5xl">
              Three Assessments,
              <br />
              <span className="text-[#6C4EEB]">Complete Picture</span>
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-7 text-[#575E6B] sm:text-lg">
              Each assessment targets a distinct dimension of reading
              performance, mapped exactly to the Phil-IRI framework used by
              DepEd schools nationwide.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedList
          className="flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto px-0 pb-5 [scrollbar-width:none] md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
          itemClassName="w-[calc(100vw-36px)] shrink-0 snap-center md:w-auto md:max-w-none"
          carouselControls
          carouselLabel="assessments"
          staggerDelay={0.12}
          baseDelay={0.1}
        >
          {tests.map((t) => (
            <div key={t.id} className="relative group h-full">
              {/* 3D shadow backing */}
              <div
                className="absolute inset-0 rounded-[14px] translate-y-2 h-full"
                style={{ background: t.color }}
              />

              {/* Card */}
              <div
                className="relative flex h-full flex-col rounded-[14px] border-2 bg-white p-6 shadow-sm transition-transform hover:-translate-y-1 active:translate-y-0 sm:p-8"
                style={{ borderColor: t.color }}
              >
                {/* Icon */}
                <div
                  className="w-full rounded-[10px] flex items-center justify-center py-6 mb-6 group-hover:scale-105 transition-transform duration-300"
                  style={{ background: t.bg }}
                >
                  <Image
                    src={t.icon}
                    alt={t.label}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-contain"
                  />
                </div>

                {/* Name & tagline */}
                <h3
                  className="text-xl font-bold mb-1"
                  style={{ color: t.color }}
                >
                  {t.label}
                </h3>
                <p className="text-sm text-[#575E6B] mb-6">{t.tagline}</p>

                {/* Divider */}
                <div className="h-px mb-6" style={{ background: t.color + "22" }} />

                {/* Measures checklist */}
                <ul className="space-y-3 flex-1">
                  {t.measures.map((m) => (
                    <li key={m} className="flex items-start gap-3">
                      <Image
                        src="/assets/IMG_29.svg"
                        alt="check"
                        width={18}
                        height={18}
                        className="w-4.5 h-4.5 shrink-0 mt-0.5"
                      />
                      <span className="text-sm text-[#323743] leading-snug">{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </AnimatedList>
      </div>
    </section>
  );
}

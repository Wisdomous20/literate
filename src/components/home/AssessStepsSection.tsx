import Image from "next/image";
import { AnimatedSection, AnimatedList } from "./AnimatedSection";

const steps = [
  {
    step: "Step 01",
    title: "Select Assessment Type",
    desc: "Choose from Oral Reading, Oral Fluency, or Reading Comprehension — then pick the student and the correct Phil-IRI grade-level passage.",
    color: "#575E6B",
    highlight: false,
    icon: "/assets/IMG_14.png",
    iconClass: "w-20 h-20",
  },
  {
    step: "Step 02",
    title: "Record the Student",
    desc: "Tap Record and let the student read aloud. LiteRate captures the audio and begins analysis in real time — no manual note-taking needed.",
    color: "#6C4EEB",
    highlight: true,
    icon: "/assets/IMG_16.png",
    iconClass: "w-20 h-20",
  },
  {
    step: "Step 03",
    title: "Instant Smart Analysis",
    desc: "Our engine detects every miscue, calculates fluency scores, and evaluates comprehension responses — all scored against the official DepEd rubric.",
    color: "#575E6B",
    highlight: false,
    icon: "/assets/IMG_15.png",
    iconClass: "w-24 h-20",
  },
  {
    step: "Step 04",
    title: "View Report & Intervene",
    desc: "Access detailed reading profiles instantly. Share reports with parents, track progress over time, and get personalised intervention suggestions.",
    color: "#575E6B",
    highlight: false,
    icon: "/assets/IMG_14.png",
    iconClass: "w-20 h-20",
  },
];

export default function AssessStepsSection() {
  return (
    <section className="relative scroll-mt-28 py-16 sm:scroll-mt-32 sm:py-24 lg:pb-[20vh]">
      {/* Decorative mascot top-left — same as HowItWorks */}
      <div className="absolute -top-16 left-0 -z-10 hidden lg:block">
        <Image
          src="/assets/IMG_12.png"
          alt=""
          width={549}
          height={315}
          className="w-[549px] transition-transform duration-300 hover:scale-110 scale-x-[-1]"
        />
      </div>

      {/* Full-bleed background wave */}
      <div className="absolute inset-0 -z-20 hidden opacity-[0.82] sm:block">
        <Image
          src="/assets/IMG_13.png"
          alt=""
          fill
          className="object-cover"
        />
      </div>

      <AnimatedSection direction="up" delay={0.05}>
        <div className="mb-10 flex justify-center px-6 text-center sm:mb-16 md:px-12 lg:-mt-8">
          <div className="text-center">
            <p className="text-[#6C4EEB] text-sm font-semibold uppercase tracking-widest mb-3">
              The Process
            </p>
            <h2 className="mb-4 text-3xl font-bold uppercase leading-tight tracking-[0.08em] sm:text-4xl md:text-5xl md:tracking-[6px]">
              How to Run an{" "}
              <span className="text-[#6C4EEB]">Assessment</span>
            </h2>
            <p className="mx-auto max-w-xl text-base leading-7 text-[#575E6B] sm:text-lg">
              From launch to report in under 10 minutes — here&apos;s the end-to-end
              flow every teacher follows.
            </p>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedList
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-5 [scrollbar-width:none] md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-12 md:pb-0 lg:grid-cols-4 lg:gap-8 [&::-webkit-scrollbar]:hidden"
        itemClassName="w-[calc(100vw-36px)] shrink-0 snap-center md:w-auto md:max-w-none"
        carouselControls
        carouselLabel="steps"
        staggerDelay={0.12}
        baseDelay={0.1}
      >
        {steps.map((s) => (
          <div key={s.step} className="relative group">
            {/* 3D backing */}
            <div className="absolute inset-0 bg-[#6C4EEB] rounded-[16px] translate-y-2" />

            {/* Card */}
            <div
                className={`relative h-full rounded-[14px] border-2 border-[#6C4EEB] bg-white p-6 transition-transform hover:-translate-y-1 active:translate-y-0 sm:p-8 ${
                s.highlight ? "shadow-2xl" : "shadow-lg"
              }`}
            >
              <Image
                src={s.icon}
                alt={s.title}
                width={80}
                height={80}
                className={`${s.iconClass} mb-6 object-contain group-hover:scale-110 transition-transform duration-300`}
              />

              <span
                className="text-[10px] font-black tracking-widest uppercase block mb-2"
                style={{ color: s.color }}
              >
                {s.step}
              </span>
              <h3 className="text-xl font-bold text-[#16181D] mb-4">
                {s.title}
              </h3>
              <p className="text-sm text-[#575E6B] leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </AnimatedList>
    </section>
  );
}

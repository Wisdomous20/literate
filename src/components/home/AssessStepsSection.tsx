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
    <section className="pt-24 pb-[20vh] relative">
      {/* Decorative mascot top-left — same as HowItWorks */}
      <div className="absolute -top-16 left-0 -z-10">
        <Image
          src="/assets/IMG_12.png"
          alt=""
          width={549}
          height={315}
          className="w-[549px] transition-transform duration-300 hover:scale-110 scale-x-[-1]"
        />
      </div>

      {/* Full-bleed background wave */}
      <div className="absolute inset-0 -z-20 opacity-[0.82]">
        <Image
          src="/assets/IMG_13.png"
          alt=""
          fill
          className="object-cover"
        />
      </div>

      <AnimatedSection direction="up" delay={0.05}>
        <div className="px-6 md:px-12 mb-16 flex justify-center -mt-8">
          <div className="text-center">
            <p className="text-[#6C4EEB] text-sm font-semibold uppercase tracking-widest mb-3">
              The Process
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-[6px] uppercase mb-4">
              How to Run an{" "}
              <span className="text-[#6C4EEB]">Assessment</span>
            </h2>
            <p className="text-[#575E6B] text-lg max-w-xl mx-auto">
              From launch to report in under 10 minutes — here&apos;s the end-to-end
              flow every teacher follows.
            </p>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedList
        className="px-6 md:px-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
        staggerDelay={0.12}
        baseDelay={0.1}
      >
        {steps.map((s) => (
          <div key={s.step} className="relative group">
            {/* 3D backing */}
            <div className="absolute inset-0 bg-[#6C4EEB] rounded-[16px] translate-y-2" />

            {/* Card */}
            <div
              className={`relative bg-white border-2 border-[#6C4EEB] rounded-[14px] p-8 h-full transition-transform hover:-translate-y-1 active:translate-y-0 ${
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

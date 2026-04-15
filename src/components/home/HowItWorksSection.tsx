import Image from "next/image";
import { AnimatedSection, AnimatedList } from "./AnimatedSection";

const steps = [
  {
    step: "Step 01",
    title: "Conduct Assessment",
    desc: "Open the app and record the student reading a Phil-IRI passage aloud.",
    color: "#575E6B",
    highlight: false,
    icon: "/assets/IMG_14.png",
    iconClass: "w-20 h-20",
  },
  {
    step: "Step 02",
    title: "Smart Analysis",
    desc: "Our engine detects miscues, speed, and comprehension in under 60 seconds.",
    color: "#6C4EEB",
    highlight: true,
    icon: "/assets/IMG_16.png",
    iconClass: "w-20 h-20",
  },
  {
    step: "Step 03",
    title: "Take Action",
    desc: "Get instant profiles and personalized intervention tips for each student.",
    color: "#575E6B",
    highlight: false,
    icon: "/assets/IMG_15.png",
    iconClass: "w-24 h-20",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="pt-24 pb-[20vh] relative">
      {/* Decorative mascot top-left */}
      <div className="absolute -top-16 left-0 -z-10">
        <Image
          src="/assets/IMG_12.png"
          alt=""
          width={549}
          height={315}
          className="w-[549px] transition-transform duration-300 hover:scale-110"
        />
      </div>
      {/* Background wave */}
      <div className="absolute inset-0 -z-20 opacity-[0.82]">
        <Image
          src="/assets/IMG_13.png"
          alt=""
          fill
          className="object-cover"
        />
      </div>

      <AnimatedSection direction="up" delay={0.05}>
        <div className="px-6 md:px-12 mb-16 flex justify-end -mt-16">
          <div className="text-center mr-[10%]">
            <h2 className="text-4xl md:text-5xl font-bold tracking-[10px] uppercase mb-4">
              How <span className="text-[#6C4EEB]">LiteRate</span> Works?
            </h2>
            <p className="text-[#6C4EEB] text-xl font-[Outfit]">
              Simple. Fast. Aligned.
            </p>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedList className="px-6 md:px-12 grid md:grid-cols-3 gap-8" staggerDelay={0.15} baseDelay={0.1}>
        {steps.map((s) => (
          <div key={s.step} className="relative group">
            <div className="absolute inset-0 bg-[#6C4EEB] rounded-[16px] translate-y-2" />
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
              <p className="text-sm text-[#575E6B] leading-relaxed">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </AnimatedList>
    </section>
  );
}

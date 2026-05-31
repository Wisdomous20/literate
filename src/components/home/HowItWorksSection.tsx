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
    iconClass: "w-24 h-auto",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="relative scroll-mt-28 py-16 sm:scroll-mt-32 sm:py-24 lg:pb-[20vh] lg:pt-24">
      {/* Decorative mascot top-left */}
      <div className="absolute -top-16 left-0 -z-10 hidden lg:block">
        <Image
          src="/assets/IMG_12.png"
          alt=""
          width={549}
          height={315}
          className="w-[360px] transition-transform duration-300 hover:scale-110 sm:w-[549px]"
        />
      </div>
      {/* Background wave */}
      <div className="absolute inset-0 -z-20 hidden translate-y-[10%] opacity-[0.82] sm:block">
        <Image
          src="/assets/IMG_13_2.svg"
          alt=""
          fill
          className="object-cover"
        />
      </div>

      <AnimatedSection direction="up" delay={0.05}>
        <div className="mb-10 px-6 text-center md:px-12 lg:mb-16 lg:-mt-16 lg:flex lg:justify-end">
          <div className="lg:mr-[10%]">
            <h2 className="mb-3 text-3xl font-bold uppercase leading-tight tracking-[0.08em] sm:text-4xl md:text-5xl lg:mb-4 lg:tracking-[10px]">
              How <span className="text-[#6C4EEB]">LiteRate</span> Works?
            </h2>
            <p className="text-lg text-[#6C4EEB] font-[Outfit] sm:text-xl">
              Simple. Fast. Aligned.
            </p>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedList
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-5 [scrollbar-width:none] md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-12 md:pb-0 [&::-webkit-scrollbar]:hidden"
        itemClassName="w-[calc(100vw-36px)] shrink-0 snap-center md:w-auto md:max-w-none"
        carouselControls
        carouselLabel="steps"
        staggerDelay={0.15}
        baseDelay={0.1}
      >
        {steps.map((s) => (
          <div key={s.step} className="relative group">
            <div className="absolute inset-0 bg-[#6C4EEB] rounded-[16px] translate-y-2" />
            <div
              className={`relative bg-white border-2 border-[#6C4EEB] rounded-[14px] p-6 sm:p-8 h-full transition-transform hover:-translate-y-1 active:translate-y-0 ${
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

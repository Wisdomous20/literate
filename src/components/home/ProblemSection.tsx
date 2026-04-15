import Image from "next/image";
import { AnimatedSection, AnimatedList } from "./AnimatedSection";

export default function ProblemSection() {
  return (
    <section className="py-36 -mt-[15vh] relative">
      {/* Subtle alternating bg tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F5F3FF]/60 to-transparent -z-10 pointer-events-none" />

      <div className="px-6 md:px-12 grid lg:grid-cols-2 gap-16 items-center">
        <AnimatedSection direction="left">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            The Burden of{" "}
            <span className="text-[#6C4EEB]">Manual</span> Reading Assessment
          </h2>

          <p className="text-[#575E6B] text-lg leading-relaxed mb-12 max-w-xl">
            For decades, educators have spent thousands of hours manually
            scoring Phil-IRI reading tests. This delay in data leads to delayed
            intervention for students who need it most.
          </p>

          <AnimatedList className="grid grid-cols-1 sm:grid-cols-3 gap-8" staggerDelay={0.12} baseDelay={0.2}>
            {[
              { src: "/assets/IMG_9.png", alt: "Time Consuming", label: "Time-Consuming", desc: "Hours of recording & grading." },
              { src: "/assets/IMG_10.png", alt: "Human Error", label: "Human Error", desc: "Subjective scoring variances." },
              { src: "/assets/IMG_11.png", alt: "Delayed Action", label: "Delayed Action", desc: "Results take weeks to process." },
            ].map((item) => (
              <div key={item.label} className="space-y-4">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={64}
                  height={64}
                  className="h-16 object-contain hover:scale-110 transition-transform duration-300"
                />
                <h4 className="font-bold text-base text-[#16181D]">{item.label}</h4>
                <p className="text-sm text-[#575E6B]">{item.desc}</p>
              </div>
            ))}
          </AnimatedList>
        </AnimatedSection>

        <AnimatedSection direction="right" delay={0.15}>
          <div className="relative group">
            <Image
              src="/assets/IMG_8.png"
              alt="Manual Assessment Illustration"
              width={737}
              height={459}
              className="w-full rounded-2xl group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

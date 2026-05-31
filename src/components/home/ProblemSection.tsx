import Image from "next/image";
import { AnimatedSection, AnimatedList } from "./AnimatedSection";

export default function ProblemSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 lg:-mt-[15vh] lg:overflow-visible lg:py-36">

      <div className="grid items-center gap-12 px-6 md:px-12 lg:grid-cols-2 lg:gap-16">
        <AnimatedSection direction="left">
          <h2 className="mb-5 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            The Burden of{" "}
            <span className="text-[#6C4EEB]">Manual</span> Reading Assessment
          </h2>

          <p className="mb-8 max-w-xl text-base leading-7 text-[#575E6B] sm:text-lg sm:leading-relaxed lg:mb-12">
            For decades, educators have spent thousands of hours manually
            scoring Phil-IRI reading tests. This delay in data leads to delayed
            intervention for students who need it most.
          </p>

          <AnimatedList className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8" staggerDelay={0.12} baseDelay={0.2}>
            {[
              { src: "/assets/IMG_9.png", alt: "Time Consuming", label: "Time-Consuming", desc: "Hours of recording & grading." },
              { src: "/assets/IMG_10.png", alt: "Human Error", label: "Human Error", desc: "Subjective scoring variances." },
              { src: "/assets/IMG_11.png", alt: "Delayed Action", label: "Delayed Action", desc: "Results take weeks to process." },
            ].map((item) => (
              <div key={item.label} className="flex gap-4 sm:block sm:space-y-4">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={64}
                  height={64}
                  className="h-14 w-14 shrink-0 object-contain transition-transform duration-300 hover:scale-110 sm:h-16 sm:w-auto"
                />
                <div>
                  <h4 className="font-bold text-base text-[#16181D]">{item.label}</h4>
                  <p className="text-sm text-[#575E6B]">{item.desc}</p>
                </div>
              </div>
            ))}
          </AnimatedList>
        </AnimatedSection>

        <AnimatedSection direction="right" delay={0.15}>
          <div className="relative group mx-auto max-w-[320px] sm:max-w-xl lg:max-w-none">
            {/* IMG_40 sits below, IMG_8_1 overlaps it from the top */}
            <Image
              src="/assets/IMG_40.svg"
              alt=""
              width={737}
              height={459}
              className="w-full"
            />
            <Image
              src="/assets/IMG_8_1.svg"
              alt="Manual Assessment Illustration"
              width={737}
              height={459}
              className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 rounded-2xl transition-transform duration-300 group-hover:scale-105 sm:scale-[1.12] sm:group-hover:scale-[1.16] lg:scale-[1.3] lg:group-hover:scale-[1.35]"
            />
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

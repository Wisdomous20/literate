import Image from "next/image";
import { AnimatedSection } from "./AnimatedSection";

const benefits = [
  "Aims to reduce workload and time in reading assessments",
  "Ensure reading assessment objectivity",
  "Adheres to DepEd Phil-IRI Rubric Standards",
];

export default function BenefitsSection() {
  return (
    <section className="py-24 bg-[#ffffff]/20 relative overflow-hidden">
      {/* Decorative image top-right */}
      <Image
        src="/assets/IMG_24.png"
        alt=""
        width={600}
        height={600}
        className="absolute right-0 top-0 -z-10 w-[600px] opacity-30 hover:opacity-60 hover:scale-105 transition-all duration-300"
      />

      <div className="px-6 md:px-12 grid lg:grid-cols-2 gap-16 items-center">
        <AnimatedSection direction="left">
          <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-12">
            Less Time on reading assessment,
            <br />
            More Time on{" "}
            <span className="text-[#5332E8] font-[Inter]">Growth</span>.
          </h2>

          <ul className="space-y-8">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-4">
                <Image
                  src="/assets/IMG_29.svg"
                  alt="Check"
                  width={24}
                  height={24}
                  className="w-6 h-6 shrink-0"
                />
                <span className="text-lg font-bold">{b}</span>
              </li>
            ))}
          </ul>
        </AnimatedSection>

        {/* Right side: mascot + testimonials */}
        <AnimatedSection direction="right" delay={0.15}>
        <div className="relative group">
          <Image
            src="/assets/IMG_25.png"
            alt="Mascot with Badges"
            width={600}
            height={600}
            className="w-full group-hover:scale-105 transition-transform duration-300"
          />

          {/* Testimonial Card 1 - top right */}
          <div className="absolute -top-10 -right-10 z-10 w-80">
            <div className="absolute inset-0 bg-[#B3A4F1] rounded-[10px] translate-y-2" />
            <div className="relative bg-white p-6 rounded-[12px] shadow-xl hover:-translate-y-1 transition-transform active:translate-y-0">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Image key={i} src="/assets/IMG_27.svg" alt="Star" width={12} height={12} className="w-3 h-3" />
                  ))}
                </div>
                <span className="bg-[#1766D6] text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <Image src="/assets/IMG_26.svg" alt="Check" width={12} height={12} className="w-3 h-3" />
                  Pilot Approved
                </span>
              </div>
              <p className="text-sm italic text-[#575E6B] mb-6">
                &quot;LiteRate changed how we look at reading scores. No more guessing.&quot;
              </p>
              <div className="flex items-center gap-3 border-t pt-4">
                <div className="w-10 h-10 bg-[#FDF5DE] rounded-full" />
                <div>
                  <h4 className="text-xs font-bold">Principal Maria Clara</h4>
                  <p className="text-[10px] text-[#575E6B]">Rizal Elementary</p>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial Card 2 - bottom left */}
          <div className="absolute -bottom-10 -left-10 z-10 w-80">
            <div className="absolute inset-0 bg-[#B3A4F1] rounded-[10px] translate-y-2" />
            <div className="relative bg-white p-6 rounded-[12px] shadow-xl hover:-translate-y-1 transition-transform active:translate-y-0">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Image key={i} src="/assets/IMG_27.svg" alt="Star" width={12} height={12} className="w-3 h-3" />
                  ))}
                </div>
                <span className="bg-[#1766D6] text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <Image src="/assets/IMG_26.svg" alt="Check" width={12} height={12} className="w-3 h-3" />
                  Pilot Approved
                </span>
              </div>
              <p className="text-sm italic text-[#575E6B] mb-6">
                &quot;My students actually ask to be assessed now because of the badges!&quot;
              </p>
              <div className="flex items-center gap-3 border-t pt-4">
                <div className="w-10 h-10 bg-[#FDF5DE] rounded-full" />
                <div>
                  <h4 className="text-xs font-bold">Teacher Ben Cruz</h4>
                  <p className="text-[10px] text-[#575E6B]">Quezon High</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

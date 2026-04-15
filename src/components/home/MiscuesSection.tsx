"use client";

import Image from "next/image";
import { AnimatedSection, AnimatedList } from "./AnimatedSection";

const miscues = [
  {
    name: "Omission",
    color: "#4B3BA3",
    borderColor: "#4B3BA3",
    description:
      "The reader leaves out a word, phrase, or sentence present in the printed text, skipping over it entirely while reading aloud.",
  },
  {
    name: "Mispronunciation",
    color: "#C41048",
    borderColor: "#C41048",
    description:
      "The reader says a word incorrectly, altering its standard pronunciation from what is printed in the text.",
  },
  {
    name: "Substitution",
    color: "#1A5FB4",
    borderColor: "#1A5FB4",
    description:
      "The reader replaces a printed word with a different word, which may be semantically similar or entirely unrelated to the original.",
  },
  {
    name: "Transposition",
    color: "#8B008B",
    borderColor: "#8B008B",
    description:
      "The reader swaps the position of two or more words in a sentence, altering the intended word order of the printed text.",
  },
  {
    name: "Reversal",
    color: "#6E4023",
    borderColor: "#6E4023",
    description:
      "The reader inverts the order of letters or words, such as reading 'was' as 'saw', reversing the printed form of the word.",
  },
  {
    name: "Insertion",
    color: "#1E7A35",
    borderColor: "#1E7A35",
    description:
      "The reader adds a spoken word or phrase into the text that is not actually printed on the page, often due to predicting ahead.",
  },
  {
    name: "Repetition",
    color: "#B85C00",
    borderColor: "#B85C00",
    description:
      "The reader repeats a word, phrase, or part of a sentence already read, going back over text that was already spoken aloud.",
  },
  {
    name: "Self-Correction",
    color: "#8A6D00",
    borderColor: "#8A6D00",
    description:
      "The reader initially makes an error but then independently corrects it without any prompting or assistance from the teacher.",
  },
];

export default function MiscuesSection() {

  return (
    <section className="py-24 relative overflow-hidden">
      {/* IMG_7 flipped, leftmost */}
      <div className="absolute top-0 left-0 -z-10 pointer-events-none">
        <Image
          src="/assets/IMG_7.png"
          alt=""
          width={840}
          height={840}
          className="w-[840px] opacity-90 scale-x-[-1]"
        />
      </div>
      {/* IMG_22 flipped, leftmost */}
      <div className="absolute top-0 -left-12 -z-10 pointer-events-none transition-transform duration-300 hover:scale-105">
        <Image
          src="/assets/IMG_22.png"
          alt=""
          width={720}
          height={720}
          className="w-[720px] opacity-100 scale-x-[-1]"
        />
      </div>

      {/* Header: text right-aligned */}
      <AnimatedSection direction="up" delay={0.05}>
        <div className="pl-[26%] pr-6 md:pr-12 text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-8 tracking-[5px] leading-[50px] text-[#6C4EEB] translate-x-16">
            Beyond Speed: Analyzing
            Oral Reading Miscues
          </h2>
          <p className="text-[#323743] text-lg leading-relaxed">
            We track the 8 critical reading miscues defined by Phil-IRI, giving
            you a deep qualitative understanding of student struggles.
          </p>
        </div>
      </AnimatedSection>

      {/* 4×2 compact grid — all 8 miscues visible */}
      <AnimatedList className="px-6 md:px-12 grid grid-cols-2 lg:grid-cols-4 gap-5" staggerDelay={0.08} baseDelay={0.05}>
        {miscues.map((m) => (
          <div key={m.name} className="relative group">
            <div
              className="absolute inset-0 rounded-[10px] translate-y-2"
              style={{ background: m.color }}
            />
            <div
              className="relative bg-white rounded-[10px] p-5 h-full transition-transform hover:-translate-y-1 active:translate-y-0"
              style={{ border: `2px solid ${m.borderColor}` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white font-black text-lg shadow-inner"
                  style={{ background: m.color }}
                >
                  {m.name[0]}
                </div>
                <h3
                  className="text-base font-bold leading-tight"
                  style={{ color: m.color }}
                >
                  {m.name}
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-[#575E6B]">
                {m.description}
              </p>
            </div>
          </div>
        ))}
      </AnimatedList>
    </section>
  );
}

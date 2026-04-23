"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const SECTIONS = [
  { id: "hero", label: "Home" },
  { id: "problem", label: "Problem" },
  { id: "how-it-works", label: "How It Works" },
  { id: "reading-levels", label: "Reading Levels" },
  { id: "miscues", label: "Miscues" },
  { id: "benefits", label: "Benefits" },
  { id: "cta", label: "Get Started" },
];

export default function DotNav() {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { threshold: 0.35 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="fixed right-5 top-1/2 -translate-y-1/2 z-50 flex-col gap-3 hidden lg:flex">
      {SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => scrollTo(id)}
          title={label}
          className="group relative flex items-center justify-end gap-2"
        >
          <span className="absolute right-5 bg-[#16181D]/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {label}
          </span>
          <motion.div
            animate={{
              scale: active === id ? 1.6 : 1,
              backgroundColor: active === id ? "#6C4EEB" : "#C4C7CF",
            }}
            className="w-2 h-2 rounded-full"
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
        </button>
      ))}
    </div>
  );
}

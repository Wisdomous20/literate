"use client";

import { useRef, Children, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "fade";
}

export function AnimatedSection({
  children,
  className,
  delay = 0,
  direction = "up",
}: AnimatedSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 40 : 0,
      x: direction === "left" ? -40 : direction === "right" ? 40 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        delay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  carouselControls?: boolean;
  carouselControlsClassName?: string;
  carouselLabel?: string;
  staggerDelay?: number;
  baseDelay?: number;
}

export function AnimatedList({
  children,
  className,
  itemClassName,
  carouselControls = false,
  carouselControlsClassName = "md:hidden",
  carouselLabel = "Cards",
  staggerDelay = 0.1,
  baseDelay = 0,
}: AnimatedListProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const childArray = Children.toArray(children);

  const scrollCarousel = (direction: "previous" | "next") => {
    const node = ref.current;
    if (!node) return;

    node.scrollBy({
      left: (direction === "next" ? 1 : -1) * node.clientWidth * 0.82,
      behavior: "smooth",
    });
  };

  return (
    <>
      {carouselControls && (
        <div
          className={`mb-4 flex items-center justify-between gap-3 px-6 ${carouselControlsClassName}`}
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C4EEB]">
            Swipe {carouselLabel}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollCarousel("previous")}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border-2 border-[#6C4EEB] bg-white text-lg font-black text-[#6C4EEB] shadow-sm transition-transform active:scale-95"
              aria-label={`Previous ${carouselLabel}`}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel("next")}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border-2 border-[#6C4EEB] bg-[#6C4EEB] text-lg font-black text-white shadow-sm transition-transform active:scale-95"
              aria-label={`Next ${carouselLabel}`}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      )}
      <div ref={ref} className={className}>
        {childArray.map((child, i) => (
          <motion.div
            key={i}
            className={itemClassName}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
              delay: baseDelay + i * staggerDelay,
            }}
          >
            {child}
          </motion.div>
        ))}
      </div>
    </>
  );
}

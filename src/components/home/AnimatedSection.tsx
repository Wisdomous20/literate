"use client";

import { Children, type ReactNode, useRef, useState } from "react";
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
  const [activeIndex, setActiveIndex] = useState(0);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const childArray = Children.toArray(children);

  const updateActiveIndex = () => {
    const node = ref.current;
    if (!node || childArray.length === 0) return;

    const itemWidth = node.scrollWidth / childArray.length;
    setActiveIndex(Math.min(childArray.length - 1, Math.round(node.scrollLeft / itemWidth)));
  };

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
          className={`mb-4 flex items-center justify-between gap-3 px-5 ${carouselControlsClassName}`}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6C4EEB]">
              Swipe {carouselLabel}
            </p>
            <p className="mt-1 text-xs font-medium text-[#575E6B]">
              {activeIndex + 1} of {childArray.length}
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-[#E4DFFF] bg-[#F8F6FF] p-1 shadow-[0_10px_24px_rgba(108,78,235,0.1)]">
            <button
              type="button"
              onClick={() => scrollCarousel("previous")}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full bg-white text-lg font-bold text-[#6C4EEB] shadow-[0_2px_8px_rgba(108,78,235,0.12)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95"
              aria-label={`Previous ${carouselLabel}`}
            >
              <span aria-hidden="true">&lt;</span>
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel("next")}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full bg-[#6C4EEB] text-lg font-bold text-white shadow-[0_6px_14px_rgba(108,78,235,0.24)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95"
              aria-label={`Next ${carouselLabel}`}
            >
              <span aria-hidden="true">&gt;</span>
            </button>
          </div>
        </div>
      )}
      <div ref={ref} className={className} onScroll={updateActiveIndex}>
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

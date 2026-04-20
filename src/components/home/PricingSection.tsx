"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatedSection } from "./AnimatedSection";
import { motion } from "framer-motion";

const plans = [
  {
    name: "LIBRE",
    tagline: "Get started for free",
    price: "Free",
    period: "",
    inclusions: ["1 assessment per day"],
    highlight: false,
    cta: "Start Free",
    users: "",
  },
  {
    name: "SOLO",
    tagline: "For individual educators",
    price: "₱1,200",
    period: "/school year",
    inclusions: [
      "Complete access and unlimited usage",
      "Single user",
    ],
    highlight: false,
    cta: "Get Started",
    users: "1 user",
  },
  {
    name: "KASALO",
    tagline: "For small teams",
    price: "₱12,000",
    period: "/school year",
    inclusions: [
      "Complete access and unlimited usage",
      "10 users included",
    ],
    highlight: true,
    cta: "Get Started",
    users: "10 users",
  },
  {
    name: "PANALO",
    tagline: "For growing schools",
    price: "₱24,000",
    period: "/school year",
    inclusions: [
      "Complete access and unlimited usage",
      "20 users included",
    ],
    highlight: false,
    cta: "Get Started",
    users: "20 users",
  },
  {
    name: "KAPAMILYA",
    tagline: "For large organizations",
    price: "₱1,100",
    period: "per user/school year",
    inclusions: [
      "Complete access and unlimited usage",
      "20+ users",
      "Volume pricing",
    ],
    highlight: false,
    cta: "Contact Us",
    users: "20+ users",
  },
];

export default function PricingSection() {
  return (
    <section className="py-24 px-6 md:px-12 relative overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-[#6C4EEB]/10 via-[#eb4cb6]/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      <AnimatedSection direction="up">
        <div className="text-center mb-16">
          <p className="text-[#6C4EEB] text-sm font-semibold uppercase tracking-widest mb-4">
            Pricing
          </p>
          <h2 className="text-4xl lg:text-5xl font-bold text-[#323743] leading-tight mb-6">
            Plans that grow with{" "}
            <span className="text-[#6C4EEB] italic font-[Inter]">you</span>.
          </h2>
          <p className="text-[#575E6B] text-lg max-w-2xl mx-auto">
            Whether you&apos;re a single teacher or a whole school district,
            there&apos;s a plan that fits your mission.
          </p>
        </div>
      </AnimatedSection>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto items-stretch">
        {plans.map((plan, i) => (
          <AnimatedSection key={plan.name} direction="up" delay={i * 0.08}>
            <div
              className={`relative h-full group ${
                plan.highlight ? "lg:-translate-y-4" : ""
              }`}
            >
              {/* 3D backing */}
              <div
                className={`absolute inset-0 rounded-[16px] translate-y-2 ${
                  plan.highlight ? "bg-[#B3A4F1]" : "bg-[#E0E2E6]"
                }`}
              />

              <div
                className={`relative h-full flex flex-col rounded-[16px] p-6 transition-transform hover:-translate-y-1 active:translate-y-0 ${
                  plan.highlight
                    ? "bg-[#6C4EEB] text-white border-2 border-[#6C4EEB]"
                    : "bg-white border border-[#E0E2E6]"
                }`}
              >
                {/* Popular badge */}
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#FF5DA2] text-white text-xs font-bold px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan name & tagline */}
                <div className="mb-6">
                  <h3
                    className={`font-[Outfit] text-lg font-bold tracking-wide mb-1 ${
                      plan.highlight ? "text-white" : "text-[#6C4EEB]"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-xs ${
                      plan.highlight ? "text-white/70" : "text-[#575E6B]"
                    }`}
                  >
                    {plan.tagline}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-3xl font-extrabold leading-none">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span
                      className={`text-sm ml-1 ${
                        plan.highlight ? "text-white/70" : "text-[#575E6B]"
                      }`}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>

                {/* Divider */}
                <div
                  className={`w-full h-px mb-6 ${
                    plan.highlight ? "bg-white/20" : "bg-[#E0E2E6]"
                  }`}
                />

                {/* Inclusions */}
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.inclusions.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <svg
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          plan.highlight ? "text-white" : "text-[#6C4EEB]"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span
                        className={
                          plan.highlight ? "text-white/90" : "text-[#323743]"
                        }
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <div className="relative mt-auto">
                  <div
                    className={`absolute inset-0 rounded-[10px] translate-y-1 ${
                      plan.highlight ? "bg-white/30" : "bg-[#B3A4F1]"
                    }`}
                  />
                  <Link
                    href={plan.name === "KAPAMILYA" ? "#" : "/signup"}
                    className={`relative block text-center font-medium text-sm px-4 py-3 rounded-[10px] transition-transform hover:-translate-y-0.5 active:translate-y-0 ${
                      plan.highlight
                        ? "bg-white text-[#6C4EEB] border border-white"
                        : "bg-[#6C4EEB] text-white border border-[#6C4EEB]"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}

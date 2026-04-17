"use client";

import { useState } from "react";
import { Check, Loader2, AlertCircle, X } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import { subscribeAction } from "@/app/actions/subscription/subscribe";
import { PlanKey } from "@/config/plans";

interface Plan {
  id: string;
  planKey: PlanKey;
  name: string;
  tagline: string;
  price: string;
  priceNote: string;
  features: string[];
  requiresMemberCount?: boolean;
}

const PAMILYA_MIN_MEMBERS = 20;

const PLANS: Plan[] = [
  {
    id: "solo",
    planKey: "SOLO",
    name: "SOLO",
    tagline: "Solo package for you only",
    price: "₱1,200",
    priceNote: "/ school year",
    features: ["Complete access", "Single User", "Unlimited assessments"],
  },
  {
    id: "kasalo",
    planKey: "KASALO",
    name: "KASALO",
    tagline: "For small institutions",
    price: "₱12,000",
    priceNote: "/ school year",
    features: [
      "Complete access",
      "Up to 10 users",
      "Unlimited assessments",
      "Team collaboration",
    ],
  },
  {
    id: "panalo",
    planKey: "PANALO",
    name: "PANALO",
    tagline: "For growing institutions",
    price: "₱24,000",
    priceNote: "/ school year",
    features: [
      "Complete access",
      "Up to 20 users",
      "Unlimited assessments",
      "Team collaboration",
    ],
  },
  {
    id: "kapamilya",
    planKey: "PAMILYA",
    name: "KAPAMILYA",
    tagline: "For large institutions",
    price: "₱1,100",
    priceNote: "per user / school year",
    features: [
      "Complete access",
      "20+ Users",
      "Unlimited assessments",
      "Team collaboration",
    ],
    requiresMemberCount: true,
  },
];

export default function SubscriptionPage() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState<number>(PAMILYA_MIN_MEMBERS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) ?? null;

  async function handleProceedToPayment() {
    if (!selectedPlan || isSubmitting) return;

    setErrorMessage(null);

    if (
      selectedPlan.requiresMemberCount &&
      (!memberCount || memberCount < PAMILYA_MIN_MEMBERS)
    ) {
      setErrorMessage(
        `KAPAMILYA requires at least ${PAMILYA_MIN_MEMBERS} members.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await subscribeAction(
        selectedPlan.planKey,
        selectedPlan.requiresMemberCount ? memberCount : undefined
      );

      if (!result.success || !("url" in result) || !result.url) {
        setErrorMessage(
          ("error" in result && result.error) ||
            "Failed to start payment. Please try again."
        );
        setIsSubmitting(false);
        return;
      }

      window.location.href = result.url;
    } catch (error) {
      console.error("Subscription error:", error);
      setErrorMessage("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <DashboardHeader title="Subscription" />

      <main className="flex flex-1 flex-col items-center px-6 py-12 bg-[#F0F0FF]">
        {/* Page heading */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-[#31318A]">
            Choose Your Plan
          </h1>
          <p className="mt-3 text-base font-semibold text-[#6666FF]">
            Select the perfect plan for your institution
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-2xl border-2 bg-white p-6 shadow-sm transition-all duration-200 ${
                  isSelected
                    ? "border-[#6666FF] shadow-[0_0_0_3px_rgba(102,102,255,0.25)]"
                    : "border-[#BDBDFF] hover:border-[#6666FF]"
                }`}
              >
                {/* Plan name and tagline */}
                <div className="mb-4">
                  <h2 className="text-xl font-extrabold text-[#31318A]">
                    {plan.name}
                  </h2>
                  <p className="mt-0.5 text-sm font-semibold text-[#6666FF]">
                    {plan.tagline}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-5 flex flex-wrap items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-[#6666FF]">
                    {plan.price}
                  </span>
                  <span className="text-sm font-medium text-[#6666FF]">
                    {plan.priceNote}
                  </span>
                </div>

                {/* Features */}
                <ul className="mb-8 flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm font-semibold text-[#31318A]"
                    >
                      <Check className="h-4 w-4 shrink-0 text-[#6666FF]" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Select Plan button */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setSelectedPlanId(isSelected ? null : plan.id)}
                  className={`w-full rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? "border-[#6666FF] bg-[#6666FF] text-white"
                      : "border-[#6666FF] bg-white text-[#31318A] hover:bg-[#6666FF]/10"
                  }`}
                >
                  {isSelected ? "Selected" : "Select Plan"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Member count input for KAPAMILYA */}
        {selectedPlan?.requiresMemberCount && (
          <div className="mt-10 w-full max-w-sm rounded-2xl border-2 border-[#BDBDFF] bg-white p-5">
            <label
              htmlFor="memberCount"
              className="block text-sm font-bold text-[#31318A]"
            >
              Number of users
            </label>
            <p className="mt-1 text-xs text-[#6666FF]">
              Minimum {PAMILYA_MIN_MEMBERS} users at ₱1,100 each
            </p>
            <input
              id="memberCount"
              type="number"
              min={PAMILYA_MIN_MEMBERS}
              value={memberCount}
              onChange={(e) => {
                const next = parseInt(e.target.value, 10);
                setMemberCount(Number.isNaN(next) ? PAMILYA_MIN_MEMBERS : next);
              }}
              className="mt-3 w-full rounded-lg border-2 border-[#BDBDFF] px-3 py-2 text-base font-semibold text-[#31318A] outline-none focus:border-[#6666FF]"
            />
          </div>
        )}

        {/* Error banner */}
        {errorMessage && (
          <div className="mt-8 flex w-full max-w-md items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              aria-label="Dismiss error"
              className="rounded-full p-0.5 transition-colors hover:bg-red-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Proceed to Payment */}
        <div className="mt-12">
          <button
            type="button"
            disabled={!selectedPlanId || isSubmitting}
            onClick={handleProceedToPayment}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#6666FF] px-24 py-4 text-base font-bold text-white shadow-md transition-all duration-200 hover:bg-[#5555EE] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {isSubmitting ? "Redirecting..." : "Proceed to Payment"}
          </button>
        </div>
      </main>
    </div>
  );
}

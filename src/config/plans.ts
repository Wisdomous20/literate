export const PLANS = {
  SOLO: {
    name: "Solo",
    type: "SOLO" as const,
    maxMembers: 1,
    basePrice: 1500, 
    isOrg: false,
    description: "For individual educators",
  },
  KASALO: {
    name: "Kasalo",
    type: "KASALO" as const,
    maxMembers: 5,
    basePrice: 5000,
    isOrg: true,
    description: "For small teams — up to 5 members",
  },
  PANALO: {
    name: "Panalo",
    type: "PANALO" as const,
    maxMembers: 15,
    basePrice: 15000,
    isOrg: true,
    description: "For schools — up to 15 members",
  },
  PAMILYA: {
    name: "Pamilya",
    type: "PAMILYA" as const,
    maxMembers: Infinity, 
    minMembers: 20,
    pricePerMember: 1000, 
    isOrg: true,
    description: "For large organizations — 20+ members, ₱1,000 each",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function calculatePrice(planType: PlanKey, memberCount?: number): number {
  if (planType === "PAMILYA") {
    const count = Math.max(memberCount || 20, 20);
    return count * PLANS.PAMILYA.pricePerMember;
  }

  return PLANS[planType].basePrice;
}

export function getMaxMembers(planType: PlanKey, memberCount?: number): number {
  if (planType === "PAMILYA") {
    return Math.max(memberCount || 20, 20);
  }
  return PLANS[planType].maxMembers;
}
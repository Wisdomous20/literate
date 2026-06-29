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
    maxMembers: 10,
    basePrice: 5000,
    isOrg: true,
    description: "For small teams — up to 5 members",
  },
  PANALO: {
    name: "Panalo",
    type: "PANALO" as const,
    maxMembers: 20,
    basePrice: 15000,
    isOrg: true,
    description: "For schools — up to 15 members",
  },
  PAMILYA: {
    name: "Pamilya",
    type: "PAMILYA" as const,
    maxMembers: 50,
    minMembers: 20,
    pricePerMember: 1000, 
    isOrg: true,
    description: "For large organizations - 20 to 50 members, PHP 1,000 each",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export const PAMILYA_MIN_MEMBERS = PLANS.PAMILYA.minMembers;
export const PAMILYA_MAX_MEMBERS = PLANS.PAMILYA.maxMembers;
export const PAMILYA_MEMBER_LIMIT_MESSAGE = `Kapamilya plan supports ${PAMILYA_MIN_MEMBERS} to ${PAMILYA_MAX_MEMBERS} members`;

function normalizePamilyaMemberCount(memberCount?: number): number {
  if (!Number.isFinite(memberCount)) {
    return PAMILYA_MIN_MEMBERS;
  }

  return Math.min(
    Math.max(Math.trunc(memberCount as number), PAMILYA_MIN_MEMBERS),
    PAMILYA_MAX_MEMBERS,
  );
}

export function calculatePrice(planType: PlanKey, memberCount?: number): number {
  if (planType === "PAMILYA") {
    const count = normalizePamilyaMemberCount(memberCount);
    return count * PLANS.PAMILYA.pricePerMember;
  }

  return PLANS[planType].basePrice;
}

export function getMaxMembers(planType: PlanKey, memberCount?: number): number {
  if (planType === "PAMILYA") {
    return normalizePamilyaMemberCount(memberCount);
  }
  return PLANS[planType].maxMembers;
}

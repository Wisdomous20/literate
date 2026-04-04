"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import {
  checkDailyLimit,
  getDailyLimitStatus,
} from "@/service/assessment/checkDailyLimitService";

export async function checkDailyLimitAction(assessmentType: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const result = await checkDailyLimit(session.user.id, assessmentType);

  return {
    success: true,
    ...result,
  };
}

export async function getDailyLimitStatusAction() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const status = await getDailyLimitStatus(session.user.id);

  // Serialize Infinity for client consumption
  const serialize = (val: number) => (val === Infinity ? -1 : val);

  return {
    success: true,
    isFreeUser: status.isFreeUser,
    usage: status.usage,
    limits: {
      ORAL_READING: serialize(status.limits.ORAL_READING),
      COMPREHENSION: serialize(status.limits.COMPREHENSION),
      READING_FLUENCY: serialize(status.limits.READING_FLUENCY),
    },
    remaining: {
      ORAL_READING: serialize(status.remaining.ORAL_READING),
      COMPREHENSION: serialize(status.remaining.COMPREHENSION),
      READING_FLUENCY: serialize(status.remaining.READING_FLUENCY),
    },
  };
}
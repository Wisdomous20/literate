import { z } from "zod";
import { positiveInt } from "@/lib/validation/common";

const planTypeValues = ["SOLO", "KASALO", "PANALO", "PAMILYA"] as const;

const planTypeSchema = z.enum(planTypeValues);

export const subscribeSchema = z
  .object({
    planType: planTypeSchema,
    memberCount: positiveInt("Member count").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.planType === "PAMILYA" && (data.memberCount ?? 0) < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["memberCount"],
        message: "Pamilya plan requires at least 20 members",
      });
    }
  });

const recurringPlanMetadataSchema = z.object({
  maxMembers: z.string().optional(),
  userId: z.string().optional(),
  planType: planTypeSchema.optional(),
});

const recurringPlanDataSchema = z.object({
  id: z.string().min(1),
  metadata: recurringPlanMetadataSchema.optional(),
});

const recurringCycleDataSchema = z.object({
  plan_id: z.string().min(1),
});

export const xenditWebhookSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("recurring.plan.activated"),
    data: recurringPlanDataSchema,
  }),
  z.object({
    event: z.literal("recurring.plan.inactivated"),
    data: recurringPlanDataSchema.pick({ id: true }),
  }),
  z.object({
    event: z.literal("recurring.cycle.succeeded"),
    data: recurringCycleDataSchema,
  }),
  z.object({
    event: z.literal("recurring.cycle.retrying"),
    data: recurringCycleDataSchema,
  }),
  z.object({
    event: z.literal("recurring.cycle.failed"),
    data: recurringCycleDataSchema,
  }),
]);

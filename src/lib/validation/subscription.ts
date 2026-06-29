import { z } from "zod";
import { positiveInt } from "@/lib/validation/common";
import {
  PAMILYA_MAX_MEMBERS,
  PAMILYA_MEMBER_LIMIT_MESSAGE,
  PAMILYA_MIN_MEMBERS,
} from "@/config/plans";

const planTypeValues = ["SOLO", "KASALO", "PANALO", "PAMILYA"] as const;

const planTypeSchema = z.enum(planTypeValues);

export const subscribeSchema = z
  .object({
    planType: planTypeSchema,
    memberCount: positiveInt("Member count").optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.planType === "PAMILYA" &&
      ((data.memberCount ?? 0) < PAMILYA_MIN_MEMBERS ||
        (data.memberCount ?? 0) > PAMILYA_MAX_MEMBERS)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["memberCount"],
        message: PAMILYA_MEMBER_LIMIT_MESSAGE,
      });
    }
  });

const recurringPlanMetadataSchema = z.object({
  maxMembers: z.string().optional(),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  planId: z.string().optional(),
  planType: planTypeSchema.optional(),
  // Plan-change markers used to complete the upgrade/downgrade swap on activation.
  planChange: z.string().optional(),
  previousSubscriptionId: z.string().optional(),
  previousXenditPlanId: z.string().optional(),
  subtotalAmount: z.string().optional(),
  discountAmount: z.string().optional(),
  totalAmount: z.string().optional(),
  checkoutReferenceId: z.string().optional(),
});

const recurringPlanDataSchema = z.object({
  id: z.string().min(1),
  metadata: recurringPlanMetadataSchema.optional(),
}).passthrough();

const recurringCycleDataSchema = z.object({
  plan_id: z.string().min(1),
}).passthrough();

const paymentSessionDataSchema = z
  .object({
    id: z.string().optional(),
    payment_session_id: z.string().optional(),
    reference_id: z.string().optional(),
    metadata: recurringPlanMetadataSchema.optional(),
  })
  .passthrough();

export const xenditWebhookSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("payment_session.completed"),
    data: paymentSessionDataSchema,
  }),
  z.object({
    event: z.literal("payment_session.succeeded"),
    data: paymentSessionDataSchema,
  }),
  z.object({
    event: z.literal("recurring.plan.activated"),
    data: recurringPlanDataSchema,
  }),
  z.object({
    event: z.literal("recurring.plan.activation"),
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

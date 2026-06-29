import { describe, expect, it } from "vitest";
import { subscribeSchema } from "@/lib/validation/subscription";

describe("subscribeSchema", () => {
  it("accepts a 50-seat Kapamilya subscription", () => {
    const result = subscribeSchema.safeParse({
      planType: "PAMILYA",
      memberCount: 50,
    });

    expect(result.success).toBe(true);
  });

  it("rejects Kapamilya subscriptions above 50 seats", () => {
    const result = subscribeSchema.safeParse({
      planType: "PAMILYA",
      memberCount: 51,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/20 to 50 members/);
    }
  });
});

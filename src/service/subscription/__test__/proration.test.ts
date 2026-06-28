import { describe, expect, it } from "vitest";
import { computeProrationCredit, roundCurrency } from "../proration";

describe("computeProrationCredit", () => {
  const start = new Date("2026-01-01T00:00:00Z");
  const end = new Date("2027-01-01T00:00:00Z"); // 365 days later

  it("credits roughly half the price at the period midpoint", () => {
    const now = new Date("2026-07-02T12:00:00Z"); // ~half of a 365-day term
    const credit = computeProrationCredit({
      priceAmountSnapshot: 1500,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      now,
    });
    expect(credit).toBeGreaterThan(740);
    expect(credit).toBeLessThan(760);
  });

  it("credits nearly the full price right after the period starts", () => {
    const now = new Date("2026-01-01T01:00:00Z");
    const credit = computeProrationCredit({
      priceAmountSnapshot: 1500,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      now,
    });
    expect(credit).toBeGreaterThan(1499);
    expect(credit).toBeLessThanOrEqual(1500);
  });

  it("returns 0 once the period has elapsed", () => {
    const now = new Date("2027-02-01T00:00:00Z");
    expect(
      computeProrationCredit({
        priceAmountSnapshot: 1500,
        currentPeriodStart: start,
        currentPeriodEnd: end,
        now,
      }),
    ).toBe(0);
  });

  it("returns 0 when period dates are missing", () => {
    expect(
      computeProrationCredit({
        priceAmountSnapshot: 1500,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      }),
    ).toBe(0);
  });

  it("rounds the credit to 2 decimal places", () => {
    const credit = computeProrationCredit({
      priceAmountSnapshot: 1000,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      now: new Date("2026-04-11T07:13:00Z"),
    });
    expect(credit).toBe(roundCurrency(credit));
    expect(Number.isInteger(credit * 100)).toBe(true);
  });
});

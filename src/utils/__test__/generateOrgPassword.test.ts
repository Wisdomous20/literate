import { afterEach, describe, expect, it, vi } from "vitest";
import { generateOrgPassword } from "../generateOrgPassword";

describe("generateOrgPassword", () => {
  afterEach(() => vi.restoreAllMocks());

  it("formats output as orgPart-namePart-4digits", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(generateOrgPassword("Acme School", "Reyes")).toBe(
      "AcmeSchool-Reyes-5500",
    );
  });

  it("strips non-alphanumeric characters from both parts", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(generateOrgPassword("St. Mary's!", "O'Brien")).toBe(
      "StMarys-OBrien-1000",
    );
  });

  it("truncates each sanitized part to 15 characters", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const result = generateOrgPassword("A".repeat(20), "B".repeat(20));
    expect(result).toBe(`${"A".repeat(15)}-${"B".repeat(15)}-1000`);
  });

  it("falls back to Org / User when inputs sanitize to empty", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(generateOrgPassword("!!!", "???")).toBe("Org-User-1000");
  });

  it("produces a numeric suffix in the 1000-9999 range", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9999);
    const digits = generateOrgPassword("Acme", "Reyes").split("-").pop()!;
    expect(digits).toMatch(/^\d{4}$/);
    expect(Number(digits)).toBeGreaterThanOrEqual(1000);
    expect(Number(digits)).toBeLessThanOrEqual(9999);
  });
});

import { describe, expect, it } from "vitest";
import classifyComprehensionLevel from "../classifyComprehensionLevel";

describe("classifyComprehensionLevel", () => {
  it("returns INDEPENDENT when percentage is exactly 80", () => {
    expect(classifyComprehensionLevel(80)).toBe("INDEPENDENT");
  });

  it("returns INDEPENDENT when percentage is above 80", () => {
    expect(classifyComprehensionLevel(100)).toBe("INDEPENDENT");
  });

  it("returns INSTRUCTIONAL when percentage is exactly 59", () => {
    expect(classifyComprehensionLevel(59)).toBe("INSTRUCTIONAL");
  });

  it("returns INSTRUCTIONAL when percentage is between 59 and 79", () => {
    expect(classifyComprehensionLevel(70)).toBe("INSTRUCTIONAL");
  });

  it("returns FRUSTRATION when percentage is below 59", () => {
    expect(classifyComprehensionLevel(58)).toBe("FRUSTRATION");
  });

  it("returns FRUSTRATION when percentage is 0", () => {
    expect(classifyComprehensionLevel(0)).toBe("FRUSTRATION");
  });

  it("returns INSTRUCTIONAL at the upper boundary of the INSTRUCTIONAL range (79)", () => {
    expect(classifyComprehensionLevel(79)).toBe("INSTRUCTIONAL");
  });
});

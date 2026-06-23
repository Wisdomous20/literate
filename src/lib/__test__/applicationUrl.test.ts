import { describe, expect, it } from "vitest";
import { buildApplicationUrl } from "../applicationUrl";

describe("buildApplicationUrl", () => {
  it("trims deployment-config whitespace and preserves the complete assessment token", () => {
    const url = buildApplicationUrl(
      "assess/WkVcvSbSFX8cRmhvmEeq_g",
      "https://literate-web-373896310831.asia-southeast1.run.app/\n",
    );

    expect(url).toBe(
      "https://literate-web-373896310831.asia-southeast1.run.app/assess/WkVcvSbSFX8cRmhvmEeq_g",
    );
    expect(url).not.toMatch(/\s/);
  });

  it("does not introduce a double slash before the shared path", () => {
    expect(buildApplicationUrl("/assess/token", "https://example.com/")).toBe(
      "https://example.com/assess/token",
    );
  });
});

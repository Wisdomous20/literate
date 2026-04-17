 import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
  import { getSchoolYear } from "@/utils/getSchoolYear";

  describe("getSchoolYear", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("returns previous-current from January through June", () => {
      vi.setSystemTime(new Date("2026-01-15"));
      expect(getSchoolYear()).toBe("2025-2026");
    });

    it("still returns previous-current on the June boundary", () => {
      vi.setSystemTime(new Date("2026-06-30"));
      expect(getSchoolYear()).toBe("2025-2026");
    });

    it("rolls over to current-next starting July", () => {
      vi.setSystemTime(new Date("2026-07-01"));
      expect(getSchoolYear()).toBe("2026-2027");
    });

    it("stays on current-next through December", () => {
      vi.setSystemTime(new Date("2026-12-31"));
      expect(getSchoolYear()).toBe("2026-2027");
    });
  });
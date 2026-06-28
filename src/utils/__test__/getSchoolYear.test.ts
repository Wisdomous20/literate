 import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
  import { getSchoolYear } from "@/utils/getSchoolYear";

  describe("getSchoolYear", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("returns previous-current from January through May", () => {
      vi.setSystemTime(new Date("2026-01-15"));
      expect(getSchoolYear()).toBe("2025-2026");
    });

    it("still returns previous-current on the May boundary", () => {
      vi.setSystemTime(new Date("2026-05-31"));
      expect(getSchoolYear()).toBe("2025-2026");
    });

    it("rolls over to current-next starting June", () => {
      vi.setSystemTime(new Date("2026-06-01"));
      expect(getSchoolYear()).toBe("2026-2027");
    });

    it("stays on current-next through December", () => {
      vi.setSystemTime(new Date("2026-12-31"));
      expect(getSchoolYear()).toBe("2026-2027");
    });
  });
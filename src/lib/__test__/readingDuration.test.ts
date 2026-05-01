import {
  calculateWordsCorrectPerMinute,
  formatAudioClock,
  getDisplayReadingTimeSeconds,
  resolveReadingDurationSeconds,
} from "../readingDuration";

describe("readingDuration", () => {
  it("prefers analyzed duration when available", () => {
    expect(resolveReadingDurationSeconds(9.6, 10)).toBe(9.6);
  });

  it("falls back to recorded seconds when analyzed duration is missing", () => {
    expect(resolveReadingDurationSeconds(undefined, 10)).toBe(10);
    expect(resolveReadingDurationSeconds(0, 8)).toBe(8);
  });

  it("rounds displayed reading time to the nearest second", () => {
    expect(getDisplayReadingTimeSeconds(9.6)).toBe(10);
    expect(getDisplayReadingTimeSeconds(9.4)).toBe(9);
  });

  it("calculates WCPM from the precise duration", () => {
    expect(calculateWordsCorrectPerMinute(32, 9.6)).toBe(200);
    expect(calculateWordsCorrectPerMinute(32, 10)).toBe(192);
  });

  it("formats audio clocks with configurable rounding", () => {
    expect(formatAudioClock(9.6)).toBe("0:09");
    expect(formatAudioClock(9.6, "nearest")).toBe("0:10");
    expect(formatAudioClock(9.6, "nearest", true)).toBe("00:10");
  });
});

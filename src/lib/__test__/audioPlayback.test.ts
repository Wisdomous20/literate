import { describe, expect, it, vi } from "vitest";
import {
  clampAudioTimestamp,
  formatMiscueTimestamp,
  seekAudioToTimestamp,
} from "../audioPlayback";

function createAudioStub(duration = 20) {
  return {
    currentTime: 0,
    duration,
    play: vi.fn(() => Promise.resolve()),
  };
}

describe("audioPlayback", () => {
  it("rejects invalid timestamps", () => {
    expect(clampAudioTimestamp(Number.NaN, 20)).toBeNull();
    expect(clampAudioTimestamp(Number.POSITIVE_INFINITY, 20)).toBeNull();
  });

  it("clamps seek targets to the playable audio range", () => {
    expect(clampAudioTimestamp(-3, 20)).toBe(0);
    expect(clampAudioTimestamp(8, 20)).toBe(8);
    expect(clampAudioTimestamp(40, 20)).toBe(20);
  });

  it("formats timestamps with tenths of a second", () => {
    expect(formatMiscueTimestamp(0.3)).toBe("00:00.3");
    expect(formatMiscueTimestamp(5)).toBe("00:05.0");
    expect(formatMiscueTimestamp(65.2)).toBe("01:05.2");
  });

  it("seeks and starts playback by default", () => {
    const audio = createAudioStub();

    expect(seekAudioToTimestamp(audio, 12)).toBe(true);

    expect(audio.currentTime).toBe(12);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it("can seek without starting playback", () => {
    const audio = createAudioStub();

    expect(seekAudioToTimestamp(audio, 12, { play: false })).toBe(true);

    expect(audio.currentTime).toBe(12);
    expect(audio.play).not.toHaveBeenCalled();
  });
});

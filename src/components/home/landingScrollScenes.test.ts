import { describe, expect, it } from "vitest";

import {
  LANDING_REVEAL_TRIGGERS,
  LANDING_SCROLL_SCENES,
  shouldEnableLandingMotion,
} from "./landingScrollScenes";

describe("landing scroll scenes", () => {
  it("defines one scroll scene for each landing section", () => {
    expect(LANDING_SCROLL_SCENES.map((scene) => scene.id)).toEqual([
      "hero",
      "problem",
      "how-it-works",
      "reading-levels",
      "miscues",
      "benefits",
      "cta",
    ]);
  });

  it("disables enhanced motion when reduced motion is requested", () => {
    expect(shouldEnableLandingMotion(true)).toBe(false);
    expect(shouldEnableLandingMotion(false)).toBe(true);
  });

  it("keeps the how-it-works section unpinned so scroll cannot lock on entry", () => {
    expect(
      LANDING_SCROLL_SCENES.find((scene) => scene.id === "how-it-works")
        ?.intensity,
    ).toBe("staged");
  });

  it("marks the problem section as brisk because it should pass faster", () => {
    expect(
      LANDING_SCROLL_SCENES.find((scene) => scene.id === "problem")?.pace,
    ).toBe("brisk");
  });

  it("uses earlier reveal triggers so content appears before the section is centered", () => {
    expect(LANDING_REVEAL_TRIGGERS.content).toBe("top 92%");
    expect(LANDING_REVEAL_TRIGGERS.list).toBe("top 90%");
    expect(LANDING_REVEAL_TRIGGERS.howItWorksTimeline).toBe("top 88%");
    expect(LANDING_REVEAL_TRIGGERS.readingCards).toBe("top 84%");
  });
});

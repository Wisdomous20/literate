export type LandingScrollSceneId =
  | "hero"
  | "problem"
  | "how-it-works"
  | "reading-levels"
  | "miscues"
  | "benefits"
  | "cta";

export interface LandingScrollScene {
  id: LandingScrollSceneId;
  intensity: "hero" | "pinned" | "staged" | "kinetic" | "ambient";
  pace?: "normal" | "brisk";
}

export const LANDING_SCROLL_SCENES: LandingScrollScene[] = [
  { id: "hero", intensity: "hero" },
  { id: "problem", intensity: "staged", pace: "brisk" },
  { id: "how-it-works", intensity: "staged" },
  { id: "reading-levels", intensity: "staged" },
  { id: "miscues", intensity: "kinetic" },
  { id: "benefits", intensity: "ambient" },
  { id: "cta", intensity: "staged" },
];

export const LANDING_REVEAL_TRIGGERS = {
  sectionBriskStart: "top 96%",
  sectionBriskEnd: "top 58%",
  sectionStart: "top 94%",
  sectionEnd: "top 38%",
  content: "top 92%",
  list: "top 90%",
  howItWorksStart: "top 94%",
  howItWorksEnd: "top 44%",
  howItWorksTimeline: "top 88%",
  readingCards: "top 84%",
  miscues: "top 84%",
  testimonials: "top 84%",
  cta: "top 90%",
} as const;

export function shouldEnableLandingMotion(
  isReducedMotionRequested: boolean,
): boolean {
  return !isReducedMotionRequested;
}

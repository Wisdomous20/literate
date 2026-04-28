"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  LayoutPanelLeft,
  Layers3,
  MoonStar,
  Palette,
  Sparkles,
  SwatchBook,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Swatch = {
  name: string;
  value: string;
  note: string;
  usage: string;
};

const foundationSwatches: Swatch[] = [
  {
    name: "Iris",
    value: "#6B57F5",
    note: "Primary action",
    usage: "Main CTA, active state, focused selection",
  },
  {
    name: "Periwinkle",
    value: "#7B8CFF",
    note: "Support accent",
    usage: "Charts, secondary actions, supportive highlights",
  },
  {
    name: "Sky Wash",
    value: "#EEF6FF",
    note: "Brand tint",
    usage: "Feature surfaces, empty states, banner backgrounds",
  },
  {
    name: "Ink",
    value: "#16215C",
    note: "Headline ink",
    usage: "Titles, strong labels, navigation anchors",
  },
  {
    name: "Mist",
    value: "#F7F8FF",
    note: "Soft surface",
    usage: "Default cards, grouped panels, page breaks",
  },
  {
    name: "Fog Line",
    value: "#D9DEF7",
    note: "Structural border",
    usage: "Input edges, separators, subtle card boundaries",
  },
];

const cardRules = [
  {
    title: "Default surface",
    detail: "Use for the majority of dashboard and form content.",
    rule: "1px subtle border, soft gradient fill, medium radius, low-elevation shadow.",
  },
  {
    title: "Emphasis surface",
    detail: "Use when the card needs to feel selected, premium, or introductory.",
    rule: "Brand wash background, stronger border, never more than one emphasis card per small cluster.",
  },
  {
    title: "Interactive surface",
    detail: "Use for clickable summaries, navigational blocks, or compact data modules.",
    rule: "Hover lifts by 2px, shadow deepens, and border color strengthens before color ever changes dramatically.",
  },
];

const themeModes = [
  {
    name: "Classroom Light",
    icon: Palette,
    summary: "Primary product default. Clear ink contrast, mist backgrounds, quiet violet emphasis.",
    surface: "var(--surface-soft)",
    border: "rgba(91, 103, 181, 0.18)",
  },
  {
    name: "Brand Wash",
    icon: Sparkles,
    summary: "Marketing and onboarding theme. More atmospheric, still legible, best for feature callouts.",
    surface: "var(--surface-brand)",
    border: "rgba(102, 102, 255, 0.3)",
  },
  {
    name: "Evening Focus",
    icon: MoonStar,
    summary: "Dark mode counterpart. Lower glare, denser ink fields, controlled lavender accents.",
    surface: "var(--surface-dark)",
    border: "rgba(209, 213, 255, 0.18)",
  },
];

export default function DesignSystemPage() {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [demoTheme, setDemoTheme] = useState("Classroom Light");

  const activeTheme =
    themeModes.find((theme) => theme.name === demoTheme) ?? themeModes[0];

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    setCopiedValue(text);
    window.setTimeout(() => setCopiedValue(null), 1800);
  }

  return (
    <main className="surface-page min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="theme-grid relative mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-white/50 bg-white/40 p-4 backdrop-blur-sm sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_right,rgba(107,87,245,0.18),transparent_40%),radial-gradient(circle_at_top_left,rgba(123,140,255,0.14),transparent_32%)]" />

        <section className="relative">
          <Card className="overflow-hidden rounded-[34px] border-white/60 bg-white/70 p-0">
            <div className="grid gap-0 lg:grid-cols-[1.25fr_0.95fr]">
              <div className="px-6 py-8 sm:px-8 sm:py-10">
                <div className="surface-badge inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
                  <SwatchBook className="h-3.5 w-3.5" />
                  LiteRate Design System 2.0
                </div>
                <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-[-0.05em] text-[#16215C] sm:text-5xl lg:text-6xl">
                  Premium classroom surfaces with more thoughtful cards and calmer theme behavior.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-[#5B649C] sm:text-lg">
                  The system now centers on layered surfaces rather than flat white boxes:
                  softer page canvases, deliberate elevations, stronger ink hierarchy, and
                  card states that communicate priority without shouting.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button size="lg">Primary action</Button>
                  <Button variant="outline" size="lg">
                    Secondary control
                  </Button>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <HeroMetric label="Theme families" value="3" note="product, brand, dark" />
                  <HeroMetric label="Card tiers" value="4" note="neutral, muted, emphasis, inverse" />
                  <HeroMetric label="Intent" value="1" note="clarity before decoration" />
                </div>
              </div>

              <div className="border-t border-[var(--card-border-subtle)] p-4 lg:border-t-0 lg:border-l">
                <Card tone="brand" padding="lg" className="h-full rounded-[28px]">
                  <CardHeader>
                    <p className="text-kicker">Visual Direction</p>
                    <CardTitle className="text-2xl">Premium classroom workspace</CardTitle>
                    <CardDescription>
                      Editorial structure, soft gradients, high-trust forms, and cards that
                      feel like organized teaching materials instead of anonymous UI tiles.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 pt-2">
                    <DirectionRow
                      label="Palette"
                      value="Iris, periwinkle, sky wash, ink navy"
                    />
                    <DirectionRow
                      label="Type"
                      value="Bold Poppins headlines with tighter tracking and quieter body copy"
                    />
                    <DirectionRow
                      label="Motion"
                      value="Lift, sharpen, and brighten on interaction rather than glow"
                    />
                    <DirectionRow
                      label="Cards"
                      value="Gradated surfaces, meaningful state changes, reduced sameness"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </Card>
        </section>

        <section className="relative mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card padding="lg">
            <CardHeader>
              <p className="text-kicker">Foundation</p>
              <CardTitle className="text-3xl">Palette behavior</CardTitle>
              <CardDescription>
                Colors are now organized by responsibility: ink for hierarchy, mist for
                structure, iris for action, sky wash for emphasis. The system works best when
                purple is a signal, not a wallpaper.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {foundationSwatches.map((swatch) => (
                <SwatchCard
                  key={swatch.name}
                  swatch={swatch}
                  copied={copiedValue === swatch.value}
                  onCopy={copy}
                />
              ))}
            </CardContent>
          </Card>

          <Card tone="muted" padding="lg">
            <CardHeader>
              <p className="text-kicker">Themes</p>
              <CardTitle className="text-3xl">Theme families</CardTitle>
              <CardDescription>
                The design system now treats themes as surface moods rather than fully separate
                brands. That keeps components stable while letting screens feel lighter, more
                promotional, or more focused.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {themeModes.map((theme) => {
                const Icon = theme.icon;
                const isActive = theme.name === demoTheme;

                return (
                  <button
                    key={theme.name}
                    type="button"
                    onClick={() => setDemoTheme(theme.name)}
                    className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                      isActive
                        ? "surface-panel-emphasis"
                        : "surface-panel-muted hover:border-[var(--card-border-default)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-[#5D5DFB]" />
                          <p className="text-sm font-bold text-[#16215C]">{theme.name}</p>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[#6072A6]">{theme.summary}</p>
                      </div>
                      {isActive && <Check className="mt-0.5 h-4 w-4 text-[#5D5DFB]" />}
                    </div>
                  </button>
                );
              })}

              <div className="rounded-[24px] border p-5" style={{ backgroundImage: activeTheme.surface, borderColor: activeTheme.border }}>
                <p className="text-kicker">Active demo</p>
                <p className="mt-2 text-xl font-bold text-[#16215C]">{activeTheme.name}</p>
                <p className="mt-2 max-w-md text-sm leading-7 text-[#6072A6]">
                  Use this theme when the screen needs the mood described above without changing
                  the component anatomy or spacing rules.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="relative mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card padding="lg">
            <CardHeader>
              <p className="text-kicker">Cards</p>
              <CardTitle className="text-3xl">Card anatomy and hierarchy</CardTitle>
              <CardDescription>
                Cards should not all look equal. We now define cards by role first: standard,
                supporting, emphasized, or interactive. That creates rhythm and lets users scan
                pages faster.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {cardRules.map((rule) => (
                <div
                  key={rule.title}
                  className="surface-panel-muted rounded-[24px] px-5 py-5"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-bold text-[#16215C]">{rule.title}</p>
                      <p className="mt-1 text-sm leading-7 text-[#6072A6]">{rule.detail}</p>
                    </div>
                    <span className="surface-badge inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-semibold">
                      {rule.rule}
                    </span>
                  </div>
                </div>
              ))}

              <div className="grid gap-4 lg:grid-cols-3">
                <Card tone="default" padding="md">
                  <CardHeader>
                    <p className="text-kicker">Standard</p>
                    <CardTitle className="text-lg">Assessment summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-[#6072A6]">
                      Baseline card for metrics, summaries, and reusable application content.
                    </p>
                  </CardContent>
                </Card>

                <Card tone="brand" padding="md">
                  <CardHeader>
                    <p className="text-kicker">Emphasis</p>
                    <CardTitle className="text-lg">Teacher insight</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-[#6072A6]">
                      Elevated with a brand wash for onboarding, recommendations, or key prompts.
                    </p>
                  </CardContent>
                </Card>

                <Card interactive padding="md">
                  <CardHeader>
                    <p className="text-kicker">Interactive</p>
                    <CardTitle className="text-lg">Open class report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-[#6072A6]">
                      The hover state sharpens border, shadow, and lift before adding extra color.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card tone="inverse" padding="lg">
            <CardHeader>
              <p className="text-kicker text-white/75">Elevation</p>
              <CardTitle className="text-3xl text-white">When to deepen contrast</CardTitle>
              <CardDescription className="text-white/72">
                Darker cards are now reserved for immersive or special-purpose moments such as
                spotlight metrics, command centers, or focused reading overlays.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <InverseRow title="Do" body="Use inverse cards sparingly to anchor attention or group dense information." />
              <InverseRow title="Avoid" body="Do not mix many dark cards into otherwise light grids. They should punctuate, not flood." />
              <InverseRow title="Best fit" body="Command summaries, premium highlights, or concentrated productivity tools." />
            </CardContent>
          </Card>
        </section>

        <section className="relative mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card padding="lg">
            <CardHeader>
              <p className="text-kicker">Primitives</p>
              <CardTitle className="text-3xl">Input and action behavior</CardTitle>
              <CardDescription>
                Buttons and form controls now match the card system: larger radii, calmer fill,
                clearer focus rings, and stronger material depth instead of flat generic borders.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Button>Save changes</Button>
                <Button variant="outline">Cancel</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Quiet action</Button>
              </div>

              <div className="grid gap-4">
                <Input placeholder="Teacher workspace name" />
                <Select value={demoTheme} onValueChange={setDemoTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a theme family" />
                  </SelectTrigger>
                  <SelectContent>
                    {themeModes.map((theme) => (
                      <SelectItem key={theme.name} value={theme.name}>
                        {theme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card tone="muted" padding="lg">
            <CardHeader>
              <p className="text-kicker">Usage Notes</p>
              <CardTitle className="text-3xl">Card rules to keep the system sharp</CardTitle>
              <CardDescription>
                These rules matter more than the exact hex values. They protect the system from
                drifting back into repetitive equal-weight cards.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <RulePanel
                icon={Layers3}
                title="Vary the stack"
                body="Mix default, muted, and emphasis surfaces within a layout so everything does not compete at the same visual volume."
              />
              <RulePanel
                icon={LayoutPanelLeft}
                title="Lead with purpose"
                body="Give cards a clear job: navigation, summary, warning, insight, or input. Styling should follow that job."
              />
              <RulePanel
                icon={Palette}
                title="Use purple sparingly"
                body="Purple should indicate action and importance. White, mist, and ink should still carry most of the interface."
              />
              <RulePanel
                icon={ArrowUpRight}
                title="Hover with restraint"
                body="Prefer lift, border sharpening, and subtle brightness changes over aggressive glow, blur, or color shifts."
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function HeroMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="surface-panel-muted rounded-[24px] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7583B6]">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#16215C]">{value}</p>
      <p className="mt-1 text-xs text-[#6072A6]">{note}</p>
    </div>
  );
}

function DirectionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-panel-muted rounded-[22px] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7583B6]">{label}</p>
      <p className="mt-1 text-sm leading-7 text-[#4F5C93]">{value}</p>
    </div>
  );
}

function SwatchCard({
  swatch,
  copied,
  onCopy,
}: {
  swatch: Swatch;
  copied: boolean;
  onCopy: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(swatch.value)}
      className="surface-panel-interactive rounded-[24px] p-4 text-left"
    >
      <div
        className="h-24 rounded-[20px] border border-black/5"
        style={{ backgroundColor: swatch.value }}
      />
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold text-[#16215C]">{swatch.name}</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-[#7483B6]">
            {swatch.note}
          </p>
        </div>
        {copied ? (
          <Check className="h-4 w-4 text-[#5D5DFB]" />
        ) : (
          <Copy className="h-4 w-4 text-[#9BA7D0]" />
        )}
      </div>
      <p className="mt-3 font-mono text-xs text-[#5D5DFB]">{swatch.value}</p>
      <p className="mt-2 text-sm leading-7 text-[#6072A6]">{swatch.usage}</p>
    </button>
  );
}

function InverseRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#BFC7FF]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-white/78">{body}</p>
    </div>
  );
}

function RulePanel({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Palette;
  title: string;
  body: string;
}) {
  return (
    <div className="surface-panel rounded-[24px] px-5 py-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#EEF1FF] text-[#5D5DFB]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-lg font-bold text-[#16215C]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[#6072A6]">{body}</p>
    </div>
  );
}

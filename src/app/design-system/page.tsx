"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function DesignSystemPage() {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHex(text);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4FCFD] via-white to-[#EFFDFF] font-[Outfit]">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-[#E4F4FF] bg-white shadow-sm">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#6C4EEB] rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#6666FF] rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-10 py-10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#6C4EEB] to-[#6666FF] flex items-center justify-center shadow-lg">
              <div className="h-5 w-5 rotate-45 rounded-sm bg-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#6C4EEB] via-[#6666FF] to-[#5D5DFB] bg-clip-text text-transparent">
                LiteRate Design System
              </h1>
              <p className="text-sm text-[#575E6B] mt-1">
                Complete visual guidelines with usage examples and best
                practices
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-10 py-16 space-y-20">
        <section>
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-[#31318A] font-[Outfit] mb-3">
              Color Palette & Usage Guide
            </h2>
            <p className="text-[#575E6B]">
              Understand where and how to use each color in your designs
            </p>
          </div>

          <div className="mb-16">
            <h3 className="text-sm font-bold text-[#575E6B] uppercase tracking-widest mb-6">
              Brand / Purple — Primary Identity
            </h3>
            <p className="text-[#575E6B] mb-6 text-sm">
              The purple palette represents LiteRate brand identity. Use these
              colors for interactive elements, CTAs, and brand-forward designs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <DetailedColorCard
                hex="#6C4EEB"
                name="Primary Brand"
                purpose="Main buttons, primary CTAs, navigation highlights"
                usage={[
                  "Primary action buttons",
                  "Navbar active state",
                  "Link hover state",
                  "Icon highlights",
                ]}
                do="Use for the most important interactive element"
                dont="Avoid using for large background areas"
                copyText="#6C4EEB"
                onCopy={copyToClipboard}
                isCopied={copiedHex === "#6C4EEB"}
                sample="Primary CTA Button"
              />
              <DetailedColorCard
                hex="#6666FF"
                name="Secondary Brand"
                purpose="Secondary actions, accents, badges, notifications"
                usage={[
                  "Secondary buttons",
                  "Badge backgrounds",
                  "Active tabs",
                  "Accent borders",
                ]}
                do="Use to create visual hierarchy with primary"
                dont="Don't mix with primary in same component"
                copyText="#6666FF"
                onCopy={copyToClipboard}
                isCopied={copiedHex === "#6666FF"}
                sample="Secondary Action"
              />
              <DetailedColorCard
                hex="#5D5DFB"
                name="Accent Purple"
                purpose="Hover states, interactive feedback, transitions"
                usage={[
                  "Button hover states",
                  "Focus outlines",
                  "Loading indicators",
                  "Progress bars",
                ]}
                do="Use for interactive feedback and transitions"
                dont="Don't use as primary color choice"
                copyText="#5D5DFB"
                onCopy={copyToClipboard}
                isCopied={copiedHex === "#5D5DFB"}
                sample="Hover / Active State"
              />
            </div>

            <div className="rounded-2xl border-2 border-[#6C4EEB]/30 bg-gradient-to-r from-[#6C4EEB]/5 to-[#6666FF]/5 p-6">
              <h4 className="font-bold text-[#31318A] mb-4">
                Purple Combinations
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded bg-[#6C4EEB]" />
                    <div className="h-8 w-8 rounded bg-[#6666FF]" />
                    <div className="h-8 w-8 rounded bg-[#5D5DFB]" />
                  </div>
                  <span className="text-sm text-[#31318A] font-medium">
                    Full Purple Spectrum: Use for status indicators, progress
                    sequences
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded bg-gradient-to-br from-[#6C4EEB] to-[#6666FF]" />
                    <div className="h-8 w-8 rounded bg-gradient-to-br from-[#6666FF] to-[#5D5DFB]" />
                  </div>
                  <span className="text-sm text-[#31318A] font-medium">
                    Gradients: Use for hero sections, feature highlights
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <h3 className="text-sm font-bold text-[#575E6B] uppercase tracking-widest mb-6">
              Backgrounds & Surfaces — White + Purple Accents
            </h3>
            <p className="text-[#575E6B] mb-6 text-sm">
              Clean white backgrounds with subtle purple accents create a
              professional, accessible design. Use purple washes for emphasis
              and context.
            </p>

            <div className="space-y-6">
              {/* White & Light Backgrounds */}
              <div className="rounded-2xl border border-[#E4F4FF] bg-white p-8">
                <h4 className="font-bold text-[#31318A] mb-4 flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-white border-2 border-[#323743]" />
                  White & Off-White Base
                </h4>
                <div className="space-y-4">
                  <BackgroundUsageCard
                    color="#FFFFFF"
                    name="Pure White"
                    usage="Page backgrounds, card surfaces, component bases"
                    example="Default background for all pages, white card backgrounds"
                    recommended="HIGH"
                  />
                  <BackgroundUsageCard
                    color="#F4FCFD"
                    name="Ice Blue (Subtle Tint)"
                    usage="Secondary page backgrounds, section dividers"
                    example="Admin dashboard background, alternate row backgrounds"
                    recommended="HIGH"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#E4F4FF] bg-white p-8">
                <h4 className="font-bold text-[#31318A] mb-4 flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-gradient-to-br from-[#6C4EEB]/20 to-[#6666FF]/20" />
                  Purple Accent Backgrounds
                </h4>
                <p className="text-sm text-[#575E6B] mb-4">
                  Use light purple washes to highlight sections, draw attention,
                  or create visual hierarchy.
                </p>
                <div className="space-y-4">
                  <BackgroundUsageCard
                    color="#F0F4FF"
                    name="Periwinkle (Light Purple Wash)"
                    usage="Highlighted cards, featured sections, callout boxes"
                    example="Premium feature cards, banner backgrounds, info boxes"
                    recommended="HIGH"
                  />
                  <BackgroundUsageCard
                    color="#edeaff"
                    name="Brand Pale (Very Light Purple)"
                    usage="Hover states, subtle highlights, brand accents"
                    example="Button hover backgrounds, brand panels, decorative accents"
                    recommended="MEDIUM"
                  />
                  <BackgroundUsageCard
                    color="#E4F4FF"
                    name="Sky Hover (Cool Purple)"
                    usage="Interactive hover states, active selections"
                    example="Table row hovers, menu item hovers, selection highlights"
                    recommended="HIGH"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#E4F4FF] bg-white p-8">
                <h4 className="font-bold text-[#31318A] mb-6">
                  Recommended Background Combinations
                </h4>
                <div className="space-y-4">
                  {[
                    {
                      name: "Clean & Professional",
                      pattern: "White + Navy Text",
                      colors: ["#FFFFFF", "#00306E"],
                      use: "Main content areas, dashboards, forms",
                    },
                    {
                      name: "Subtle Emphasis",
                      pattern: "White + Purple Accent Cards",
                      colors: ["#FFFFFF", "#F0F4FF", "#6C4EEB"],
                      use: "Feature highlights, premium sections",
                    },
                    {
                      name: "Brand Forward",
                      pattern: "Ice Blue + White + Purple Accents",
                      colors: ["#F4FCFD", "#FFFFFF", "#6C4EEB"],
                      use: "Landing pages, auth screens, hero sections",
                    },
                    {
                      name: "Interactive Context",
                      pattern: "White + Purple Hover States",
                      colors: ["#FFFFFF", "#E4F4FF", "#6C4EEB"],
                      use: "Tables, lists, selectable items",
                    },
                  ].map((combo) => (
                    <div
                      key={combo.name}
                      className="border border-[#E4F4FF] rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-[#31318A] text-sm">
                            {combo.name}
                          </p>
                          <p className="text-xs text-[#575E6B]">
                            {combo.pattern}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mb-3">
                        {combo.colors.map((color) => (
                          <div
                            key={color}
                            className="h-10 w-10 rounded border border-black/10"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-[#575E6B]">
                        <span className="font-semibold text-[#31318A]">
                          Use for:
                        </span>{" "}
                        {combo.use}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <h3 className="text-sm font-bold text-[#575E6B] uppercase tracking-widest mb-6">
              Navy & Dark Blues — Text & Structure
            </h3>
            <p className="text-[#575E6B] mb-6 text-sm">
              Dark colors create contrast and hierarchy. Use for text, borders,
              and structural elements.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-[#E4F4FF] bg-white p-6">
                <h4 className="font-bold text-[#31318A] mb-4">
                  Text Hierarchy
                </h4>
                <div className="space-y-3">
                  <ColorWithUsage
                    color="#0f172a"
                    name="Darkest (#0f172a)"
                    use="Page titles, main headings, emphasis text"
                    level="Level 1 - Strongest contrast"
                  />
                  <ColorWithUsage
                    color="#323743"
                    name="Body Text (#323743)"
                    use="Default paragraph text, regular content"
                    level="Level 2 - Standard content"
                  />
                  <ColorWithUsage
                    color="#575E6B"
                    name="Muted (#575E6B)"
                    use="Captions, helper text, secondary labels"
                    level="Level 3 - Lowest contrast"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#E4F4FF] bg-white p-6">
                <h4 className="font-bold text-[#31318A] mb-4">
                  Brand Specific
                </h4>
                <div className="space-y-3">
                  <ColorWithUsage
                    color="#00306E"
                    name="Assessment Navy (#00306E)"
                    use="Assessment flow headings, important data"
                    level="Assessment pages"
                  />
                  <ColorWithUsage
                    color="#31318A"
                    name="Heading Navy (#31318A)"
                    use="Section headings, component titles"
                    level="UI Headings"
                  />
                  <ColorWithUsage
                    color="#162DB0"
                    name="Link Blue (#162DB0)"
                    use="Links, interactive text, inline actions"
                    level="Interactive"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <h3 className="text-sm font-bold text-[#575E6B] uppercase tracking-widest mb-6">
              Semantic Colors — Status & Feedback
            </h3>
            <p className="text-[#575E6B] mb-6 text-sm">
              Use semantic colors consistently to communicate status and
              feedback to users.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DetailedSemanticCard
                label="Success"
                primary="#16a34a"
                light="#dcfce7"
                usage="Confirmations, positive actions, validation"
                examples={[
                  "Assessment completed",
                  "Data saved successfully",
                  "Valid form submission",
                ]}
                copyText="#16a34a"
                onCopy={copyToClipboard}
                isCopied={copiedHex === "#16a34a"}
              />
              <DetailedSemanticCard
                label="Error / Danger"
                primary="#dc2626"
                light="#fee2e2"
                usage="Errors, destructive actions, warnings"
                examples={[
                  "Validation error",
                  "Deleted items (destructive)",
                  "Failed action",
                ]}
                copyText="#dc2626"
                onCopy={copyToClipboard}
                isCopied={copiedHex === "#dc2626"}
              />
              <DetailedSemanticCard
                label="Warning"
                primary="#ca8a04"
                light="#fef9c3"
                usage="Alerts, caution, pending states"
                examples={[
                  "Pending review",
                  "Attention needed",
                  "Incomplete data",
                ]}
                copyText="#ca8a04"
                onCopy={copyToClipboard}
                isCopied={copiedHex === "#ca8a04"}
              />
            </div>
          </div>

          <div className="mb-16">
            <h3 className="text-sm font-bold text-[#575E6B] uppercase tracking-widest mb-6">
              Chart & Data Visualization Colors
            </h3>
            <p className="text-[#575E6B] mb-6 text-sm">
              Use these perceptually uniform OKLCH colors for charts, graphs,
              and data visualization.
            </p>

            <div className="rounded-2xl border border-[#E4F4FF] bg-white p-8">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
                {[
                  {
                    oklch: "oklch(0.646 0.222 41.116)",
                    label: "Chart 1",
                    role: "Orange",
                    use: "Primary data series",
                  },
                  {
                    oklch: "oklch(0.6 0.118 184.704)",
                    label: "Chart 2",
                    role: "Teal",
                    use: "Secondary series",
                  },
                  {
                    oklch: "oklch(0.398 0.07 227.392)",
                    label: "Chart 3",
                    role: "Steel Blue",
                    use: "Tertiary series",
                  },
                  {
                    oklch: "oklch(0.828 0.189 84.429)",
                    label: "Chart 4",
                    role: "Yellow-Green",
                    use: "Accent data",
                  },
                  {
                    oklch: "oklch(0.769 0.188 70.08)",
                    label: "Chart 5",
                    role: "Amber",
                    use: "Highlight",
                  },
                ].map(({ oklch, label, role, use }) => (
                  <div key={label} className="text-center">
                    <div
                      className="h-20 rounded-xl shadow-md mb-2 border border-black/5"
                      style={{ backgroundColor: oklch }}
                    />
                    <p className="text-xs font-bold text-[#31318A]">{label}</p>
                    <p className="text-[10px] text-[#575E6B] mb-1">{role}</p>
                    <p className="text-[9px] text-[#8D8DEC]">{use}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-[#F4FCFD] rounded-lg border border-[#E4F4FF]">
                <p className="text-xs text-[#162DB0]">
                  <span className="font-bold">Why OKLCH?</span> These colors are
                  perceptually uniform across different backgrounds and maintain
                  readability for colorblind users.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-[#31318A] font-[Outfit] mb-3">
              Typography & Usage
            </h2>
            <p className="text-[#575E6B]">
              Font families with practical examples and implementation
              guidelines
            </p>
          </div>

          {/* Font Families */}
          <div className="mb-12">
            <h3 className="text-sm font-bold text-[#575E6B] uppercase tracking-widest mb-6">
              Font Families
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border-2 border-[#6C4EEB]/30 bg-gradient-to-br from-[#F4FCFD] to-white p-8">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#6C4EEB] text-white text-xs font-bold">
                    HEADINGS
                  </span>
                </div>
                <p className="text-6xl font-bold text-[#31318A] font-[Outfit] mb-2">
                  Outfit
                </p>
                <p className="text-sm text-[#575E6B] mb-4">
                  Display, headings, and brand typography
                </p>
                <div className="bg-[#F0F4FF] p-3 rounded-lg border border-[#E4F4FF] mb-4">
                  <p className="text-xs font-mono text-[#162DB0]">
                    Poppins: wght@400;500;700
                  </p>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="font-normal text-base text-[#323743] font-[Outfit]">
                    font-normal (400) · Rare, use sparingly
                  </p>
                  <p className="font-medium text-base text-[#323743] font-[Outfit]">
                    font-medium (500) · Subheadings
                  </p>
                  <p className="font-bold text-base text-[#323743] font-[Outfit]">
                    font-bold (700) · Main headings
                  </p>
                </div>
                <div className="text-xs text-[#575E6B] space-y-1 p-3 bg-[#EFFDFF] rounded">
                  <p>
                    <span className="font-bold">Use for:</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Page titles (H1-H2)</li>
                    <li>Section headings (H3-H6)</li>
                    <li>Brand elements</li>
                    <li>CTA buttons</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-[#162DB0]/30 bg-gradient-to-br from-[#F0F4FF] to-white p-8">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#162DB0] text-white text-xs font-bold">
                    BODY
                  </span>
                </div>
                <p className="text-6xl font-bold text-[#31318A] font-[Inter] mb-2">
                  Inter
                </p>
                <p className="text-sm text-[#575E6B] mb-4">
                  Body copy, UI text, and interface labels
                </p>
                <div className="bg-[#F0F4FF] p-3 rounded-lg border border-[#E4F4FF] mb-4">
                  <p className="text-xs font-mono text-[#162DB0]">
                    Inter: subsets@latin
                  </p>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="font-normal text-base text-[#323743] font-[Inter]">
                    font-normal (400) · Default copy
                  </p>
                  <p className="font-medium text-base text-[#323743] font-[Inter]">
                    font-medium (500) · Labels & UI
                  </p>
                  <p className="font-semibold text-base text-[#323743] font-[Inter]">
                    font-semibold (600) · Emphasis
                  </p>
                </div>
                <div className="text-xs text-[#575E6B] space-y-1 p-3 bg-[#EFFDFF] rounded">
                  <p>
                    <span className="font-bold">Use for:</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Paragraph text</li>
                    <li>Form labels</li>
                    <li>UI buttons & links</li>
                    <li>Data tables</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-sm font-bold text-[#575E6B] uppercase tracking-widest mb-6">
              Heading Scale
            </h3>
            <div className="space-y-2 rounded-2xl border border-[#E4F4FF] bg-white p-8">
              {[
                {
                  tag: "h1",
                  size: "text-5xl",
                  px: "48px",
                  cls: "text-5xl",
                  label: "H1",
                  sample: "Reading Proficiency Assessment",
                  use: "Page main title, single per page",
                },
                {
                  tag: "h2",
                  size: "text-4xl",
                  px: "36px",
                  cls: "text-4xl",
                  label: "H2",
                  sample: "Dashboard Overview",
                  use: "Major section heading",
                },
                {
                  tag: "h3",
                  size: "text-3xl",
                  px: "30px",
                  cls: "text-3xl",
                  label: "H3",
                  sample: "Student Results",
                  use: "Subsection heading",
                },
                {
                  tag: "h4",
                  size: "text-2xl",
                  px: "24px",
                  cls: "text-2xl",
                  label: "H4",
                  sample: "Fluency Score",
                  use: "Component heading",
                },
                {
                  tag: "h5",
                  size: "text-xl",
                  px: "20px",
                  cls: "text-xl",
                  label: "H5",
                  sample: "Word Per Minute",
                  use: "Minor heading, list title",
                },
                {
                  tag: "h6",
                  size: "text-lg",
                  px: "18px",
                  cls: "text-lg",
                  label: "H6",
                  sample: "Classification Level",
                  use: "Label, small heading",
                },
              ].map(({ tag, px, cls, label, sample, use }) => (
                <div
                  key={tag}
                  className="flex gap-4 py-4 border-b border-[#F0F4FF] last:border-0 hover:bg-[#F4FCFD] px-4 -mx-4 rounded transition-colors"
                >
                  <div className="w-32 shrink-0">
                    <span className="text-xs font-bold text-[#162DB0] bg-[#F0F4FF] px-2 py-1 rounded">
                      {label}
                    </span>
                    <p className="text-[10px] text-[#575E6B] mt-2">{px}</p>
                    <p className="text-[9px] text-[#8D8DEC] mt-1">Use: {use}</p>
                  </div>
                  <div className="flex-1">
                    <p
                      className={`${cls} font-bold text-[#0f172a] font-[Outfit] leading-tight`}
                    >
                      {sample}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-[#31318A] font-[Outfit] mb-3">
              Component Examples & Patterns
            </h2>
            <p className="text-[#575E6B]">
              Real-world implementations of the design system
            </p>
          </div>

          {/* Row 1: Buttons & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Button Examples */}
            <div className="rounded-2xl border border-[#E4F4FF] bg-white p-8">
              <h4 className="text-sm font-bold text-[#162DB0] uppercase tracking-widest mb-4">
                Buttons
              </h4>
              <div className="space-y-4">
                <div>
                  <button className="w-full px-6 py-3 rounded-lg bg-[#6C4EEB] text-white font-semibold shadow-lg hover:shadow-xl hover:brightness-110 transition-all">
                    Primary Button
                  </button>
                  <p className="text-xs text-[#575E6B] mt-2">
                    <span className="font-bold">Use for:</span> Main CTAs,
                    submit buttons, primary actions
                  </p>
                </div>
                <div>
                  <button className="w-full px-6 py-3 rounded-lg border-2 border-[#6C4EEB] text-[#6C4EEB] font-semibold hover:bg-[#F0F4FF] transition-colors">
                    Secondary Button
                  </button>
                  <p className="text-xs text-[#575E6B] mt-2">
                    <span className="font-bold">Use for:</span> Cancel,
                    alternative actions, less important CTAs
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E4F4FF] bg-white p-8">
              <h4 className="text-sm font-bold text-[#162DB0] uppercase tracking-widest mb-4">
                Status Indicators
              </h4>
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-[#dcfce7] border border-[#16a34a]/30 text-[#16a34a]">
                  <p className="font-semibold text-sm">Completed</p>
                  <p className="text-xs mt-1">Use for successful outcomes</p>
                </div>
                <div className="p-4 rounded-lg bg-[#fee2e2] border border-[#dc2626]/30 text-[#dc2626]">
                  <p className="font-semibold text-sm">Error</p>
                  <p className="text-xs mt-1">
                    Use for failures or blocking issues
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[#fef9c3] border border-[#ca8a04]/30 text-[#ca8a04]">
                  <p className="font-semibold text-sm">Warning</p>
                  <p className="text-xs mt-1">
                    Use for caution or pending states
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Card Patterns */}
            <div className="rounded-2xl border border-[#E4F4FF] bg-white p-8">
              <h4 className="text-sm font-bold text-[#162DB0] uppercase tracking-widest mb-4">
                Card Patterns
              </h4>
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-[#E4F4FF] bg-white shadow-sm">
                  <p className="font-semibold text-[#31318A] text-sm">
                    White Card
                  </p>
                  <p className="text-xs text-[#575E6B] mt-1">
                    Default card, use for standard content
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[#E4F4FF] bg-[#F0F4FF] shadow-md">
                  <p className="font-semibold text-[#31318A] text-sm">
                    Highlighted Card
                  </p>
                  <p className="text-xs text-[#575E6B] mt-1">
                    Use for featured or important content
                  </p>
                </div>
                <div className="p-4 rounded-xl border-2 border-[#6C4EEB] bg-white shadow-lg">
                  <p className="font-semibold text-[#6C4EEB] text-sm">
                    Active / Selected Card
                  </p>
                  <p className="text-xs text-[#575E6B] mt-1">
                    Use when card is selected or focused
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E4F4FF] bg-white p-8">
              <h4 className="text-sm font-bold text-[#162DB0] uppercase tracking-widest mb-4">
                Card Border Thickness
              </h4>
              <div className="space-y-4">
                <CardThicknessExample
                  thickness="0.5px"
                  className="border border-[#E4F4FF]"
                  description="Subtle border for subtle cards and neutral elements."
                  recommended="Standard"
                  color="#E4F4FF"
                />
                <CardThicknessExample
                  thickness="1px"
                  className="border border-[#6C4EEB]"
                  description="Default border for interactive and important cards."
                  recommended="Default"
                  color="#6C4EEB"
                />
                <CardThicknessExample
                  thickness="2px"
                  className="border-2 border-[#6C4EEB]"
                  description="Emphasized border for selected, active, or priority cards."
                  recommended="Emphasis"
                  color="#6C4EEB"
                />
              </div>
              <div className="mt-6 p-3 bg-[#F0F4FF] rounded-lg border border-[#E4F4FF] text-xs text-[#575E6B]">
                <b>Implementation Guide:</b>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>0.5px for subtle, neutral UI surfaces</li>
                  <li>1px for standard cards and main content</li>
                  <li>2px for selected, focused, or high-priority states</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E4F4FF] bg-white p-8">
            <h4 className="text-sm font-bold text-[#162DB0] uppercase tracking-widest mb-4">
              Background Patterns & Surface Colors
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <p className="text-sm font-bold text-[#31318A] mb-3">
                  Neutral Surfaces
                </p>
                <div className="h-24 rounded-lg bg-white border border-[#E4F4FF] flex items-center justify-center">
                  <p className="text-xs text-[#575E6B] font-mono">#FFFFFF</p>
                </div>
                <p className="text-xs text-[#575E6B]">
                  Pure White - Default card and page backgrounds
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-bold text-[#31318A] mb-3">
                  Subtle Tint
                </p>
                <div className="h-24 rounded-lg bg-[#F4FCFD] border border-[#E4F4FF] flex items-center justify-center">
                  <p className="text-xs text-[#575E6B] font-mono">#F4FCFD</p>
                </div>
                <p className="text-xs text-[#575E6B]">
                  Ice Blue - Alternate rows, secondary backgrounds
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-bold text-[#31318A] mb-3">
                  Brand Accent
                </p>
                <div className="h-24 rounded-lg bg-[#F0F4FF] border border-[#E4F4FF] flex items-center justify-center">
                  <p className="text-xs text-[#575E6B] font-mono">#F0F4FF</p>
                </div>
                <p className="text-xs text-[#575E6B]">
                  Periwinkle - Highlights, featured sections
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-[#31318A] font-[Outfit] mb-3">
              Best Practices
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border-2 border-[#16a34a]/30 bg-[#dcfce7]/20 p-6">
              <h4 className="font-bold text-[#16a34a] mb-4">DO</h4>
              <ul className="space-y-2 text-sm text-[#323743]">
                <li>
                  Use white backgrounds with purple accents for clean designs
                </li>
                <li>
                  Combine colors from the same category (e.g., purple tones)
                </li>
                <li>
                  Use semantic colors consistently (green=success, red=error)
                </li>
                <li>Test color contrast ratios for accessibility</li>
                <li>Maintain purple as the primary brand color</li>
                <li>Use navy blues for text and hierarchy</li>
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-[#dc2626]/30 bg-[#fee2e2]/20 p-6">
              <h4 className="font-bold text-[#dc2626] mb-4">DONT</h4>
              <ul className="space-y-2 text-sm text-[#323743]">
                <li>Mix competing brand colors without hierarchy</li>
                <li>Use low-contrast text on low-contrast backgrounds</li>
                <li>Overuse purple accents (use sparingly for impact)</li>
                <li>Apply semantic colors inconsistently</li>
                <li>Use backgrounds without white base</li>
                <li>Ignore accessibility guidelines for color blindness</li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="text-center py-12 border-t border-[#E4F4FF]">
          <p className="text-sm text-[#575E6B] font-[Inter]">
            LiteRate Design System · v1.0 · Complete Usage Guide
          </p>
          <p className="text-xs text-[#8D8DEC] mt-2 font-[Inter]">
            Last updated: April 2026 · For internal reference and development
          </p>
        </footer>
      </div>
    </div>
  );
}

function CardThicknessExample({
  thickness,
  className,
  description,
  recommended,
}: {
  thickness: string;
  className: string;
  description: string;
  recommended: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-[#F4FCFD] border border-[#E4F4FF]">
      <div
        className={`h-12 w-16 rounded-md bg-white flex items-center justify-center flex-shrink-0 ${className}`}
      >
        <span className="text-[10px] text-[#31318A] font-bold">
          {thickness}
        </span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-[#31318A]">{recommended}</p>
        <p className="text-xs text-[#575E6B]">{description}</p>
      </div>
    </div>
  );
}

function DetailedColorCard({
  hex,
  name,
  purpose,
  usage,
  do: doText,
  dont: dontText,
  copyText,
  onCopy,
  isCopied,
  sample,
}: {
  hex: string;
  name: string;
  purpose: string;
  usage: string[];
  do: string;
  dont: string;
  copyText: string;
  onCopy: (text: string) => void;
  isCopied: boolean;
  sample: string;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-lg border border-black/5 cursor-pointer group hover:shadow-xl transition-all"
      onClick={() => onCopy(copyText)}
    >
      <div
        className="relative h-32 overflow-hidden bg-gradient-to-br"
        style={{ backgroundColor: hex }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {isCopied ? (
            <Check className="w-5 h-5 text-white" />
          ) : (
            <Copy className="w-5 h-5 text-white" />
          )}
        </div>
      </div>
      <div className="bg-white p-6">
        <h4 className="text-lg font-bold text-[#31318A] mb-1">{name}</h4>
        <p className="text-xs text-[#575E6B] mb-3 font-mono">{hex}</p>
        <p className="text-sm text-[#323743] mb-3">{purpose}</p>
        <div className="mb-3 space-y-1">
          <p className="text-xs font-bold text-[#162DB0]">Where to use:</p>
          {usage.map((u, i) => (
            <p key={i} className="text-xs text-[#575E6B]">
              • {u}
            </p>
          ))}
        </div>
        <div className="p-3 bg-[#F0F4FF] rounded-lg border border-[#E4F4FF]">
          <p className="text-xs font-bold text-[#162DB0] mb-1">{sample}</p>
        </div>
      </div>
    </div>
  );
}

function BackgroundUsageCard({
  color,
  name,
  usage,
  example,
  recommended,
}: {
  color: string;
  name: string;
  usage: string;
  example: string;
  recommended: string;
}) {
  return (
    <div className="flex gap-4 p-4 rounded-lg border border-[#E4F4FF] hover:bg-[#F4FCFD] transition-colors">
      <div
        className="h-16 w-16 rounded-lg border-2 border-black/10 flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <p className="font-bold text-[#31318A] text-sm">{name}</p>
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded ${
              recommended === "HIGH"
                ? "bg-[#dcfce7] text-[#16a34a]"
                : "bg-[#fef9c3] text-[#ca8a04]"
            }`}
          >
            {recommended} PRIORITY
          </span>
        </div>
        <p className="text-xs text-[#575E6B] mb-2">{usage}</p>
        <p className="text-xs text-[#162DB0]">
          <span className="font-bold">Example:</span> {example}
        </p>
      </div>
    </div>
  );
}

function ColorWithUsage({
  color,
  name,
  use,
  level,
}: {
  color: string;
  name: string;
  use: string;
  level: string;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div
        className="h-6 w-6 rounded mt-1 border border-black/10 flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1">
        <p className="text-sm font-bold text-[#31318A]">{name}</p>
        <p className="text-xs text-[#575E6B] mt-0.5">{use}</p>
        <p className="text-[10px] text-[#8D8DEC] mt-0.5">{level}</p>
      </div>
    </div>
  );
}

function DetailedSemanticCard({
  label,
  primary,
  light,
  usage,
  examples,
  copyText,
  onCopy,
  isCopied,
}: {
  label: string;
  primary: string;
  light: string;
  usage: string;
  examples: string[];
  copyText: string;
  onCopy: (text: string) => void;
  isCopied: boolean;
}) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-black/5">
      <div
        className="flex gap-0 h-24 cursor-pointer"
        onClick={() => onCopy(copyText)}
      >
        <div
          className="flex-1 flex items-center justify-center text-white font-bold text-sm relative group"
          style={{ backgroundColor: primary }}
        >
          Primary
          {isCopied && <div className="absolute inset-0 bg-black/30" />}
        </div>
        <div
          className="flex-1 border-l border-white flex items-center justify-center font-bold text-sm"
          style={{ backgroundColor: light }}
        >
          Light Variant
        </div>
      </div>
      <div className="bg-white p-4">
        <p className="font-bold text-[#31318A] mb-2">{label}</p>
        <p className="text-xs text-[#575E6B] mb-3">{usage}</p>
        <div className="space-y-1">
          {examples.map((ex, i) => (
            <p key={i} className="text-xs text-[#323743]">
              {ex}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

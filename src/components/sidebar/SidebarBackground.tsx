// Recreates the exact sidebar background from the LiteRate design.
// The design features bold, clearly visible organic wave shapes over a
// purple gradient. The waves create distinct lighter and darker bands
// that flow diagonally across the sidebar.

export function SidebarBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #7474FF 0%, #6B6BFD 25%, #6464F5 50%, #5E5EEF 75%, #5858E8 100%)",
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 260 1000"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Large lighter wash across the top ~30%. In the design there's
            a broad bright area covering the logo down to around "Oral
            Reading Test". This shape fills that zone. */}
        <path
          d="M0 0
             L260 0
             L260 250
             C 220 280, 140 320, 80 300
             C 20 280, -10 240, 0 200 Z"
          fill="rgba(255,255,255,0.10)"
        />

        {/* Prominent dark wave band in the middle. This is the most
            visible feature — a darker purple sweep that runs diagonally
            from the left edge (around 30% height) across and down to
            the right (around 50% height). In the design this clearly
            darkens the area around "Reading Fluency Test". */}
        <path
          d="M0 280
             C 40 260, 120 250, 200 300
             C 280 350, 280 420, 260 480
             L260 380
             C 250 340, 200 310, 140 300
             C 80 290, 30 300, 0 320 Z"
          fill="rgba(50,50,200,0.18)"
        />

        {/* Wider dark band behind the first one — this extends the
            darker zone and gives it the thick, visible presence seen
            in the design. */}
        <path
          d="M0 240
             C 60 200, 180 220, 260 320
             L260 500
             C 200 440, 100 400, 40 420
             C -20 440, -20 380, 0 340 Z"
          fill="rgba(70,70,220,0.14)"
        />

        {/* Bright lighter band below the dark wave (~45-55% height).
            In the design, the area around "Reading Comprehension Test"
            appears noticeably lighter/brighter than the band above. */}
        <path
          d="M0 420
             C 80 380, 200 400, 260 480
             L260 560
             C 180 520, 60 500, 0 540 Z"
          fill="rgba(255,255,255,0.09)"
        />

        {/* Large dark blob in the lower-left. The design shows a big
            soft circular darker area occupying roughly the bottom-left
            quadrant of the sidebar, from ~60% height downward. */}
        <path
          d="M-60 580
             C -20 520, 100 540, 160 620
             C 220 700, 200 820, 120 880
             C 40 940, -60 920, -80 840
             C -100 760, -100 640, -60 580 Z"
          fill="rgba(60,60,210,0.16)"
        />

        {/* Second lower blob — slightly lighter, overlapping the first
            to create the layered depth visible in the design. */}
        <path
          d="M-40 650
             C 20 610, 140 640, 180 720
             C 220 800, 180 900, 100 950
             C 20 1000, -40 980, -60 900
             C -80 820, -80 700, -40 650 Z"
          fill="rgba(80,80,230,0.10)"
        />

        {/* Subtle top-left curve. In the design there's a gentle lighter
            arc starting from the top-left corner. */}
        <path
          d="M0 0
             C 40 40, 60 120, 40 180
             C 20 240, -20 220, 0 160
             L0 0 Z"
          fill="rgba(255,255,255,0.07)"
        />

        {/* Right-side light edge. The design shows the right edge of
            the sidebar is slightly lighter in the upper portion. */}
        <path
          d="M260 0
             L260 350
             C 240 300, 230 200, 240 120
             C 250 60, 260 20, 260 0 Z"
          fill="rgba(255,255,255,0.06)"
        />

        {/* Lower-right subtle wash */}
        <path
          d="M260 600
             L260 1000
             C 200 950, 160 850, 180 760
             C 200 680, 240 640, 260 600 Z"
          fill="rgba(255,255,255,0.05)"
        />
      </svg>
    </div>
  );
}
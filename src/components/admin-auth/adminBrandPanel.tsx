export function AdminBrandPanel() {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center bg-[#7a7afb] rounded-3xl p-12 min-h-[500px]">
      {/* LiteRate Logo */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          {/* Book/Reading Icon */}
          <svg
            className="w-32 h-32"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Heart shape on top */}
            <path
              d="M60 35C60 35 45 20 35 25C25 30 25 45 35 55L60 75L85 55C95 45 95 30 85 25C75 20 60 35 60 35Z"
              fill="white"
              opacity="0.9"
            />
            {/* Open book pages */}
            <path d="M30 60L60 85L60 105L25 80V60H30Z" fill="white" />
            <path d="M90 60L60 85L60 105L95 80V60H90Z" fill="white" />
            {/* Book spine */}
            <rect
              x="55"
              y="85"
              width="10"
              height="20"
              fill="white"
              opacity="0.8"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-wide">
          LiteRate
        </h1>
        <span className="rounded-full bg-white/15 border border-white/25 px-5 py-1.5 text-xs font-semibold tracking-widest text-white uppercase">
          Admin Portal
        </span>
      </div>
    </div>
  );
}

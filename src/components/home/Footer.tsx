import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="overflow-hidden bg-[#F3F1FD] pb-7 md:pb-8">
      <div className="grid grid-cols-1 gap-8 border-t border-[#E0E2E6] px-5 pt-9 md:mb-12 md:grid-cols-2 md:gap-10 md:px-12 md:pt-12 lg:grid-cols-4">
        {/* Brand */}
        <div className="space-y-5 md:space-y-6">
          <div className="flex items-center gap-2">
            <Image
              src="/Final%20Icon%20Logo.svg"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 md:hidden"
            />
            <div className="hidden h-8 w-8 rounded-full bg-[#6C4EEB] md:block" />
            <span className="text-xl font-bold text-[#6C4EEB] md:font-['Outfit']">
              LiteRate
            </span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#575E6B]">
            AI-powered Phil-IRI assessments designed to empower educators and
            inspire young readers across the Philippines.
          </p>
        </div>

        {/* Platform */}
        <div className="rounded-[18px] bg-white/55 p-5 shadow-[0_16px_36px_rgba(108,78,235,0.08)] md:rounded-none md:bg-transparent md:p-0 md:shadow-none">
          <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-[#16181D] md:font-['Outfit'] md:tracking-widest">
            Platform
          </h4>
          <ul className="space-y-4 text-sm text-[#575E6B]">
            <li>
              <Link href="/" className="transition-colors hover:text-[#6C4EEB]">
                Home
              </Link>
            </li>
            <li>
              <Link href="/assess" className="transition-colors hover:text-[#6C4EEB]">
                Assessment
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="transition-colors hover:text-[#6C4EEB]">
                Pricing
              </Link>
            </li>
          </ul>
        </div>

        {/* Resources */}
        <div className="rounded-[18px] bg-white/55 p-5 shadow-[0_16px_36px_rgba(108,78,235,0.08)] md:rounded-none md:bg-transparent md:p-0 md:shadow-none">
          <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-[#16181D] md:font-['Outfit'] md:tracking-widest">
            Resources
          </h4>
          <ul className="space-y-4 text-sm text-[#575E6B]">
            {["Team", "Support Center", "Privacy Policy", "Terms of Service"].map(
              (item) => (
                <li key={item}>
                  <Link href="#" className="transition-colors hover:text-[#6C4EEB]">
                    {item}
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>

        {/* Newsletter */}
        <div className="rounded-[20px] bg-white p-5 shadow-[0_18px_42px_rgba(108,78,235,0.12)] md:rounded-none md:bg-transparent md:p-0 md:shadow-none">
          <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-[#16181D] md:font-['Outfit'] md:tracking-widest">
            Newsletter
          </h4>
          <p className="mb-4 text-sm text-[#575E6B]">
            Get tips on reading intervention and literacy strategies.
          </p>
          <div className="flex flex-col gap-2 min-[420px]:flex-row md:flex-row">
            <input
              type="email"
              placeholder="Email address"
              className="min-w-0 flex-1 rounded-[12px] border border-[#E0E2E6] bg-white px-4 py-3 text-sm outline-none focus:border-[#6C4EEB] md:py-2"
            />
            <button className="rounded-[10px] bg-[#6C4EEB] px-4 py-3 text-sm font-medium text-white shadow-[0_8px_16px_rgba(108,78,235,0.2)] transition hover:bg-[#5B3ED4] md:py-2 md:shadow-none">
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[#E0E2E6] px-5 pt-6 text-center md:mt-0 md:flex-row md:gap-4 md:px-12 md:pt-8 md:text-left">
        <p className="text-xs text-[#575E6B]">
          © 2026 LiteRate. All rights reserved.
        </p>
        <Link
          href="#"
          className="text-xs font-medium text-[#575E6B] hover:text-[#6C4EEB]"
        >
          Contact Us
        </Link>
      </div>
    </footer>
  );
}

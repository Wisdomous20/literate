import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#F3F1FD] pb-8 overflow-hidden">
      <div className="px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-24 pt-16 border-t border-[#E0E2E6]">
        {/* Brand */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#6C4EEB] rounded-full" />
            <span className="text-[#6C4EEB] font-['Outfit'] text-xl font-bold">
              LiteRate
            </span>
          </div>
          <p className="text-[#575E6B] text-sm leading-relaxed">
            AI-powered Phil-IRI assessments designed to empower educators and
            inspire young readers across the Philippines.
          </p>
          <div className="flex gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 bg-[#F3F4F6] rounded-full flex items-center justify-center"
              >
                <Image src="/assets/IMG_32.svg" alt="Social" width={16} height={16} className="w-4 h-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div>
          <h4 className="text-[#16181D] font-['Outfit'] font-bold text-sm uppercase tracking-widest mb-8">
            Platform
          </h4>
          <ul className="space-y-4 text-[#575E6B] text-sm">
            <li>
              <Link href="/" className="hover:text-[#6C4EEB] transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="/assess" className="hover:text-[#6C4EEB] transition-colors">
                Assessment
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-[#6C4EEB] transition-colors">
                Pricing
              </Link>
            </li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h4 className="text-[#16181D] font-['Outfit'] font-bold text-sm uppercase tracking-widest mb-8">
            Resources
          </h4>
          <ul className="space-y-4 text-[#575E6B] text-sm">
            {["Team", "Support Center", "Privacy Policy", "Terms of Service"].map(
              (item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="hover:text-[#6C4EEB] transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="text-[#16181D] font-['Outfit'] font-bold text-sm uppercase tracking-widest mb-8">
            Newsletter
          </h4>
          <p className="text-[#575E6B] text-sm mb-6">
            Get tips on reading intervention and literacy strategies.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Email address"
              className="flex-1 bg-white border border-[#E0E2E6] rounded-[12px] px-4 py-2 text-sm outline-none focus:border-[#6C4EEB]"
            />
            <button className="bg-[#6C4EEB] text-white text-sm font-medium px-4 py-2 rounded-[10px] hover:bg-[#5B3ED4] transition">
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="px-6 md:px-12 pt-8 border-t border-[#E0E2E6] flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[#575E6B] text-xs">
          © 2026 LiteRate. All rights reserved.
        </p>
        <Link
          href="#"
          className="text-[#575E6B] text-xs font-medium hover:text-[#6C4EEB]"
        >
          Contact Us
        </Link>
      </div>
    </footer>
  );
}

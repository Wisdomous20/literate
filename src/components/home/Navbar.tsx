"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const navLinks = [
  { href: "/", label: "Home", icon: "/assets/IMG_4.svg" },
  { href: "/assessment", label: "Assessment", icon: "/assets/IMG_5.svg" },
  { href: "/pricing", label: "Pricing", icon: "/assets/IMG_3.svg" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const faded = scrolled && !hovered;

  return (
    <motion.nav
      className="fixed left-0 right-0 top-0 z-50 px-3 py-2 sm:px-6 sm:py-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: faded ? 0.2 : 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`relative hover:-translate-y-1 transition-all active:translate-y-0 ${scrolled && !hovered ? "" : scrolled ? "drop-shadow-lg" : ""}`}>
        {/* 3D purple backing */}
        <div className="absolute inset-0 bg-[#6C4EEB] rounded-[10px] translate-y-1" />
        <div className="relative flex items-center justify-between gap-2 rounded-[10px] border-2 border-[#6C4EEB] bg-white px-2.5 py-2 sm:gap-3 sm:px-6 sm:py-3">
        {/* Logo */}
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <Image
            src="/Final%20Icon%20Logo.svg"
            alt="LiteRate"
            width={48}
            height={48}
            className="h-9 w-9 sm:h-12 sm:w-12"
            priority
          />
          <span className="truncate text-xl font-bold tracking-tight text-[#695ff7] min-[360px]:text-2xl sm:text-3xl">
            LiteRate
          </span>
        </Link>

        {/* Nav Links - absolutely centered */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-12">
          {navLinks.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group/link relative flex items-center gap-2 font-medium text-sm transition-colors ${
                  isActive ? "text-[#6C4EEB]" : "text-[#575E6B] hover:text-[#6C4EEB]"
                }`}
              >
                <Image
                  src={link.icon}
                  alt={link.label}
                  width={16}
                  height={16}
                  className={`w-4 h-4 transition-all duration-200 ${
                    isActive
                      ? "[filter:brightness(0)_saturate(100%)_invert(40%)_sepia(70%)_saturate(800%)_hue-rotate(220deg)_brightness(95%)_contrast(100%)]"
                      : "[filter:brightness(0)_opacity(0.45)] group-hover/link:[filter:brightness(0)_saturate(100%)_invert(40%)_sepia(70%)_saturate(800%)_hue-rotate(220deg)_brightness(95%)_contrast(100%)]"
                  }`}
                />
                {link.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#6C4EEB] rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Auth Buttons */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-4">
          <Link
            href="/login"
            className="rounded-lg px-2 py-1.5 text-sm font-bold text-[#6C4EEB] transition-colors hover:bg-purple-50 sm:px-4 sm:py-2"
          >
            Login
          </Link>
          <div className="relative group">
            <div className="absolute inset-0 bg-[#FF5DA2] rounded-[10px] translate-y-1" />
            <Link
              href="/signup"
              className="relative block rounded-[10px] border border-[#FF5DA2] bg-white px-2.5 py-1.5 text-sm font-medium text-[#FF5DA2] transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:px-4 sm:py-2"
            >
              <span className="hidden min-[360px]:inline">Sign Up</span>
              <span className="min-[360px]:hidden">Join</span>
            </Link>
          </div>
        </div>
      </div>
      </div>
    </motion.nav>
  );
}

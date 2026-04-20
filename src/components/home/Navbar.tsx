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
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: faded ? 0.2 : 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`relative hover:-translate-y-1 transition-all active:translate-y-0 ${scrolled && !hovered ? "" : scrolled ? "drop-shadow-lg" : ""}`}>
        {/* 3D purple backing */}
        <div className="absolute inset-0 bg-[#6C4EEB] rounded-[10px] translate-y-1" />
        <div className="relative flex items-center justify-between bg-white border-2 border-[#6C4EEB] rounded-[10px] px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#6C4EEB] rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
          </div>
          <span className="font-[Outfit] text-[23px] font-bold text-[#6C4EEB]">
            LiteRate
          </span>
        </div>

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
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-[#6C4EEB] font-bold text-sm px-4 py-2 hover:bg-purple-50 rounded-lg transition-colors"
          >
            Login
          </Link>
          <div className="relative group">
            <div className="absolute inset-0 bg-[#FF5DA2] rounded-[10px] translate-y-1" />
            <Link
              href="/signup"
              className="relative block bg-white border border-[#FF5DA2] text-[#FF5DA2] font-medium text-sm px-4 py-2 rounded-[10px] hover:-translate-y-0.5 transition-transform active:translate-y-0"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
      </div>
    </motion.nav>
  );
}

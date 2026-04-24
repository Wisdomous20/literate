import Image from "next/image";
import Link from "next/link";
import React from "react";

export function BrandPanel({
  children,
  imageSrc = "/Login1.svg", // Default image for login
}: {
  children: React.ReactNode;
  imageSrc?: string;
}) {
  return (
    <div className="lg:flex w-full min-h-140 rounded-3xl border-l border-t border-r-10 border-b-10 border-[#6666FF] overflow-hidden">
      <div className="hidden lg:flex flex-col justify-center items-center bg-[#ffffff] relative min-h-140 w-1/2 overflow-hidden">
        <div className="absolute inset-0 brandpanel-ellipse-bg" />
        <div className="absolute inset-0 brandpanel-ellipse-light">
          <Image
            src={imageSrc}
            alt="Brand Panel Illustration"
            fill
            className="object-cover"
            priority
          />
        </div>
        {/* Back to Home Button as Pop Over */}
        <Link
          href="/"
          className="absolute top-6 left-6 z-30"
          style={{ textDecoration: "none" }}
        >
          <button
            className="flex items-center gap-1 px-2 py-1 bg-white text-purple-600 font-bold text-sm rounded-md shadow-lg transition-all duration-200 hover:scale-105 hover:-translate-y-1"
            style={{
              borderRight: "4px solid #7c3aed", // purple-600
              borderBottom: "4px solid #7c3aed",
              boxShadow:
                "0 6px 24px 0 rgba(124,58,237,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.10)",
              backdropFilter: "blur(4px)",
            }}
          >
            <span style={{ fontSize: "1em", lineHeight: "1" }}>←</span>
            Back to Home
          </button>
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-12 py-12 [background:linear-gradient(120deg,white_40%,#a084e8_85%,#e0d7ff_100%)] shadow-[0_4px_32px_0_rgba(102,102,255,0.10)]">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
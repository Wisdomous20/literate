import Image from "next/image";
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
      </div>
      <div className="flex flex-1 items-center justify-center px-12 py-12 [background:linear-gradient(120deg,white_40%,#a084e8_85%,#e0d7ff_100%)] shadow-[0_4px_32px_0_rgba(102,102,255,0.10)]">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
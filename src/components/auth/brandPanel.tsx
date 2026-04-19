import Image from "next/image";
import React from "react";

export function BrandPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:flex w-full min-h-140">
      <div className="hidden lg:flex flex-col justify-center items-center bg-[#6666FF] rounded-l-3xl relative min-h-140 w-1/2 overflow-hidden">
        <div className="absolute inset-0 brandpanel-ellipse-bg" />
        <div className="absolute inset-0 brandpanel-ellipse-light">
          <Image
            src="/brand_panel.svg"
            alt="Brand Panel Illustration"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-12 py-12 bg-[#6666FF] rounded-r-3xl">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

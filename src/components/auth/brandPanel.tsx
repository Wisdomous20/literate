import Image from "next/image";
import Link from "next/link";
import React from "react";

export function BrandPanel({
  children,
  imageSrc = "/assets/IMG_6_5.svg",
  eyebrow = "LiteRate",
  title = "Reading assessment, ready when class starts.",
  description = "Sign in to manage classes, run assessments, and review student progress in one focused workspace.",
}: {
  children: React.ReactNode;
  imageSrc?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className="grid w-full overflow-hidden rounded-[24px] border border-[#DED7FF] bg-white shadow-[0_24px_80px_rgba(56,47,118,0.14)] lg:min-h-[620px] lg:grid-cols-[1.02fr_0.98fr]">
      <div className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#E8E4FF_0%,#F5E9FF_46%,#E9F7FF_100%)] lg:flex lg:flex-col lg:justify-between">
        <div className="auth-orb auth-orb-slow absolute left-[-140px] top-[-100px] h-[360px] w-[360px] rounded-full bg-[#CFC6FF]" />
        <div className="auth-orb auth-orb-medium absolute right-[-80px] top-[110px] h-[220px] w-[220px] rounded-full bg-[#FFD8EC]/70 blur-sm" />
        <div className="auth-orb auth-orb-slow-reverse absolute bottom-[-160px] right-[-120px] h-[390px] w-[390px] rounded-full bg-white/70" />
        <div className="auth-orb auth-orb-fast absolute bottom-24 left-12 h-20 w-20 rounded-full bg-[#B9F1FF]/70 blur-md" />

        <Link
          href="/"
          className="relative z-20 m-8 inline-flex w-fit items-center gap-3 rounded-[14px] bg-white px-4 py-3 text-sm font-semibold text-[#6C4EEB] shadow-[0_10px_30px_rgba(76,59,171,0.12)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(76,59,171,0.16)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6C4EEB]/20"
        >
          <Image
            src="/Final%20Icon%20Logo.svg"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7"
          />
          Back to Home
        </Link>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-12 pb-12 text-center">
          <div className="relative mb-8 aspect-square w-full max-w-[390px]">
            <div className="auth-orb auth-orb-medium absolute inset-[15%] rounded-full bg-[radial-gradient(circle,#FFFFFF_0%,#EFE9FF_58%,rgba(255,255,255,0)_74%)]" />
            <Image
              src={imageSrc}
              alt="LiteRate reading assessment illustration"
              fill
              className="auth-mascot-clean object-contain"
              priority
            />
          </div>
          <div className="max-w-sm">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#6C4EEB]">
              {eyebrow}
            </p>
            <h2 className="text-3xl font-bold leading-tight text-[#323743]">
              {title}
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#575E6B]">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-[620px] flex-1 items-center justify-center overflow-hidden px-6 py-10 sm:px-10 lg:px-14">
        <div className="auth-orb auth-orb-slow absolute right-[-120px] top-[-120px] h-64 w-64 rounded-full bg-[#F3F0FF]" />
        <div className="auth-orb auth-orb-medium absolute bottom-[-150px] left-[-130px] h-72 w-72 rounded-full bg-[#FFF0F7]" />
        <div className="w-full max-w-[390px]">{children}</div>
      </div>
    </div>
  );
}

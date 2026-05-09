import Navbar from "@/components/home/Navbar";
import HeroSection from "@/components/home/HeroSection";
import ProblemSection from "@/components/home/ProblemSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import ReadingLevelsSection from "@/components/home/ReadingLevelsSection";
import MiscuesSection from "@/components/home/MiscuesSection";
import BenefitsSection from "@/components/home/BenefitsSection";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/home/Footer";
import DotNav from "@/components/home/DotNav";
import LandingScrollEffects from "@/components/home/LandingScrollEffects";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div data-landing-page className="relative min-h-screen font-sans text-[#323743]">
      {/* Full-page background */}
      <div data-landing-bg className="fixed inset-0 -z-10 opacity-[0.17] pointer-events-none">
        <Image
          src="/assets/landing-bg-ai-v2.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
      </div>
      <Navbar />
      <DotNav />
      <LandingScrollEffects />
      <div id="hero" data-scroll-scene="hero"><HeroSection /></div>
      <div id="problem" data-scroll-scene="problem"><ProblemSection /></div>
      <div id="how-it-works" data-scroll-scene="how-it-works"><HowItWorksSection /></div>
      <div id="reading-levels" data-scroll-scene="reading-levels"><ReadingLevelsSection /></div>
      <div id="miscues" data-scroll-scene="miscues"><MiscuesSection /></div>
      <div id="benefits" data-scroll-scene="benefits"><BenefitsSection /></div>
      <div id="cta" data-scroll-scene="cta"><CTASection /></div>
      <Footer />
    </div>
  );
}

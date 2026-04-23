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
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen font-sans text-[#323743]">
      {/* Full-page background */}
      <div className="fixed inset-0 -z-10 opacity-[0.17] pointer-events-none">
        <Image
          src="/assets/IMG_2.svg"
          alt=""
          fill
          className="object-cover"
          priority
        />
      </div>
      <Navbar />
      <DotNav />
      <div id="hero"><HeroSection /></div>
      <div id="problem"><ProblemSection /></div>
      <div id="how-it-works"><HowItWorksSection /></div>
      <div id="reading-levels"><ReadingLevelsSection /></div>
      <div id="miscues"><MiscuesSection /></div>
      <div id="benefits"><BenefitsSection /></div>
      <div id="cta"><CTASection /></div>
      <Footer />
    </div>
  );
}

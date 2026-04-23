import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import PricingSection from "@/components/home/PricingSection";
import Image from "next/image";

export default function PricingPage() {
  return (
    <div className="relative min-h-screen font-sans text-[#323743]">
      {/* Full-page background */}
      <div className="fixed inset-0 -z-10 opacity-10 pointer-events-none">
        <Image
          src="/assets/IMG_2.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
      </div>
      <Navbar />
      <div className="pt-24">
        <PricingSection />
      </div>
      <Footer />
    </div>
  );
}

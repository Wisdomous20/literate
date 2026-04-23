import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import AssessHeroSection from "@/components/home/AssessHeroSection";
import AssessVideoSection from "@/components/home/AssessVideoSection";
import AssessBreakdownSection from "@/components/home/AssessBreakdownSection";
import AssessCTASection from "@/components/home/AssessCTASection";
import Image from "next/image";

export const metadata = {
  title: "Assessments | LiteRate",
  description:
    "Explore LiteRate's three Phil-IRI assessment types: Oral Reading, Oral Fluency, and Reading Comprehension — and watch tutorial videos showing how each one works.",
};

export default function AssessmentPage() {
  return (
    <div className="relative min-h-screen font-sans text-[#323743]">
      {/* Full-page background — same as home */}
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

      <AssessHeroSection />
      <AssessVideoSection />
      <AssessBreakdownSection />
      <AssessCTASection />

      <Footer />
    </div>
  );
}

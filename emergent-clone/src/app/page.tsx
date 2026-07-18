import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { LogoCloud } from "@/components/marketing/LogoCloud";
import { Features } from "@/components/marketing/Features";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Showcase } from "@/components/marketing/Showcase";
import { Testimonials } from "@/components/marketing/Testimonials";
import { Pricing } from "@/components/marketing/Pricing";
import { CTA } from "@/components/marketing/CTA";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <LogoCloud />
        <Features />
        <HowItWorks />
        <Showcase />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

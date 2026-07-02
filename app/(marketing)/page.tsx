import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { HeroSection } from "@/components/marketing/hero-section";
import { SocialProofSection } from "@/components/marketing/social-proof-section";
import { ProblemSection } from "@/components/marketing/problem-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { UploadPlaceholderSection } from "@/components/marketing/upload-placeholder-section";
import { AudienceSection } from "@/components/marketing/audience-section";
import { ComparisonSection } from "@/components/marketing/comparison-section";
import { ReportPreviewSection } from "@/components/marketing/report-preview-section";
import { ValuePropSection } from "@/components/marketing/value-prop-section";
import { PrivacySection } from "@/components/marketing/privacy-section";
import { FAQSection } from "@/components/marketing/faq-section";
import { FinalCTASection } from "@/components/marketing/final-cta-section";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <SocialProofSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <UploadPlaceholderSection />
        <AudienceSection />
        <ComparisonSection />
        <ReportPreviewSection />
        <ValuePropSection />
        <PrivacySection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </>
  );
}

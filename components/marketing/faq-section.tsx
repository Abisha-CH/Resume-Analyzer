import { Section, SectionHeading } from "@/components/ui/section";
import { FAQAccordion } from "@/components/ui/faq-accordion";
import { faqItems } from "@/content/landing";

export function FAQSection() {
  return (
    <Section id="faq" bg="white" size="sm">
      <SectionHeading heading="Frequently Asked Questions" />
      <FAQAccordion items={faqItems} />
    </Section>
  );
}

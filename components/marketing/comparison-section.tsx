import { Section, SectionHeading } from "@/components/ui/section";
import { ComparisonTable } from "@/components/ui/comparison-table";
import { comparison } from "@/content/landing";

export function ComparisonSection() {
  return (
    <Section bg="gray" size="md">
      <SectionHeading heading={comparison.headline} />
      <ComparisonTable rows={comparison.rows} />
    </Section>
  );
}

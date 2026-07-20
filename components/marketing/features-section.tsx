"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Search,
  Lightbulb,
  Wand2,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";
import { FeatureCard } from "@/components/ui/feature-card";
import { features } from "@/content/landing";

const iconMap: Record<string, LucideIcon> = {
  BarChart3,
  Search,
  Lightbulb,
  Wand2,
  Target,
  TrendingUp,
};

export function FeaturesSection() {
  return (
    <Section id="features" bg="white">
      <SectionHeading
        heading="What You'll Get"
        subheading="Everything you need to turn your resume into an interview magnet."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => {
          const Icon = iconMap[feature.icon] ?? BarChart3;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: "easeOut" }}
            >
              <FeatureCard
                icon={Icon}
                title={feature.title}
                description={feature.description}
              />
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

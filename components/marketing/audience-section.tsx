"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { audience } from "@/content/landing";

export function AudienceSection() {
  return (
    <section className="bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
          {audience.headline}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-foreground-muted">
          {audience.subheadline}
        </p>
        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-foreground-subtle">
          {audience.subtext}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {audience.items.map((item, i) => (
            <motion.span
              key={item}
              className="flex items-center gap-1.5 rounded-full border border-primary-muted bg-primary-light px-4 py-2 text-sm font-medium text-primary transition-all duration-150 hover:bg-primary hover:text-white hover:border-primary"
              initial={{ opacity: 0, scale: 0.88 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" }}
            >
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              {item}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}

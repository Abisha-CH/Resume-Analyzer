"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { TrustBadge } from "@/components/ui/trust-badge";
import { privacy } from "@/content/landing";

export function PrivacySection() {
  return (
    <section className="bg-surface-subtle py-16 sm:py-20">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-success-light ring-1 ring-success-muted"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, type: "spring", stiffness: 220, damping: 16 }}
        >
          <ShieldCheck className="h-7 w-7 text-success" aria-hidden="true" />
        </motion.div>

        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          {privacy.headline}
        </h2>
        <p className="mt-3 text-foreground-muted">{privacy.subheadline}</p>

        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          {privacy.items.map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.28, delay: i * 0.06 }}
            >
              <TrustBadge variant="green" showIcon={false}>
                <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                {item}
              </TrustBadge>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

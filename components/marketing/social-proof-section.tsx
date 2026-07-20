"use client";

import { motion } from "framer-motion";
import { socialProof } from "@/content/landing";

export function SocialProofSection() {
  return (
    <section
      aria-label="Trusted platforms"
      className="border-y border-border-subtle bg-surface py-10"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="mb-1 text-center text-xs font-semibold uppercase tracking-widest text-foreground-subtle">
          {socialProof.subheadline}
        </p>
        <p className="mb-7 text-center text-sm text-foreground-muted">
          {socialProof.headline}
        </p>

        <ul
          className="flex flex-wrap justify-center gap-2.5"
          aria-label="Supported job platforms"
          role="list"
        >
          {socialProof.platforms.map((platform, i) => (
            <motion.li
              key={platform}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
            >
              <span className="inline-flex cursor-default select-none items-center rounded-full border border-border bg-surface-subtle px-4 py-1.5 text-sm font-medium text-foreground-muted transition-all duration-200 hover:border-primary-muted hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1">
                {platform}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

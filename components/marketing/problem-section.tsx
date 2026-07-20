"use client";

import { motion } from "framer-motion";
import { XCircle, CheckCircle2 } from "lucide-react";
import { problem } from "@/content/landing";

export function ProblemSection() {
  return (
    <section className="bg-surface-subtle py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Stat banner */}
        <motion.div
          className="mb-14 overflow-hidden rounded-2xl bg-primary px-8 py-10 text-center shadow-lg shadow-primary/20"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <p className="text-6xl font-extrabold tabular-nums text-white sm:text-7xl">
            {problem.stat}
          </p>
          <p className="mt-2 text-base font-medium text-accent sm:text-lg">
            {problem.statDescription}
          </p>
        </motion.div>

        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            {problem.headline}
          </h2>
        </div>

        <ul className="space-y-3" aria-label="Common resume rejection reasons">
          {problem.items.map((item, i) => (
            <motion.li
              key={item}
              className="flex items-start gap-3 rounded-xl border border-error-muted bg-surface px-5 py-4 shadow-sm"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.35, delay: i * 0.07, ease: "easeOut" }}
            >
              <XCircle
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-error"
                aria-hidden="true"
              />
              <span className="text-sm text-foreground-muted">{item}</span>
            </motion.li>
          ))}
        </ul>

        {/* Solution line */}
        <motion.div
          className="mt-5 flex items-start gap-3 rounded-xl border border-success-muted bg-success-light px-5 py-4 shadow-sm"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.38, ease: "easeOut" }}
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-success"
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-foreground">{problem.solution}</span>
        </motion.div>
      </div>
    </section>
  );
}

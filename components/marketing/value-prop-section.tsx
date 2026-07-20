"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { valueProp } from "@/content/landing";

export function ValuePropSection() {
  return (
    <section className="relative overflow-hidden bg-primary py-20 sm:py-24">
      {/* Subtle background texture */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <motion.h2
          className="text-3xl font-bold text-white sm:text-4xl"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {valueProp.headline}
        </motion.h2>
        <motion.p
          className="mt-4 text-lg text-accent"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
        >
          {valueProp.subheadline}
        </motion.p>

        <ul className="mt-10 space-y-3" aria-label="Value proposition points">
          {valueProp.points.map((point, i) => (
            <motion.li
              key={point}
              className="flex items-center justify-center gap-3 rounded-xl bg-white/10 px-6 py-4 text-base font-medium text-white backdrop-blur-sm"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.16 + i * 0.08, ease: "easeOut" }}
            >
              <CheckCircle2
                className="h-5 w-5 flex-shrink-0 text-accent"
                aria-hidden="true"
              />
              {point}
            </motion.li>
          ))}
        </ul>

        <motion.p
          className="mt-10 text-lg font-semibold text-white"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
        >
          {valueProp.cta}
        </motion.p>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { audience } from "@/content/landing";

export function AudienceSection() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          {audience.headline}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
          {audience.subheadline}
        </p>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
          {audience.subtext}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {audience.items.map((item, i) => (
            <motion.span
              key={item}
              className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
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

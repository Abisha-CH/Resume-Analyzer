"use client";

import { motion } from "framer-motion";
import { XCircle, CheckCircle2 } from "lucide-react";
import { problem } from "@/content/landing";

export function ProblemSection() {
  return (
    <section className="bg-gray-50 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Stat banner */}
        <div className="mb-12 rounded-2xl bg-blue-600 px-8 py-10 text-center text-white shadow-md">
          <p className="text-6xl font-extrabold tabular-nums">{problem.stat}</p>
          <p className="mt-2 text-lg font-medium text-blue-100">
            {problem.statDescription}
          </p>
        </div>

        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
          {problem.headline}
        </h2>

        <ul className="space-y-3" aria-label="Common resume rejection reasons">
          {problem.items.map((item, i) => (
            <motion.li
              key={item}
              className="flex items-start gap-3 rounded-xl border border-red-100 bg-white px-5 py-4 shadow-sm"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
            >
              <XCircle
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
                aria-hidden="true"
              />
              <span className="text-gray-700">{item}</span>
            </motion.li>
          ))}
        </ul>

        {/* Solution line */}
        <motion.div
          className="mt-8 flex items-start gap-3 rounded-xl bg-green-50 px-5 py-4 shadow-sm border border-green-200"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.4 }}
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
            aria-hidden="true"
          />
          <span className="font-medium text-green-800">{problem.solution}</span>
        </motion.div>
      </div>
    </section>
  );
}

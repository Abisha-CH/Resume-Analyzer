"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { reportPreview } from "@/content/landing";

export function ReportPreviewSection() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          {reportPreview.headline}
        </h2>
        <p className="mt-3 text-lg text-gray-500">{reportPreview.subheadline}</p>

        <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {reportPreview.items.map((item, i) => (
              <motion.div
                key={item}
                className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.28, delay: i * 0.05 }}
              >
                <CheckCircle2
                  className="h-4 w-4 flex-shrink-0 text-blue-500"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-gray-700">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

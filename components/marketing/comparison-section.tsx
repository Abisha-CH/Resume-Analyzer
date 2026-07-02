"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { comparison } from "@/content/landing";

export function ComparisonSection() {
  return (
    <section className="bg-gray-50 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
          {comparison.headline}
        </h2>

        <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
          <table className="w-full" aria-label="Feature comparison table">
            <thead>
              <tr className="border-b border-gray-200">
                <th
                  scope="col"
                  className="bg-red-50 px-6 py-4 text-left text-sm font-semibold text-red-700 w-1/2"
                >
                  Others
                </th>
                <th
                  scope="col"
                  className="bg-blue-600 px-6 py-4 text-left text-sm font-semibold text-white w-1/2"
                >
                  Our Platform
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row, i) => (
                <motion.tr
                  key={i}
                  className="border-b border-gray-100 last:border-0"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                >
                  <td className="bg-white px-6 py-4">
                    <span className="flex items-center gap-2 text-sm text-gray-600">
                      <X
                        className="h-4 w-4 flex-shrink-0 text-red-400"
                        aria-hidden="true"
                      />
                      {row.others}
                    </span>
                  </td>
                  <td className="bg-blue-50 px-6 py-4">
                    <span className="flex items-center gap-2 text-sm font-medium text-blue-800">
                      <Check
                        className="h-4 w-4 flex-shrink-0 text-blue-600"
                        aria-hidden="true"
                      />
                      {row.ours}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

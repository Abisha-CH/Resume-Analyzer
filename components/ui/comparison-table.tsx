"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

export interface ComparisonRow {
  others: string;
  ours: string;
}

export interface ComparisonTableProps {
  rows: ComparisonRow[];
  /** Column header for the "others" side */
  othersLabel?: string;
  /** Column header for the "ours" side */
  oursLabel?: string;
  /** Optional aria-label for the table */
  label?: string;
}

/**
 * Reusable comparison table with animated rows.
 * Displays two-column comparison between competitors and our platform.
 */
export function ComparisonTable({
  rows,
  othersLabel = "Others",
  oursLabel = "Our Platform",
  label = "Feature comparison table",
}: ComparisonTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
      <table className="w-full" aria-label={label}>
        <thead>
          <tr className="border-b border-gray-200">
            <th
              scope="col"
              className="w-1/2 bg-red-50 px-6 py-4 text-left text-sm font-semibold text-red-700"
            >
              {othersLabel}
            </th>
            <th
              scope="col"
              className="w-1/2 bg-blue-600 px-6 py-4 text-left text-sm font-semibold text-white"
            >
              {oursLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
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
  );
}

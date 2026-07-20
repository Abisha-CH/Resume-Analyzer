"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

export interface ComparisonRow {
  others: string;
  ours: string;
}

export interface ComparisonTableProps {
  rows: ComparisonRow[];
  othersLabel?: string;
  oursLabel?: string;
  label?: string;
}

/**
 * Reusable comparison table with animated rows.
 */
export function ComparisonTable({
  rows,
  othersLabel = "Others",
  oursLabel = "Our Platform",
  label = "Feature comparison table",
}: ComparisonTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-md shadow-foreground/5">
      <table className="w-full" aria-label={label}>
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="w-1/2 bg-error-light px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-error"
            >
              {othersLabel}
            </th>
            <th
              scope="col"
              className="w-1/2 bg-primary px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white"
            >
              {oursLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={i}
              className="border-b border-border-subtle last:border-0"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <td className="bg-surface px-6 py-3.5">
                <span className="flex items-center gap-2 text-sm text-foreground-muted">
                  <X className="h-4 w-4 flex-shrink-0 text-error" aria-hidden="true" />
                  {row.others}
                </span>
              </td>
              <td className="bg-primary-light px-6 py-3.5">
                <span className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Check className="h-4 w-4 flex-shrink-0 text-success" aria-hidden="true" />
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

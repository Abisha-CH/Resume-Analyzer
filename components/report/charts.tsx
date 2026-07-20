"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ── Horizontal bar chart ─────────────────────────────────────────── */
interface BarChartRow {
  label: string;
  value: number;
  color?: string;
}

interface HorizontalBarChartProps {
  rows: BarChartRow[];
  title: string;
}

export function HorizontalBarChart({ rows, title }: HorizontalBarChartProps) {
  return (
    <div>
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-wide text-foreground-subtle">
        {title}
      </p>
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted">
                {row.label}
              </span>
              <span className="text-xs font-bold text-foreground tabular-nums">
                {row.value}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-subtle ring-1 ring-border">
              <motion.div
                className={cn("h-full rounded-full", row.color ?? "bg-primary")}
                initial={{ width: 0 }}
                whileInView={{ width: `${row.value}%` }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.65,
                  delay: i * 0.08,
                  ease: "easeOut",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Donut / gauge chart ──────────────────────────────────────────── */
interface DonutChartProps {
  value: number;
  label: string;
  sublabel?: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
}

export function DonutChart({
  value,
  label,
  sublabel,
  color = "var(--color-primary)",
  size = 96,
  strokeWidth = 8,
}: DonutChartProps) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          aria-hidden="true"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-surface-subtle"
          />
          {/* Value — rendered as a static SVG; animation via CSS */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            strokeWidth={strokeWidth}
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            initial={{ strokeDasharray: `0 ${circ}` }}
            whileInView={{ strokeDasharray: `${dash} ${circ - dash}` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-foreground tabular-nums">
            {value}
          </span>
          {sublabel && (
            <span className="text-[9px] font-medium text-foreground-subtle">
              {sublabel}
            </span>
          )}
        </div>
      </div>
      <span className="text-center text-[11px] font-medium text-foreground-muted">
        {label}
      </span>
    </div>
  );
}

/* ── Segmented bar (completeness) ────────────────────────────────── */
interface SegmentedBarProps {
  segments: { label: string; value: number; color: string }[];
  title: string;
}

export function SegmentedBar({ segments, title }: SegmentedBarProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <div>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-foreground-subtle">
        {title}
      </p>
      {/* Bar */}
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.label}
            className={cn("h-full", seg.color)}
            style={{ width: `${(seg.value / total) * 100}%` }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            title={`${seg.label}: ${seg.value}%`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span
              className={cn("h-2 w-2 rounded-full", seg.color)}
              aria-hidden="true"
            />
            <span className="text-[10px] text-foreground-muted">
              {seg.label} {seg.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

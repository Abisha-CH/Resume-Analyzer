"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Upload, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hero } from "@/content/landing";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 sm:py-28">
      {/* Subtle background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Badge variant="blue" className="mb-6">
            #1 AI Resume Checker for Pakistan
          </Badge>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >
          {hero.headline}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="mx-auto mt-5 max-w-2xl text-lg text-gray-600 sm:text-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
        >
          {hero.subheadline}
        </motion.p>

        {/* Benefit bullets */}
        <motion.ul
          className="mx-auto mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2"
          aria-label="Key benefits"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.22 }}
        >
          {hero.benefits.map((benefit) => (
            <li
              key={benefit}
              className="flex items-center gap-1.5 text-sm text-gray-700"
            >
              <CheckCircle2
                className="h-4 w-4 flex-shrink-0 text-green-500"
                aria-hidden="true"
              />
              {benefit}
            </li>
          ))}
        </motion.ul>

        {/* CTAs */}
        <motion.div
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Button size="lg" className="w-full sm:w-auto gap-2">
            <Upload className="h-4 w-4" aria-hidden="true" />
            {hero.primaryCTA}
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
            {hero.secondaryCTA}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </motion.div>

        {/* Trust text */}
        <motion.p
          className="mt-5 text-xs text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.38 }}
          aria-label="Trust reassurances"
        >
          {hero.trustBadges.join(" • ")}
        </motion.p>
      </div>
    </section>
  );
}

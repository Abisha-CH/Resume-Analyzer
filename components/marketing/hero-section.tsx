"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Upload, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hero } from "@/content/landing";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface-subtle via-background to-background py-24 sm:py-32">
      {/* Multi-layered background glow */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-accent/20 blur-[80px]" />
        <div className="absolute right-1/4 top-1/4 h-48 w-48 rounded-full bg-primary-muted/30 blur-[60px]" />
      </div>

      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Badge
            variant="primary"
            className="mb-8 gap-1.5 px-4 py-1.5 text-xs font-semibold tracking-wide shadow-sm"
          >
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            #1 AI Resume Checker for Pakistan
          </Badge>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] lg:leading-[1.15]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
        >
          {hero.headline}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-foreground-muted sm:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16, ease: "easeOut" }}
        >
          {hero.subheadline}
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24, ease: "easeOut" }}
        >
          <Link href="/sign-up">
            <Button
              size="lg"
              className="w-full shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 sm:w-auto gap-2 transition-all duration-150"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {hero.primaryCTA}
            </Button>
          </Link>
          <Link href="/resume-overview">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto gap-2 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
            >
              {hero.secondaryCTA}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </motion.div>

        {/* Benefit bullets */}
        <motion.ul
          className="mx-auto mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2"
          aria-label="Key benefits"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.34 }}
        >
          {hero.benefits.map((benefit) => (
            <li
              key={benefit}
              className="flex items-center gap-1.5 text-sm text-foreground-muted"
            >
              <CheckCircle2
                className="h-3.5 w-3.5 flex-shrink-0 text-success"
                aria-hidden="true"
              />
              {benefit}
            </li>
          ))}
        </motion.ul>

        {/* Trust text */}
        <motion.p
          className="mt-5 text-xs text-foreground-subtle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.42 }}
          aria-label="Trust reassurances"
        >
          {hero.trustBadges.join(" · ")}
        </motion.p>
      </div>
    </section>
  );
}

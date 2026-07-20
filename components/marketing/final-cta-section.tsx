"use client";

import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { finalCTA } from "@/content/landing";

export function FinalCTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary to-primary-hover py-24 sm:py-28">
      {/* Background glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 -translate-y-1/4 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute left-1/4 bottom-0 h-48 w-48 translate-y-1/4 rounded-full bg-accent/15 blur-2xl" />
        <div className="absolute right-1/4 bottom-0 h-48 w-48 translate-y-1/4 rounded-full bg-accent/10 blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <motion.h2
          className="text-balance text-3xl font-bold text-white sm:text-4xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {finalCTA.headline}
        </motion.h2>
        <motion.p
          className="mx-auto mt-4 max-w-lg text-lg text-accent"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
        >
          {finalCTA.subheadline}
        </motion.p>

        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.18, ease: "easeOut" }}
        >
          <Link href="/sign-up">
            <Button
              size="lg"
              className="bg-surface text-primary hover:bg-surface-subtle focus-visible:ring-white shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {finalCTA.primaryCTA}
            </Button>
          </Link>
        </motion.div>

        <motion.p
          className="mt-5 text-sm text-accent/80"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {finalCTA.reassurance}
        </motion.p>
      </div>
    </section>
  );
}

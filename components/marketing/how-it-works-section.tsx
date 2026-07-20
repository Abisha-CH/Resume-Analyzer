"use client";

import { motion } from "framer-motion";
import { Upload, Cpu, FileSearch, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { steps, hero } from "@/content/landing";

const stepIcons = [Upload, Cpu, FileSearch, Download];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-surface-subtle py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-lg text-foreground-muted">
            Get your personalized resume report in four easy steps.
          </p>
        </div>

        <ol className="space-y-0" aria-label="How it works steps">
          {steps.map((step, i) => {
            const Icon = stepIcons[i] ?? Upload;
            const isLast = i === steps.length - 1;
            return (
              <motion.li
                key={step.step}
                className="relative flex gap-5 list-none pb-8 last:pb-0"
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
              >
                {/* Vertical connector */}
                {!isLast && (
                  <div
                    aria-hidden="true"
                    className="absolute left-[1.375rem] top-12 bottom-0 w-px bg-primary-muted"
                  />
                )}

                {/* Step icon */}
                <div className="relative flex-shrink-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/25">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span
                    aria-hidden="true"
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[10px] font-bold text-primary ring-1 ring-primary-muted"
                  >
                    {step.step}
                  </span>
                </div>

                {/* Content */}
                <div className="pb-1 pt-1">
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                    {step.description}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ol>

        <div className="mt-12 text-center">
          <Link href="/sign-up">
            <Button
              size="lg"
              className="shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
            >
              {hero.primaryCTA}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

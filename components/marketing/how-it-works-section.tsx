"use client";

import { motion } from "framer-motion";
import { Upload, Cpu, FileSearch, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { steps, hero } from "@/content/landing";

const stepIcons = [Upload, Cpu, FileSearch, Download];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-gray-50 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            Get your personalized resume report in four easy steps.
          </p>
        </div>

        <ol className="relative" aria-label="How it works steps">
          {/* Vertical connector line — desktop */}
          <div
            aria-hidden="true"
            className="absolute left-6 top-8 hidden h-[calc(100%-4rem)] w-px bg-blue-100 lg:block"
          />

          <div className="space-y-10">
            {steps.map((step, i) => {
              const Icon = stepIcons[i] ?? Upload;
              return (
                <motion.li
                  key={step.step}
                  className="flex items-start gap-5 list-none"
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.1 }}
                >
                  {/* Step number + icon */}
                  <div className="relative flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-600 ring-1 ring-blue-200">
                      {step.step}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="pt-1.5">
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{step.description}</p>
                  </div>
                </motion.li>
              );
            })}
          </div>
        </ol>

        {/* CTA */}
        <div className="mt-14 text-center">
          <Button size="lg">{hero.primaryCTA}</Button>
        </div>
      </div>
    </section>
  );
}

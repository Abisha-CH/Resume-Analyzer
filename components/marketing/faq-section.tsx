"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faqItems } from "@/content/landing";
import { cn } from "@/lib/utils";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <section id="faq" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
          Frequently Asked Questions
        </h2>

        <dl className="space-y-3">
          {faqItems.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={item.question}
                className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden"
              >
                <dt>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                    onClick={() => toggle(i)}
                    aria-expanded={isOpen}
                  >
                    {item.question}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 flex-shrink-0 text-gray-500 transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </dt>
                <dd
                  className={cn(
                    "overflow-hidden text-sm text-gray-600 transition-all duration-200",
                    isOpen ? "max-h-40 px-5 pb-4" : "max-h-0"
                  )}
                >
                  {item.answer}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}

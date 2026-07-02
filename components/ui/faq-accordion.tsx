"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQAccordionProps {
  items: FAQItem[];
  /** Optional className for the outer dl element */
  className?: string;
}

/**
 * Accessible accordion component for FAQ sections.
 * Uses proper aria-expanded + aria-controls + id pairing.
 */
export function FAQAccordion({ items, className }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) =>
    setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <dl className={cn("space-y-3", className)}>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        const triggerId = `faq-trigger-${i}`;
        const panelId = `faq-panel-${i}`;

        return (
          <div
            key={item.question}
            className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
          >
            <dt>
              <button
                id={triggerId}
                type="button"
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                {item.question}
                <ChevronDown
                  className={cn(
                    "ml-4 h-4 w-4 flex-shrink-0 text-gray-500 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>
            </dt>
            <dd
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              className={cn(
                "overflow-hidden text-sm text-gray-600 transition-all duration-200",
                isOpen ? "max-h-60 px-5 pb-4 pt-1" : "max-h-0"
              )}
            >
              {item.answer}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

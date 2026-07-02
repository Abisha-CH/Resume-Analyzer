import { CheckCircle2 } from "lucide-react";
import { valueProp } from "@/content/landing";

export function ValuePropSection() {
  return (
    <section className="bg-blue-600 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          {valueProp.headline}
        </h2>
        <p className="mt-4 text-lg text-blue-100">{valueProp.subheadline}</p>

        <ul className="mt-8 space-y-4" aria-label="Value proposition points">
          {valueProp.points.map((point) => (
            <li
              key={point}
              className="flex items-center justify-center gap-3 text-lg text-white"
            >
              <CheckCircle2
                className="h-5 w-5 flex-shrink-0 text-blue-200"
                aria-hidden="true"
              />
              {point}
            </li>
          ))}
        </ul>

        <p className="mt-8 text-xl font-semibold text-white">{valueProp.cta}</p>
      </div>
    </section>
  );
}

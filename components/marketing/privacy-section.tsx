import { ShieldCheck } from "lucide-react";
import { privacy } from "@/content/landing";

export function PrivacySection() {
  return (
    <section className="bg-gray-50 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <ShieldCheck className="h-7 w-7 text-green-600" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {privacy.headline}
        </h2>
        <p className="mt-3 text-gray-500">{privacy.subheadline}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {privacy.items.map((item) => (
            <span
              key={item}
              className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700"
            >
              <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

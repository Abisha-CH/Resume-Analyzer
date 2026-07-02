import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { finalCTA } from "@/content/landing";

export function FinalCTASection() {
  return (
    <section className="bg-gradient-to-b from-blue-600 to-blue-700 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          {finalCTA.headline}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
          {finalCTA.subheadline}
        </p>
        <div className="mt-10">
          <Button
            size="lg"
            className="bg-white text-blue-700 hover:bg-blue-50 focus-visible:ring-white shadow-lg"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {finalCTA.primaryCTA}
          </Button>
        </div>
        <p className="mt-4 text-sm text-blue-200">{finalCTA.reassurance}</p>
      </div>
    </section>
  );
}

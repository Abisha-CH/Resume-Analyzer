import { socialProof } from "@/content/landing";

export function SocialProofSection() {
  return (
    <section className="border-y border-gray-100 bg-white py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-medium text-gray-500 mb-5">
          {socialProof.headline}
        </p>
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">
          {socialProof.subheadline}
        </p>
        <div
          className="flex flex-wrap justify-center gap-3"
          aria-label="Supported job platforms"
        >
          {socialProof.platforms.map((platform) => (
            <span
              key={platform}
              className="rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-medium text-gray-600"
            >
              {platform}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

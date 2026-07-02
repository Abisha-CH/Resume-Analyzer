import Link from "next/link";
import { FileText } from "lucide-react";
import { footer } from "@/content/landing";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-gray-900"
            >
              <FileText
                className="h-5 w-5 text-blue-600"
                aria-hidden="true"
              />
              <span>{footer.brand}</span>
            </Link>
            <p className="mt-3 text-sm text-gray-500 max-w-xs">
              {footer.tagline}
            </p>
          </div>

          {/* Link groups */}
          {footer.linkGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-gray-900">
                {group.title}
              </h3>
              <ul className="mt-3 space-y-2" role="list">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          {footer.copyright}
        </div>
      </div>
    </footer>
  );
}

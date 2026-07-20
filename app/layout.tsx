import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { siteMetadata } from "@/content/landing";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://resumind.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: siteMetadata.title,
  description: siteMetadata.description,
  keywords: siteMetadata.keywords,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: BASE_URL,
    siteName: "ResuMind",
    locale: "en_PK",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ResuMind — AI Resume Analyzer & ATS Checker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteMetadata.title,
    description: siteMetadata.description,
    images: ["/og-image.png"],
  },
};

/** JSON-LD structured data for Google rich results */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ResuMind",
  url: BASE_URL,
  description: siteMetadata.description,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "PKR",
  },
  audience: {
    "@type": "Audience",
    audienceType: "Job Seekers in Pakistan",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted static data
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

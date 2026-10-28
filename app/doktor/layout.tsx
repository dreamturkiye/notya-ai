import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Outfit } from "next/font/google";
import "./utilities.css";
import "./landing.css";
import { DOKTOR_DESCRIPTION, DOKTOR_TITLE, DOKTOR_URL, doktorHreflang } from "@/lib/seo/doktor";

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit-face",
  display: "swap",
});

// NOTYA-DOKTOR-SEO-01: canonical, hreflang (self + 6 country homes + x-default), Open Graph, Twitter
// Card and robots, at the same bar as the country kit's lib/ulke/seo/meta.ts. og:image / twitter:image
// come from opengraph-image.tsx in this route segment (Next.js file-based convention — no images field
// needed here).
export const metadata: Metadata = {
  title: DOKTOR_TITLE,
  description: DOKTOR_DESCRIPTION,
  alternates: { canonical: DOKTOR_URL, languages: doktorHreflang() },
  openGraph: {
    type: "website",
    url: DOKTOR_URL,
    siteName: "Notya",
    title: DOKTOR_TITLE,
    description: DOKTOR_DESCRIPTION,
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: DOKTOR_TITLE,
    description: DOKTOR_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function DoktorLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`doktor-lp ${fraunces.variable} ${outfit.variable}`}>
      {children}
    </div>
  );
}

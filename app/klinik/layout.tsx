import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Outfit } from "next/font/google";
// NOTYA-KLINIK-01: /klinik intentionally shares the doktor landing's visual system — same fonts,
// same tokens, same scope class — so the two pages read as one brand. The `doktor-lp` class is a
// style scope, not a semantic claim; renaming it product-wide is not worth the churn.
import "../doktor/utilities.css";
import "../doktor/landing.css";

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

export const metadata: Metadata = {
  title: "Notya Klinik — Her koltuğa bir uzman",
  description:
    "Saç ekimi, estetik, fizyoterapi ve sağlık klinikleri için Türkçe yapay zekâ uzmanları. Sesli seans, otomatik not, KVKK'ya uygun. Pabau ile entegre çalışır.",
};

export default function KlinikLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`doktor-lp ${fraunces.variable} ${outfit.variable}`}>
      {children}
    </div>
  );
}

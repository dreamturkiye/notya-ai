import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Outfit } from "next/font/google";
import "./landing.css";

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
  title: "Notya — Cebinizdeki uzman",
  description:
    "Türkiye'nin ilk yapay zekâ tıp uzmanı. Sesli konuşun, tanı alın, reçete yazın. Her seans sizi daha iyi tanır.",
};

export default function DoktorLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`doktor-lp ${fraunces.variable} ${outfit.variable}`}>
      {children}
    </div>
  );
}

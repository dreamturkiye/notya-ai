import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Outfit } from "next/font/google";
import "./utilities.css";
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
  title: "Notya — Hekimler için yapay zekâ klinik asistanı",
  description:
    "Muayeneyi dinler, notunuzu yazar, reçete ve rapor taslağını hazırlar, hastanızı takipte tutar. Hasta portalı dahil, 30 branş. Her karar hekim onayıyla.",
};

export default function DoktorLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`doktor-lp ${fraunces.variable} ${outfit.variable}`}>
      {children}
    </div>
  );
}

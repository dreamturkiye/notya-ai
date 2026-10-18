import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Outfit } from "next/font/google";
import KlinikKabuk from "@/components/klinik/katman/KlinikKabuk";
import "../../doktor/utilities.css";
import "../../doktor/landing.css";

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
  title: "Notya Klinik",
  description: "Notya Klinik kurulumu, ortak takvim ve klinik hafızası. Hekim muayene ekranı aynı kalır.",
};

export default function KlinikMasaLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`doktor-lp ${fraunces.variable} ${outfit.variable}`}>
      <KlinikKabuk>{children}</KlinikKabuk>
    </div>
  );
}

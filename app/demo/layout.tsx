import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Outfit } from "next/font/google";
// NOTYA-DEMO-01: /demo shares the doktor landing's visual system (fonts, tokens, compiled utilities,
// `doktor-lp` scope) so it reads as part of the same site. Listed in tailwind.doktor.config.js `content`.
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
  title: "Demo planla — Notya",
  description: "Dr. Gökhan Mamur ile 60 dakikalık görüntülü demo görüşmesi planlayın.",
};

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`doktor-lp ${fraunces.variable} ${outfit.variable}`}>
      {children}
    </div>
  );
}

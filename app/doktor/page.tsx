"use client";

import { SiteNav } from "@/components/doktor-landing/site-nav";
import { Hero } from "@/components/doktor-landing/hero";
import { Ticker } from "@/components/doktor-landing/ticker";
import { Conversation } from "@/components/doktor-landing/conversation";
import { Learning } from "@/components/doktor-landing/learning";
import { Specialists } from "@/components/doktor-landing/specialists";
import { Safety } from "@/components/doktor-landing/safety";
import { Pricing } from "@/components/doktor-landing/pricing";
import { FinalCta } from "@/components/doktor-landing/cta";
import { SiteFooter } from "@/components/doktor-landing/site-footer";

export default function DoktorLandingPage() {
  return (
    <div className="relative bg-paper text-ink">
      <SiteNav />
      <main>
        <Hero />
        <Ticker />
        <Conversation />
        <Learning />
        <Specialists />
        <Safety />
        <Pricing />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

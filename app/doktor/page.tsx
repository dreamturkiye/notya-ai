import { JsonLd } from "@/components/doktor-landing/JsonLd";
import { doktorYapisalVeri } from "@/lib/seo/doktor";
import { SiteNav } from "@/components/doktor-landing/site-nav";
import { Hero } from "@/components/doktor-landing/hero";
import { DemoSection } from "@/components/doktor-landing/demo-section";
import { Conversation } from "@/components/doktor-landing/conversation";
import {
  Branslar,
  Faturalama,
  HastaPortali,
  Konsultasyon,
  MuayeneSonu,
  OnBuro,
  Takip,
} from "@/components/doktor-landing/practice";
import { Learning } from "@/components/doktor-landing/learning";
import { Safety } from "@/components/doktor-landing/safety";
import { Pricing } from "@/components/doktor-landing/pricing";
import { FinalCta } from "@/components/doktor-landing/cta";
import { SiteFooter } from "@/components/doktor-landing/site-footer";

// NOTYA-LANDING-2026-10: server component so the practice sections can read the specialties
// registry on the server; interactive sections carry their own "use client".
export default function DoktorLandingPage() {
  return (
    <div className="relative bg-paper text-ink">
      <JsonLd veri={doktorYapisalVeri()} />
      <SiteNav />
      <main>
        <Hero />
        <DemoSection />
        <Conversation />
        <MuayeneSonu />
        <HastaPortali />
        <Konsultasyon />
        <OnBuro />
        <Branslar />
        <Takip />
        <Learning />
        <Safety />
        <Faturalama />
        <Pricing />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

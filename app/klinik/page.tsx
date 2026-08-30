"use client";

/**
 * NOTYA-KLINIK-01 — /klinik landing. The klinik vertical shipped with ten personas and a Pabau
 * integration but no public page: it was reachable only through an onboarding dropdown. This is
 * its front door. Pricing reuses CLINIC_PLANS from the doktor landing — one source of truth for
 * seat prices, no invented numbers.
 */
import { useEffect } from "react";
import { KlinikNav } from "@/components/klinik-landing/nav";
import {
  Branslar,
  Entegrasyonlar,
  Guvenlik,
  Hero,
  Isleyis,
  KlinikFooter,
  SonCta,
} from "@/components/klinik-landing/sections";
import { CLINIC_PLANS } from "@/components/doktor-landing/content";
import { ArrowUpRight } from "@/components/doktor-landing/icons";

function Fiyat() {
  return (
    <section id="fiyat" className="bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">05 — Fiyat</p>
        <h2 className="mt-4 font-display text-display font-medium leading-display tracking-display">
          Koltuk başına.
          <span className="italic font-normal"> Şeffaf.</span>
        </h2>
        <ol className="mt-12 divide-y divide-line border-y border-line">
          {CLINIC_PLANS.map((plan) => (
            <li key={plan.name} className="grid gap-4 py-7 sm:grid-cols-3 sm:items-center">
              <div>
                <p className="flex flex-wrap items-baseline gap-3">
                  <span className="font-display text-3xl italic">{plan.name}</span>
                  {plan.highlight ? (
                    <span className="rounded-full bg-pine px-2.5 py-1 font-outfit text-xs uppercase tracking-widest text-cream">
                      En çok tercih
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 font-outfit text-sm text-ink-muted">
                  {plan.price === "Fiyat alın" ? "Kurumsal görüşme" : `₺${plan.price} ${plan.unit}`}
                </p>
              </div>
              <ul className="flex flex-wrap gap-x-3 gap-y-1 font-outfit text-sm text-ink-2">
                {plan.items.map((item, i) => (
                  <li key={item} className="flex items-center gap-3">
                    {i > 0 ? (
                      <span className="text-ink-muted" aria-hidden="true">
                        ·
                      </span>
                    ) : null}
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href={plan.href}
                className="inline-flex h-11 w-fit items-center justify-center gap-1.5 rounded-full bg-pine px-5 font-outfit text-sm font-medium text-cream transition-colors hover:bg-pine-2 sm:justify-self-end"
              >
                {plan.price === "Fiyat alın" ? "İletişim" : "Başlayın"}
                <ArrowUpRight className="size-3.5" />
              </a>
            </li>
          ))}
        </ol>
        <p className="mt-6 font-outfit text-sm text-ink-muted">
          İlk 15 gün ücretsiz. Kredi kartı gerekmez. İstediğiniz an iptal.
        </p>
      </div>
    </section>
  );
}

export default function KlinikLandingPage() {
  // Anchor targets sit behind a fixed header; scroll-mt handles in-page clicks, this handles
  // arriving from outside with a #hash (e.g. /klinik#sac-ekimi from an ad).
  useEffect(() => {
    if (window.location.hash) {
      document.querySelector(window.location.hash)?.scrollIntoView();
    }
  }, []);

  return (
    <div className="relative bg-paper text-ink">
      <KlinikNav />
      <main>
        <Hero />
        <Branslar />
        <Isleyis />
        <Guvenlik />
        <Entegrasyonlar />
        <Fiyat />
        <SonCta />
      </main>
      <KlinikFooter />
    </div>
  );
}

"use client";

import { useState } from "react";
import { CLINIC_PLANS, INDIVIDUAL_PLANS } from "./content";
import { cn } from "./cn";
import { ArrowUpRight } from "./icons";

export function Pricing() {
  const [clinic, setClinic] = useState(false);
  const plans = clinic ? CLINIC_PLANS : INDIVIDUAL_PLANS;

  return (
    <section id="fiyat" className="bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col items-center text-center gap-6">
          <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">11 — Fiyat</p>
          <h2 className="font-display text-display font-medium leading-display tracking-display">
            Sade. Şeffaf.
            <span className="italic font-normal"> Adil.</span>
          </h2>
          <div className="inline-flex rounded-full bg-paper-2 p-1" role="tablist" aria-label="Plan türü">
            <button
              type="button"
              role="tab"
              aria-selected={!clinic}
              onClick={() => setClinic(false)}
              className={cn(
                "h-10 cursor-pointer rounded-full px-5 font-outfit text-sm",
                !clinic ? "bg-ink text-cream" : "text-ink-2",
              )}
            >
              Bireysel
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={clinic}
              onClick={() => setClinic(true)}
              className={cn(
                "h-10 cursor-pointer rounded-full px-5 font-outfit text-sm",
                clinic ? "bg-ink text-cream" : "text-ink-2",
              )}
            >
              Notya Klinik
            </button>
          </div>
        </div>

        <div className={cn(
          "mt-14 grid gap-6",
          plans.length <= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2 xl:grid-cols-4",
        )}>
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-white p-7 shadow-sm",
                plan.highlight
                  ? "border-pine ring-2 ring-pine/20"
                  : "border-line",
              )}
            >
              {plan.highlight ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pine px-3 py-1 font-outfit text-xs uppercase tracking-widest text-cream">
                  En çok tercih
                </span>
              ) : null}

              <h3 className="font-display text-2xl italic text-ink">{plan.name}</h3>

              <div className="mt-5 flex items-baseline gap-1">
                {plan.price === "Fiyat alın" ? (
                  <span className="font-display text-4xl font-medium text-ink">Teklif alın</span>
                ) : (
                  <>
                    <span className="font-display text-5xl font-semibold tracking-tight text-ink">
                      ₺{plan.price}
                    </span>
                    <span className="font-outfit text-base text-ink-2">{plan.unit}</span>
                  </>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-3 font-outfit text-sm text-ink-2">
                {plan.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-pine" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={cn(
                  "mt-8 inline-flex h-12 items-center justify-center gap-1.5 rounded-full px-5 font-outfit text-sm font-medium transition-colors",
                  plan.highlight
                    ? "bg-pine text-cream hover:bg-pine-2"
                    : "bg-paper-2 text-ink hover:bg-line",
                )}
              >
                {plan.price === "Fiyat alın" ? "İletişim" : "Başlayın"}
                <ArrowUpRight className="size-3.5" />
              </a>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center font-outfit text-sm text-ink-muted">
          {İlk 15 gün ücretsiz. Kredi kartı gerekmez. Fiyatlara KDV dahil değildir. Yıllık ödemede 2 ay bizden.}
        </p>
      </div>
    </section>
  );
}

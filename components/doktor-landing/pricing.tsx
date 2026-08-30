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
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">05 — Fiyat</p>
            <h2 className="mt-4 font-display text-display font-medium leading-display tracking-display">
              Sade. Şeffaf.
              <span className="italic font-normal"> Adil.</span>
            </h2>
          </div>
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
              Klinik
            </button>
          </div>
        </div>

        <ol className="mt-12 divide-y divide-line border-y border-line">
          {plans.map((plan) => (
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

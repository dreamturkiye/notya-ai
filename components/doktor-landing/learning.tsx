"use client";

import { useState } from "react";
import { LEARNING } from "./content";
import { cn } from "./cn";

export function Learning() {
  const [tenth, setTenth] = useState(true);
  const card = tenth ? LEARNING.tenth : LEARNING.first;

  return (
    <section id="ogrenme" className="bg-paper-2 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <div className="relative">
          <img
            src="/landing/desk-notes.jpg"
            alt="Sabah ışığında bir hekim masası: SOAP notları, cep defteri, stetoskop ve kalem"
            className="aspect-[3/2] w-full rounded-xl object-cover"
          />
          <p className="mt-3 font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">
            Seans notları · görsel referans
          </p>
        </div>

        <div>
          <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">02 — Öğrenme</p>
          <h2 className="mt-4 font-display text-display font-medium leading-display tracking-display">
            On seans sonra
            <span className="block italic font-normal text-pine">yıllardır birliktesiniz.</span>
          </h2>
          <p className="mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-ink-2">
            Her düzelttiğiniz ilaç, her değiştirdiğiniz doz, her tercih — öğrenir. Sorulmadan hatırlar.
            Meslektaş gibi davranır.
          </p>

          <div className="mt-8 inline-flex rounded-full bg-cream p-1 shadow-border" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!tenth}
              onClick={() => setTenth(false)}
              className={cn(
                "h-10 cursor-pointer rounded-full px-5 font-outfit text-sm",
                !tenth ? "bg-ink text-cream" : "text-ink-2",
              )}
            >
              1. seans
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tenth}
              onClick={() => setTenth(true)}
              className={cn(
                "h-10 cursor-pointer rounded-full px-5 font-outfit text-sm",
                tenth ? "bg-ink text-cream" : "text-ink-2",
              )}
            >
              10. seans
            </button>
          </div>

          <article className="mt-6 rounded-xl bg-cream p-6 shadow-border">
            <p className="font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">{card.label}</p>
            <p className="mt-4 text-right font-display text-xl italic leading-snug">“{card.prompt}”</p>
            <p className="mt-5 max-w-md border-l-2 border-pine pl-4 font-display text-lg leading-snug text-pine">
              {card.reply}
            </p>
            {tenth ? (
              <p className="mt-4 font-outfit text-sm text-ink-muted">Sormadınız. O hatırladı.</p>
            ) : null}
          </article>
        </div>
      </div>
    </section>
  );
}

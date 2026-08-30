"use client";

import { useState } from "react";
import { CONVO_SCENES } from "./content";
import { cn } from "./cn";
import { MedicalChart } from "./chart";

export function Conversation() {
  const [active, setActive] = useState(0);
  const scene = CONVO_SCENES[active] ?? CONVO_SCENES[0];

  return (
    <section id="konusma" className="relative bg-paper py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">01 — Konuşma</p>
          <h2 className="mt-4 font-display text-display font-medium leading-display tracking-display">
            İki meslektaş
            <span className="block italic font-normal text-pine">gibi konuşun.</span>
          </h2>
          <p className="mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-ink-2">
            Bir kez dokunun — Prof. Ayşe sizi karşılar. Cümlenizin ortasında araya girseniz, anında
            durur. Tuşa basmanıza gerek yok. İki saniyede yanıt.
          </p>
          <ul className="mt-8 flex flex-col gap-3 font-outfit text-sm text-ink-2">
            <li className="flex items-center gap-3">
              <span className="inline-block size-1.5 bg-pine" aria-hidden="true" />
              Gerçek zamanlı Türkçe yazıya döküm
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-block size-1.5 bg-pine" aria-hidden="true" />
              SOAP notu, seans biter bitmez
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-block size-1.5 bg-pine" aria-hidden="true" />
              Nelson, Braunwald, Harrison — kaynaklı öneri
            </li>
          </ul>
        </div>

        <div>
          <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Örnek seanslar">
            {CONVO_SCENES.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active === i}
                onClick={() => setActive(i)}
                className={cn(
                  "h-10 cursor-pointer rounded-full px-4 font-outfit text-sm transition-colors duration-150",
                  active === i ? "bg-pine text-cream" : "bg-paper-2 text-ink-2 hover:bg-cream",
                )}
              >
                {item.meta}
              </button>
            ))}
          </div>
          <MedicalChart key={scene.id} scene={scene} />
          <p className="mt-4 max-w-md font-outfit text-sm leading-relaxed text-ink-muted">
            Soldaki seanslar kurgusal örneklerdir. Gerçek klinikte her cümle hekimin onayına bağlıdır.
          </p>
        </div>
      </div>
    </section>
  );
}

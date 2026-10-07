import { LINKS, HERO, HERO_STRIP } from "./content";
import { Button } from "./button";
import { ArrowUpRight } from "./icons";

export function Hero() {
  return (
    <section id="top" className="relative bg-paper">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-10 pt-24 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:pb-14 lg:pt-28">
        <div className="min-w-0">
          <p className="dl-reveal flex items-center gap-3 font-outfit text-xs uppercase tracking-[0.28em] text-ink-muted">
            <span className="inline-block size-1.5 bg-pine" aria-hidden="true" />
            {HERO.eyebrow}
          </p>
          <h1 className="dl-reveal mt-5 font-display text-hero font-medium leading-hero tracking-hero">
            {HERO.title}
            <span className="mt-1 block italic font-normal text-pine">{HERO.titleItalic}</span>
          </h1>
          <p className="dl-reveal mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-ink-2">
            {HERO.lede}
          </p>
          <div className="dl-reveal mt-8 flex">
            <Button href={LINKS.signup} variant="pine" size="lg" className="w-full sm:w-auto">
              Ücretsiz başlayın
              <ArrowUpRight className="size-4" />
            </Button>
          </div>
        </div>

        <figure className="order-first min-w-0 lg:order-none">
          <img
            src="/landing/hero-clinic.jpg"
            alt="Gün ışığında özel bir muayenehane: muayene yatağı, stetoskop, tansiyon aleti ve diplomalar"
            className="aspect-[16/10] w-full rounded-xl object-cover object-center lg:aspect-[5/4]"
          />
          <figcaption className="mt-3 flex items-center justify-between gap-4 font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">
            <span>Muayenehane · görsel referans</span>
          </figcaption>
        </figure>
      </div>

      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-8 border-t border-line px-5 py-8 sm:grid-cols-4 sm:px-8">
        {HERO_STRIP.map((item) => (
          <li key={item} className="font-display text-lg italic leading-snug text-ink">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * NOTYA-KLINIK-01 — all static sections of /klinik in one file. Everything here is a server
 * component; only the nav needs the client.
 *
 * NOTYA-LANDING-2026-10: repositioned from "AI uzman per koltuk" to the practice system. Capability
 * blocks use the shared FeatureSection pattern from doktor-landing; cards are typographic, never
 * product screenshots.
 */
import { Button } from "@/components/doktor-landing/button";
import { ArrowUpRight } from "@/components/doktor-landing/icons";
import { FeatureSection, TypeCard } from "@/components/doktor-landing/feature";
import { DALLAR, GUVEN_SATIRI, HERO, LINKS, PORTAL } from "./content";

export function Hero() {
  return (
    <section id="top" className="relative bg-paper">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-10 pt-24 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:pb-14 lg:pt-28">
        <div className="min-w-0">
          <p className="flex items-center gap-3 font-outfit text-xs uppercase tracking-[0.28em] text-ink-muted">
            <span className="inline-block size-1.5 bg-pine" aria-hidden="true" />
            {HERO.eyebrow}
          </p>
          <h1 className="mt-5 font-display text-hero font-medium leading-hero tracking-hero">
            {HERO.title}
            <span className="mt-1 block italic font-normal text-pine">{HERO.titleItalic}</span>
          </h1>
          <p className="mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-ink-2">{HERO.lede}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button href={LINKS.signupKlinik} variant="pine" size="lg" className="w-full sm:w-auto">
              Ücretsiz başlayın
              <ArrowUpRight className="size-4" />
            </Button>
            <Button href="#dallar" variant="outline" size="lg" className="w-full sm:w-auto">
              Dalınızı bulun
            </Button>
          </div>
        </div>
        <figure className="order-first min-w-0 lg:order-none">
          <img
            src="/landing/corridor.jpg"
            alt="Gün ışığında bir klinik koridoru: muayene odası kapıları ve bekleme sediri"
            className="aspect-[16/10] w-full rounded-xl object-cover object-center lg:aspect-[5/4]"
          />
          <figcaption className="mt-3 font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">
            Klinik · görsel referans
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

export function HastaPortali() {
  return (
    <FeatureSection
      id="portal"
      tone="paper-2"
      eyebrow={PORTAL.eyebrow}
      title={PORTAL.title}
      titleItalic={PORTAL.titleItalic}
      body={PORTAL.body}
      card={
        <TypeCard
          label="Hastanın sayfası"
          rows={[
            { k: "Bakım talimatları", v: "Kliniğinizin dalına göre" },
            { k: "Mesajlar", v: "Klinikle doğrudan" },
          ]}
          note="Tek bağlantı, şifreyle açılır."
        />
      }
    />
  );
}

export function Dallar() {
  return (
    <section id="dallar" className="scroll-mt-16 bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">02 — Dallar</p>
        <h2 className="mt-4 max-w-3xl font-display text-display font-medium leading-display tracking-display">
          Kliniğinizin dalına göre
          <span className="block italic font-normal text-pine">kurulur.</span>
        </h2>
        <ul className="mt-12 flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-8 font-display text-title italic leading-snug text-ink-2">
          {DALLAR.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function GuvenSatiri() {
  return (
    <section className="border-y border-line bg-paper">
      <p className="mx-auto max-w-7xl px-5 py-8 font-outfit text-sm leading-relaxed text-ink-2 sm:px-8">
        {GUVEN_SATIRI}
      </p>
    </section>
  );
}

export function SonCta() {
  return (
    <section className="bg-paper-2 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 text-center sm:px-8">
        <h2 className="mx-auto max-w-3xl font-display text-display font-medium leading-display tracking-display">
          Kliniğinizi bugün kurun,
          <span className="italic font-normal text-pine"> ilk seansı bugün yapın.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-md font-outfit text-lede font-light leading-relaxed text-ink-2">
          15 gün ücretsiz. Kredi kartı gerekmez. Ekibinizi dakikalar içinde ekleyin.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href={LINKS.signupKlinik} variant="pine" size="lg">
            Ücretsiz başlayın
            <ArrowUpRight className="size-4" />
          </Button>
          <Button href={LINKS.doktor} variant="outline" size="lg">
            Muayenehaneniz mi var? Notya Doktor
          </Button>
        </div>
      </div>
    </section>
  );
}

export function KlinikFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <a href="#top" className="flex items-baseline gap-2 font-display text-2xl italic leading-none tracking-tight">
          notya
          <span className="font-outfit text-[11px] not-italic uppercase tracking-[0.3em] text-pine">klinik</span>
        </a>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 font-outfit text-sm text-ink-2" aria-label="Alt bağlantılar">
          <a href={LINKS.kvkk} className="hover:text-ink">KVKK</a>
          <a href={LINKS.doktor} className="hover:text-ink">Notya Doktor</a>
          <a href={LINKS.home} className="hover:text-ink">Notya</a>
          <a href={LINKS.login} className="hover:text-ink">Giriş</a>
        </nav>
        <p className="font-outfit text-xs text-ink-muted">© {new Date().getFullYear()} Notya</p>
      </div>
    </footer>
  );
}

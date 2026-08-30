/**
 * NOTYA-KLINIK-01 — all static sections of /klinik in one file. The page's signature is the branş
 * endeksi: ten disciplines as a color-coded index (accents from lib/ai/personas/klinik_uzmanlar.ts),
 * with the 29.03.2025-yönetmeliği professions tagged. Everything here is a server component; only
 * the nav needs the client.
 */
import { Button } from "@/components/doktor-landing/button";
import { ArrowUpRight } from "@/components/doktor-landing/icons";
import {
  BRANSLAR,
  HERO_FACTS,
  ISLEYIS,
  KVKK_PROOF,
  LINKS,
  TRADEMARK_NOTE,
  YONETMELIK_NOTU,
} from "./content";

export function Hero() {
  return (
    <section id="top" className="relative bg-paper">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-10 pt-24 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:pb-14 lg:pt-28">
        <div className="min-w-0">
          <p className="flex items-center gap-3 font-outfit text-xs uppercase tracking-[0.28em] text-ink-muted">
            <span className="inline-block size-1.5 bg-pine" aria-hidden="true" />
            Estetik, saç ekimi ve sağlık klinikleri için · Türkiye
          </p>
          <h1 className="mt-5 font-display text-hero font-medium leading-hero tracking-hero">
            Her koltuğa
            <span className="mt-1 block italic font-normal text-pine">bir uzman.</span>
          </h1>
          <p className="mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-ink-2">
            Greft hesabından botoks dozuna, ICF değerlendirmesinden beslenme planına — kliniğinizin
            her dalında Türkçe konuşan bir yapay zekâ uzmanı. Sesli. KVKK&apos;ya göre.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button href={LINKS.signupKlinik} variant="pine" size="lg" className="w-full sm:w-auto">
              Ücretsiz başlayın
              <ArrowUpRight className="size-4" />
            </Button>
            <Button href="#branslar" variant="outline" size="lg" className="w-full sm:w-auto">
              Branşınızı bulun
            </Button>
          </div>
        </div>
        <figure className="order-first min-w-0 lg:order-none">
          <img
            src="/landing/corridor.jpg"
            alt="Gün ışığında bir klinik koridoru: muayene odası kapıları ve bekleme sediri"
            className="aspect-[16/10] w-full rounded-xl object-cover object-center lg:aspect-[5/4]"
          />
          <figcaption className="mt-3 flex items-center justify-between gap-4 font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">
            <span>Özel klinik · Türkiye</span>
            <span>10 branş</span>
          </figcaption>
        </figure>
      </div>
      <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-8 border-t border-line px-5 py-8 sm:grid-cols-4 sm:px-8">
        {HERO_FACTS.map((fact) => (
          <div key={fact.k}>
            <dt className="font-outfit text-xs uppercase tracking-[0.2em] text-ink-muted">{fact.k}</dt>
            <dd className="mt-1 font-display text-lg italic leading-snug text-ink">{fact.v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Branslar() {
  return (
    <section id="branslar" className="bg-paper-2 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">01 — Branşlar</p>
        <h2 className="mt-4 max-w-3xl font-display text-display font-medium leading-display tracking-display">
          Kliniğiniz hangi işi yapıyorsa
          <span className="block italic font-normal text-pine">o dili konuşur.</span>
        </h2>
        <ol className="mt-12 grid gap-x-12 border-t border-line sm:grid-cols-2">
          {BRANSLAR.map((b) => (
            <li
              key={b.slug}
              id={b.slug}
              className="grid grid-cols-[3px_1fr] gap-5 border-b border-line py-6 scroll-mt-24"
            >
              <span aria-hidden="true" className="rounded-full" style={{ backgroundColor: b.renk }} />
              <div>
                <h3 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-display text-title italic leading-snug">
                  {b.ad}
                  {b.yonetmelik ? (
                    <span className="rounded-full border border-pine px-2.5 py-0.5 font-outfit text-[11px] not-italic uppercase tracking-widest text-pine">
                      29.03.2025
                    </span>
                  ) : null}
                </h3>
                <p className="mt-2 font-outfit text-sm leading-relaxed text-ink-2">{b.odak}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 font-outfit text-sm text-ink-muted">{YONETMELIK_NOTU}</p>
      </div>
    </section>
  );
}

export function Isleyis() {
  return (
    <section id="isleyis" className="bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">02 — İşleyiş</p>
        <h2 className="mt-4 max-w-2xl font-display text-display font-medium leading-display tracking-display">
          Seanstan takibe,
          <span className="italic font-normal"> dört adım.</span>
        </h2>
        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {ISLEYIS.map((step, i) => (
            <li key={step.k} className="border-t border-line pt-4">
              <p className="font-outfit text-xs uppercase tracking-[0.2em] text-ink-muted">
                Adım {i + 1}
              </p>
              <h3 className="mt-2 font-display text-title italic leading-snug">{step.k}</h3>
              <p className="mt-2 font-outfit text-sm leading-relaxed text-ink-2">{step.v}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Guvenlik() {
  return (
    <section id="guvenlik" className="bg-paper-2 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-end lg:gap-16">
        <div>
          <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">03 — Güvenlik</p>
          <h2 className="mt-4 font-display text-display font-medium leading-display tracking-display">
            Yapay zekâ, hastanızın adını
            <span className="block italic font-normal text-pine">hiç görmez.</span>
          </h2>
          <p className="mt-8 max-w-xl border-l-2 border-pine pl-5 font-outfit text-sm leading-relaxed text-ink-2">
            Estetik ve saç ekimi hastası, mahremiyeti her hastadan çok önemser. Notya bu yüzden ters
            yönde kuruldu: kimlik bilgileri modele gitmeden takma adla değiştirilir, rıza kayıtları
            içeride tutulur, süresi dolan veri her gece imha edilir.
          </p>
        </div>
        <figure>
          <img
            src="/landing/desk-notes.jpg"
            alt="Bir klinik masasında el yazısı notlar ve dosyalar"
            className="aspect-[4/3] w-full rounded-xl object-cover"
          />
          <figcaption className="mt-3 font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">
            Kayıtlar sizde kalır
          </figcaption>
        </figure>
      </div>
      <ul className="mx-auto mt-16 grid max-w-7xl gap-8 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {KVKK_PROOF.map((item) => (
          <li key={item.k} className="border-t border-line pt-4">
            <p className="font-outfit text-xs uppercase tracking-[0.2em] text-ink-muted">{item.k}</p>
            <p className="mt-2 font-outfit text-sm leading-relaxed text-ink-2">{item.v}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Entegrasyonlar() {
  return (
    <section id="entegrasyonlar" className="bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">
          04 — Entegrasyonlar
        </p>
        <h2 className="mt-4 max-w-2xl font-display text-display font-medium leading-display tracking-display">
          Sisteminizi değiştirmeyin,
          <span className="italic font-normal"> üstüne kurun.</span>
        </h2>
        <div className="mt-12 grid gap-8 border-t border-line pt-8 lg:grid-cols-2">
          <div>
            <h3 className="font-display text-title italic leading-snug">Pabau ile çalışır</h3>
            <p className="mt-2 max-w-lg font-outfit text-sm leading-relaxed text-ink-2">
              Kliniğiniz randevu ve hasta yönetimi için Pabau kullanıyorsa hesabınızı bağlayın:
              hastalarınız ve randevularınız Notya&apos;ya akar. Notya yerine geçmez — Pabau&apos;nun
              üstüne Türkçe klinik zekâsı ve KVKK katmanı ekler.
            </p>
          </div>
          <div>
            <h3 className="font-display text-title italic leading-snug">Müşteri portalı</h3>
            <p className="mt-2 max-w-lg font-outfit text-sm leading-relaxed text-ink-2">
              Hastanız randevusuna ve bilgilendirmesine kendi telefonundan, uygulama indirmeden
              ulaşır. Yurt dışından gelen hasta için de aynı kapı.
            </p>
          </div>
        </div>
        <p className="mt-8 font-outfit text-xs text-ink-muted">{TRADEMARK_NOTE}</p>
      </div>
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

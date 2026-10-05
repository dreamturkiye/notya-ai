/**
 * NOTYA-LANDING-2026-10 — the practice-system sections of /doktor (muayene sonu → takip). Server
 * components: the branş list is read from lib/doktor/specialties.ts here, so only the labels reach
 * the page, never the registry's other fields.
 */
import { SPECIALTIES } from "@/lib/doktor/specialties";
import { BRANS, KONSULTASYON, ON_BURO, PORTAL, TAKIP, VIZIT } from "./content";
import { FeatureSection, TypeCard } from "./feature";

export function MuayeneSonu() {
  return (
    <FeatureSection
      id="vizit"
      tone="paper-2"
      eyebrow={VIZIT.eyebrow}
      title={VIZIT.title}
      titleItalic={VIZIT.titleItalic}
      body={VIZIT.body}
      bullets={VIZIT.bullets}
      card={
        <TypeCard
          label="Muayene sonu"
          rows={VIZIT.steps.map((k, i) => ({ k, mark: String(i + 1).padStart(2, "0") }))}
          note="Her adım sizin onayınızla kesinleşir."
        />
      }
    />
  );
}

export function HastaPortali() {
  return (
    <FeatureSection
      id="portal"
      tone="paper"
      reverse
      eyebrow={PORTAL.eyebrow}
      title={PORTAL.title}
      titleItalic={PORTAL.titleItalic}
      body={PORTAL.body}
      bullets={PORTAL.bullets}
      card={
        <TypeCard
          label="Hastanın sayfası"
          rows={PORTAL.rows.map((k) => ({ k }))}
          note="Tek bağlantı. Uygulama gerekmez."
        />
      }
    />
  );
}

export function Konsultasyon() {
  return (
    <FeatureSection
      id="konsultasyon"
      tone="paper-2"
      eyebrow={KONSULTASYON.eyebrow}
      title={KONSULTASYON.title}
      titleItalic={KONSULTASYON.titleItalic}
      body={KONSULTASYON.body}
      bullets={KONSULTASYON.bullets}
      card={
        <TypeCard
          label="Konsültasyon"
          rows={[
            { k: "İstem", v: "Muayeneden çıkmadan" },
            { k: "Güvenli bağlantı", v: "Konsültan hekime" },
            { k: "Yanıt", v: "Hastanın dosyasında" },
          ]}
        />
      }
    />
  );
}

export function OnBuro() {
  return (
    <FeatureSection
      id="randevu"
      tone="paper"
      reverse
      eyebrow={ON_BURO.eyebrow}
      title={ON_BURO.title}
      titleItalic={ON_BURO.titleItalic}
      body={ON_BURO.body}
      bullets={ON_BURO.bullets}
      card={
        <TypeCard
          label="Ön büro"
          rows={[
            { k: "Randevu takvimi" },
            { k: "Hatırlatmalar" },
            { k: "Hasta mesajları" },
            { k: "Sekreter", mark: "Ayrı yetki" },
          ]}
        />
      }
    />
  );
}

export function Branslar() {
  return (
    <section id="brans" className="scroll-mt-16 bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">{BRANS.eyebrow}</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="max-w-3xl font-display text-display font-medium leading-display tracking-display">
            {BRANS.title}
            <span className="block italic font-normal text-pine">{BRANS.titleItalic}</span>
          </h2>
          <p className="max-w-sm font-outfit text-sm leading-relaxed text-ink-2">{BRANS.body}</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {BRANS.examples.map((e) => (
            <article key={e.k} className="rounded-xl bg-paper p-6 shadow-border">
              <h3 className="font-display text-2xl italic leading-none text-pine">{e.k}</h3>
              <p className="mt-3 font-outfit text-sm leading-relaxed text-ink-2">{e.v}</p>
            </article>
          ))}
        </div>

        <ul
          className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-6 font-outfit text-sm text-ink-muted"
          aria-label="Branşlar"
        >
          {SPECIALTIES.map((s) => (
            <li key={s.key}>{s.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Takip() {
  return (
    <FeatureSection
      id="takip"
      tone="paper"
      eyebrow={TAKIP.eyebrow}
      title={TAKIP.title}
      titleItalic={TAKIP.titleItalic}
      body={TAKIP.body}
      card={
        <TypeCard
          label="Takip listesi"
          rows={TAKIP.rows.map((k) => ({ k, mark: "Hatırlat" }))}
          note="Liste kendiliğinden güncellenir."
        />
      }
    />
  );
}

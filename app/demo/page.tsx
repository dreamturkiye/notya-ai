import { SiteNav } from "@/components/doktor-landing/site-nav";
import { SiteFooter } from "@/components/doktor-landing/site-footer";
import { DEMO } from "@/components/doktor-landing/content";
import { CalTakvim } from "@/components/demo/CalTakvim";
import { demoBaglantisi } from "@/lib/demo/demoBaglantisi";

/**
 * NOTYA-DEMO-01 — /demo: book a 60-minute video call with Dr. Gökhan Mamur through Cal.com.
 * Link from NEXT_PUBLIC_DEMO_BOOKING_URL; when it is empty or not a Cal.com address the page says booking
 * opens soon and embeds nothing. Cal.com's script/frame origins are allowed in the CSP of this path only
 * (middleware.ts, next.config.mjs).
 */
export default function DemoPage() {
  const baglanti = demoBaglantisi();
  return (
    <div className="relative bg-paper text-ink">
      <SiteNav home="/doktor" />
      <main>
        <section className="mx-auto max-w-7xl px-5 pb-10 pt-24 sm:px-8 lg:pb-14 lg:pt-28">
          <p className="flex items-center gap-3 font-outfit text-xs uppercase tracking-[0.28em] text-ink-muted">
            <span className="inline-block size-1.5 bg-pine" aria-hidden="true" />
            notya
          </p>
          <h1 className="mt-5 font-display text-display font-medium leading-display tracking-display">
            {DEMO.title}
          </h1>
          <p className="mt-6 max-w-xl font-outfit text-lede font-light leading-relaxed text-ink-2">{DEMO.lede}</p>

          {baglanti ? (
            <div className="mt-12 rounded-xl bg-cream p-1 shadow-border sm:p-6">
              <CalTakvim
                origin={baglanti.origin}
                calLink={baglanti.calLink}
                brandColor="#0e6b66"
                ariaLabel={DEMO.calendarLabel}
              />
            </div>
          ) : (
            <div className="mt-12 rounded-xl border border-line bg-cream p-6 sm:p-8">
              <p className="font-display text-2xl italic">{DEMO.soonTitle}</p>
              <p className="mt-3 max-w-xl font-outfit text-base text-ink-2">{DEMO.soonBody}</p>
            </div>
          )}

          <p className="mt-6 font-outfit text-sm text-ink-muted">{DEMO.provider}</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

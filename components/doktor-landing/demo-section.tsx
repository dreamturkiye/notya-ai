import { DEMO, LINKS } from "./content";
import { Button } from "./button";
import { TypeCard } from "./feature";
import { ArrowUpRight } from "./icons";
import { demoBaglantisi } from "@/lib/demo/demoBaglantisi";

/**
 * NOTYA-DEMO-01 — "Demo planla" section right after the hero. Same markup and classes as the page's feature
 * sections (FeatureSection header, TypeCard, pine button). Renders nothing while NEXT_PUBLIC_DEMO_BOOKING_URL
 * holds no Cal.com link.
 */
export function DemoSection() {
  if (!demoBaglantisi()) return null;
  const t = DEMO.section;
  return (
    <section id="demo" className="scroll-mt-16 bg-paper-2 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div className="min-w-0">
          <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">{t.eyebrow}</p>
          <h2 className="mt-4 font-display text-display font-medium leading-display tracking-display">
            {t.title}
            <span className="block italic font-normal text-pine">{t.titleItalic}</span>
          </h2>
          <p className="mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-ink-2">{t.body}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button href={LINKS.demo} variant="pine" size="lg" className="w-full sm:w-auto">
              {DEMO.cta}
              <ArrowUpRight className="size-4" />
            </Button>
          </div>
        </div>
        <div className="min-w-0">
          <TypeCard label={t.cardLabel} rows={t.rows} />
        </div>
      </div>
    </section>
  );
}

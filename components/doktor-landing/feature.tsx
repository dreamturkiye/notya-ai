import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * NOTYA-LANDING-2026-10 — one section pattern for every capability block on /doktor and /klinik:
 * eyebrow, display heading (second line italic pine), lede, up to three bullets, and a
 * typographic card. No screenshots: the card is set in type so the page never shows real product UI.
 */
export function FeatureSection({
  id,
  eyebrow,
  title,
  titleItalic,
  body,
  bullets,
  card,
  tone = "paper",
  reverse = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  titleItalic?: string;
  body: string;
  bullets?: readonly string[];
  card?: ReactNode;
  tone?: "paper" | "paper-2" | "cream";
  reverse?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-16 py-20 sm:py-28",
        tone === "paper" ? "bg-paper" : tone === "paper-2" ? "bg-paper-2" : "bg-cream",
      )}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div className={cn("min-w-0", reverse ? "lg:order-2" : "")}>
          <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">{eyebrow}</p>
          <h2 className="mt-4 font-display text-display font-medium leading-display tracking-display">
            {title}
            {titleItalic ? <span className="block italic font-normal text-pine">{titleItalic}</span> : null}
          </h2>
          <p className="mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-ink-2">{body}</p>
          {bullets && bullets.length > 0 ? (
            <ul className="mt-8 flex flex-col gap-3 font-outfit text-sm text-ink-2">
              {bullets.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <span className="inline-block size-1.5 shrink-0 bg-pine" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {card ? <div className={cn("min-w-0", reverse ? "lg:order-1" : "")}>{card}</div> : null}
      </div>
    </section>
  );
}

/** Typographic card: a labelled list set in the page's display face. Illustrative, not product UI. */
export function TypeCard({
  label,
  rows,
  note,
}: {
  label: string;
  rows: readonly { k: string; v?: string; mark?: string }[];
  note?: string;
}) {
  return (
    <article className="rounded-xl bg-cream p-6 shadow-border sm:p-8">
      <p className="font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">{label}</p>
      <ol className="mt-5 divide-y divide-line border-y border-line">
        {rows.map((r) => (
          <li key={r.k} className="flex items-baseline justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="font-display text-xl italic leading-snug text-ink">{r.k}</p>
              {r.v ? <p className="mt-1 font-outfit text-sm leading-relaxed text-ink-muted">{r.v}</p> : null}
            </div>
            {r.mark ? (
              <span className="shrink-0 rounded-full border border-pine px-2.5 py-0.5 font-outfit text-[11px] uppercase tracking-widest text-pine">
                {r.mark}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      {note ? <p className="mt-4 font-outfit text-sm text-ink-muted">{note}</p> : null}
    </article>
  );
}

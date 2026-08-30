import { BOOKS } from "./content";

export function Ticker() {
  const row = [...BOOKS, ...BOOKS];
  return (
    <section aria-label="Kaynak kitaplar" className="dl-ticker overflow-hidden border-y border-line bg-paper-2 py-4">
      <div className="dl-marquee flex w-max gap-10 pr-10">
        {row.map((book, i) => (
          <p
            key={`${book.title}-${i}`}
            className="flex items-baseline gap-3 whitespace-nowrap font-outfit text-sm text-ink-2"
          >
            <span className="font-display text-base italic">{book.title}</span>
            <span className="text-ink-muted">{book.field}</span>
          </p>
        ))}
      </div>
    </section>
  );
}

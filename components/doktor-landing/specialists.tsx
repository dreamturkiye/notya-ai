import { SPECIALISTS } from "./content";

export function Specialists() {
  return (
    <section id="uzmanlar" className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">03 — Uzmanlar</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="max-w-3xl font-display text-display font-medium leading-display tracking-display">
            Üç uzman.
            <span className="block italic font-normal text-pine">Tek muayenehane.</span>
          </h2>
          <p className="max-w-sm font-outfit text-sm leading-relaxed text-ink-2">
            Pediatri, kardiyoloji, nöroloji ve dahiliye. Her biri kendi külliyatını ezbere bilir. Siz
            hangisini çağırırsanız, o odadadır.
          </p>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-6">
          {SPECIALISTS.map((s) => (
            <article key={s.name}>
              <img
                src={s.photo}
                alt={`${s.name} ${s.surname}, ${s.title} uzmanı`}
                className="aspect-[3/4] w-full rounded-xl object-cover object-[center_12%]"
              />
              <p className="mt-4 font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">
                {s.index} · {s.title}
              </p>
              <h3 className="mt-1 font-display text-2xl italic leading-none sm:text-3xl">
                {s.name} {s.surname}
              </h3>
              <p className="mt-3 font-outfit text-sm text-ink-2">{s.character}</p>
              <p className="mt-1 font-display text-sm italic text-pine">{s.books}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

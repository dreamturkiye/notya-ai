import { PROOF } from "./content";

export function Safety() {
  return (
    <section id="guvenlik" className="bg-paper py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-end lg:gap-16">
        <div>
          <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">04 — Güvenlik ağı</p>
          <h2 className="mt-4 font-display text-display font-medium leading-display tracking-display">
            Elli hasta, yorgun bir gün —
            <span className="italic font-normal text-pine"> o asla susmaz.</span>
          </h2>
          <blockquote className="mt-8 max-w-xl border-l-2 border-pine pl-5">
            <p className="font-display text-title font-normal italic leading-snug text-ink">
              “Doktor, bir saniye — bu doz yetişkin dozudur. Nelson'a göre bu kiloda en fazla 250
              mg olmalı. Düzelteyim mi?”
            </p>
            <footer className="mt-6 font-outfit text-sm leading-relaxed text-ink-2">
              Yanlış doz, tehlikeli kombinasyon, atlanmış SGK kısıtlaması. Sormadan söyler. Duraksatır.
              Doğrusunu önerir.
            </footer>
          </blockquote>
        </div>

        <figure>
          <img
            src="/landing/corridor.jpg"
            alt="Gün ışığında özel bir klinik koridoru: muayenehane kapıları ve bekleme sediri"
            className="aspect-[4/3] w-full rounded-xl object-cover"
          />
          <figcaption className="mt-3 font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">
            Klinik koridoru · görsel referans
          </figcaption>
        </figure>
      </div>

      <ul className="mx-auto mt-16 grid max-w-7xl gap-8 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {PROOF.map((item) => (
          <li key={item.k} className="border-t border-line pt-4">
            <p className="font-outfit text-xs uppercase tracking-[0.2em] text-ink-muted">{item.k}</p>
            <p className="mt-2 font-outfit text-sm leading-relaxed text-ink-2">{item.v}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

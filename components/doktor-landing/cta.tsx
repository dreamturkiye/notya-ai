"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BRANCHES, LINKS } from "./content";
import { Button } from "./button";

export function FinalCta() {
  const router = useRouter();
  const [sending, setSending] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "");
    const field = String(data.get("field") ?? "");
    setSending(true);
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    if (field) params.set("uzmanlik", field);
    const q = params.toString();
    router.push(q ? `${LINKS.signup}?${q}` : LINKS.signup);
  }

  return (
    <section className="bg-pine text-cream">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:items-end">
        <div>
          <p className="font-outfit text-xs uppercase tracking-[0.22em] text-cream/65">Muayenehane</p>
          <h2 className="mt-4 font-display text-display font-medium leading-display tracking-display">
            Bugün başlayın.
            <span className="mt-2 block italic font-normal">İlk 15 gün ücretsiz.</span>
          </h2>
          <p className="mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-cream/80">
            Kredi kartı gerekmez. KVKK uyumlu. Türkçe destek. Muayenehanenize bir meslektaş daha.
          </p>
        </div>

        <div className="rounded-xl bg-cream p-6 text-ink shadow-border">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <p className="font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">Deneme kaydı</p>
            <label className="grid gap-1.5 font-outfit text-sm">
              <span className="text-ink-muted">Ad soyad</span>
              <input
                required
                name="name"
                autoComplete="name"
                className="h-11 rounded-md bg-paper px-3 text-ink shadow-border outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
              />
            </label>
            <label className="grid gap-1.5 font-outfit text-sm">
              <span className="text-ink-muted">E-posta</span>
              <input
                required
                type="email"
                name="email"
                autoComplete="email"
                className="h-11 rounded-md bg-paper px-3 text-ink shadow-border outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
              />
            </label>
            <label className="grid gap-1.5 font-outfit text-sm">
              <span className="text-ink-muted">Uzmanlık</span>
              <select
                required
                name="field"
                defaultValue=""
                className="h-11 rounded-md bg-paper px-3 text-ink shadow-border outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
              >
                <option value="" disabled>
                  Uzmanlık seçin
                </option>
                {BRANCHES.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
            <Button type="submit" size="lg" disabled={sending}>
              {sending ? "Yönlendiriliyor…" : "15 günü başlatın"}
            </Button>
            <p className="font-outfit text-xs leading-relaxed text-ink-muted">
              Kayıt, Notya hesabınızda tamamlanır. Kredi kartı gerekmez.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

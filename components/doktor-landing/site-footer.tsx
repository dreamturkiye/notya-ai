import { LINKS } from "./content";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-12 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-display text-3xl italic">notya</p>
          <p className="mt-2 max-w-xs font-outfit text-sm leading-relaxed text-ink-muted">
            Türkiye'nin profesyonel yapay zekâ not asistanı. Dream Türkiye, İstanbul.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 font-outfit text-sm" aria-label="Alt bağlantılar">
          <a href={LINKS.home} className="text-ink-2 hover:text-ink">
            Tüm meslekler
          </a>
          <a href={LINKS.login} className="text-ink-2 hover:text-ink">
            Giriş
          </a>
          <a href={LINKS.signup} className="text-ink-2 hover:text-ink">
            Kayıt
          </a>
          <a href={LINKS.kvkk} className="text-ink-2 hover:text-ink">
            KVKK
          </a>
        </nav>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-line px-5 py-6 font-outfit text-xs uppercase tracking-[0.14em] text-ink-muted sm:flex-row sm:justify-between sm:px-8">
        <p>© {new Date().getFullYear()} Notya · Dream Türkiye</p>
        <p>AB Frankfurt · AES-256 · Türkçe</p>
      </div>
    </footer>
  );
}

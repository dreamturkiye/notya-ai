"use client";

/**
 * NOTYA-KLINIK-01 — nav for /klinik. Same behavior as doktor-landing/site-nav (scroll shadow,
 * mobile sheet) but reads klinik content. Kept as its own slim copy rather than parameterizing the
 * doktor nav: the two pages should be able to diverge without coordinating.
 */
import { useEffect, useState } from "react";
import { LINKS, NAV } from "./content";
import { cn } from "@/components/doktor-landing/cn";
import { Button } from "@/components/doktor-landing/button";
import { ArrowUpRight, IconClose, IconMenu } from "@/components/doktor-landing/icons";

export function KlinikNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 bg-paper/92 text-ink transition-shadow duration-300",
          scrolled || open ? "shadow-border" : "",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <a href="#top" className="flex items-baseline gap-2 font-display text-2xl italic leading-none tracking-tight">
            notya
            <span className="font-outfit text-[11px] not-italic uppercase tracking-[0.3em] text-pine">klinik</span>
          </a>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Bölümler">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="group flex items-baseline gap-2 text-sm font-outfit">
                <span className="font-outfit text-xs uppercase tracking-widest text-ink-muted">{item.index}</span>
                <span className="border-b border-transparent transition-colors group-hover:border-pine">
                  {item.label}
                </span>
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a href={LINKS.login} className="hidden font-outfit text-sm text-ink-2 hover:text-ink lg:inline">
              Giriş
            </a>
            <Button href={LINKS.signupKlinik} variant="pine" size="sm" className="hidden sm:inline-flex">
              15 gün ücretsiz
              <ArrowUpRight className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="lg:hidden"
              aria-expanded={open}
              aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <IconClose className="size-5" /> : <IconMenu className="size-5" />}
            </Button>
          </div>
        </div>
      </header>
      {open ? (
        <div className="fixed inset-0 z-30 bg-paper pt-20 text-ink lg:hidden">
          <nav className="flex flex-col gap-1 px-6 py-8" aria-label="Mobil menü">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-3 border-b border-line py-4 font-display text-2xl italic"
              >
                <span className="font-outfit text-xs not-italic uppercase tracking-widest text-ink-muted">
                  {item.index}
                </span>
                {item.label}
              </a>
            ))}
            <a href={LINKS.login} className="mt-6 font-outfit text-base text-ink-2">
              Giriş
            </a>
          </nav>
        </div>
      ) : null}
    </>
  );
}

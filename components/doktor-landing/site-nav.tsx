"use client";

import { useEffect, useState } from "react";
import { DEMO, LINKS, NAV } from "./content";
import { cn } from "./cn";
import { Button } from "./button";
import { ArrowUpRight, IconClose, IconMenu } from "./icons";

/**
 * `home` prefixes the section anchors and the logo when the nav sits on a page other than the landing
 * (NOTYA-DEMO-01: /demo passes "/doktor" so "#nasil" becomes "/doktor#nasil").
 */
export function SiteNav({ home = "" }: { home?: string } = {}) {
  // On /demo itself (home set) the bar does not link to the page it is on.
  const demoGoster = !home;
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
          <a href={`${home}#top`} className="font-display text-2xl italic leading-none tracking-tight">
            notya
          </a>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Bölümler">
            {NAV.map((item) => (
              <a key={item.href} href={`${home}${item.href}`} className="group flex items-baseline gap-2 text-sm font-outfit">
                <span className="font-outfit text-xs uppercase tracking-widest text-ink-muted">
                  {item.index}
                </span>
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
            {demoGoster ? (
              <Button href={LINKS.demo} variant="demo" size="sm">
                {DEMO.cta}
              </Button>
            ) : null}
            <Button href={LINKS.signup} variant="pine" size="sm" className="hidden sm:inline-flex">
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
                href={`${home}${item.href}`}
                onClick={() => setOpen(false)}
                className="flex items-baseline justify-between border-b border-line py-4"
              >
                <span className="font-display text-3xl italic">{item.label}</span>
                <span className="font-outfit text-xs tracking-widest text-ink-muted">{item.index}</span>
              </a>
            ))}
            <div className="mt-8 flex flex-col gap-3">
              <Button href={LINKS.signup} size="lg">
                15 gün ücretsiz başlayın
              </Button>
              {demoGoster ? (
                <Button href={LINKS.demo} variant="demo" size="lg">
                  {DEMO.cta}
                </Button>
              ) : null}
              <Button href={LINKS.login} variant="outline" size="lg">
                Giriş yapın
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}

"use client";

/**
 * NOTYA-ULKE-DEMO-01 — Cal.com's official inline embed (the loader from Cal.com's embed snippet generator,
 * https://app.cal.com/embed/embed.js), rendered into a div on /demo only. No npm package: the loader below
 * is Cal.com's own snippet, typed. Cal.com shows the slots in the visitor's own time zone.
 * Holds no text: the accessible name arrives from the pack.
 */
import React from "react";
import { useEffect, useRef } from "react";

type CalFn = ((...args: unknown[]) => void) & {
  loaded?: boolean;
  ns?: Record<string, (...args: unknown[]) => void>;
  q?: unknown[];
};

declare global {
  interface Window {
    Cal?: CalFn;
  }
}

const EMBED_JS = "https://app.cal.com/embed/embed.js";

/* Cal.com's loader snippet, verbatim in behaviour: queues calls until embed.js has loaded. */
function calYukleyici(): CalFn {
  const w = window;
  if (w.Cal) return w.Cal;
  const p = (a: { q: unknown[] }, ar: unknown) => {
    a.q.push(ar);
  };
  const d = w.document;
  const cal = function (this: unknown, ...ar: unknown[]) {
    const c = w.Cal as CalFn & { q: unknown[]; ns: Record<string, unknown> };
    if (!c.loaded) {
      c.ns = {};
      c.q = c.q || [];
      d.head.appendChild(d.createElement("script")).src = EMBED_JS;
      c.loaded = true;
    }
    if (ar[0] === "init") {
      const api = function (...a: unknown[]) {
        p(api as unknown as { q: unknown[] }, a);
      } as unknown as { q: unknown[] };
      const namespace = ar[1];
      api.q = api.q || [];
      if (typeof namespace === "string") {
        c.ns[namespace] = c.ns[namespace] || api;
        p(c.ns[namespace] as unknown as { q: unknown[] }, ar);
        p(c, ["initNamespace", namespace]);
      } else p(c, ar);
      return;
    }
    p(c, ar);
  } as CalFn;
  w.Cal = cal;
  return cal;
}

export function CalTakvim({
  origin,
  calLink,
  namespace = "notya-demo",
  brandColor,
  ariaLabel,
}: {
  origin: string;
  calLink: string;
  namespace?: string;
  brandColor: string;
  ariaLabel: string;
}) {
  const kap = useRef<HTMLDivElement>(null);
  const kuruldu = useRef(false);

  useEffect(() => {
    const el = kap.current;
    if (!el || kuruldu.current) return;
    kuruldu.current = true;
    const Cal = calYukleyici();
    Cal("init", namespace, { origin });
    const api = Cal.ns?.[namespace];
    if (!api) return;
    api("inline", {
      elementOrSelector: el,
      calLink,
      config: { layout: "month_view", theme: "light" },
    });
    api("ui", {
      hideEventTypeDetails: false,
      layout: "month_view",
      theme: "light",
      styles: { branding: { brandColor } },
    });
  }, [origin, calLink, namespace, brandColor]);

  return (
    <div
      ref={kap}
      aria-label={ariaLabel}
      style={{ width: "100%", minHeight: 640, overflow: "auto" }}
    />
  );
}

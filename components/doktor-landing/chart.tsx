"use client";

import { useEffect, useState } from "react";
import type { ChartScene, ChartTurn } from "./content";
import { cn } from "./cn";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function useTypedScene(scene: ChartScene, reduced: boolean) {
  const [visible, setVisible] = useState<ChartTurn[]>([]);
  const [partial, setPartial] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setVisible([]);
    setPartial("");
    setDone(false);

    if (reduced) {
      setVisible(scene.turns);
      setDone(true);
      return;
    }

    const timers: number[] = [];
    const typeTurn = (index: number, startAt: number) => {
      const turn = scene.turns[index];
      if (!turn) {
        timers.push(window.setTimeout(() => {
          if (!cancelled) setDone(true);
        }, startAt));
        return;
      }
      timers.push(window.setTimeout(() => {
        if (cancelled) return;
        let i = 0;
        const step = () => {
          if (cancelled) return;
          i += 1;
          setPartial(turn.text.slice(0, i));
          if (i < turn.text.length) {
            timers.push(window.setTimeout(step, turn.role === "uyari" ? 18 : 22));
          } else {
            setVisible((prev) => [...prev, turn]);
            setPartial("");
            typeTurn(index + 1, 520);
          }
        };
        step();
      }, startAt));
    };

    typeTurn(0, 380);
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [scene, reduced]);

  return { visible, partial, done };
}

function ListenBars() {
  return (
    <span className="inline-flex h-3 items-end gap-px" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="dl-listen-bar block w-0.5 rounded-full bg-pine"
          style={{ height: `${6 + (i % 3) * 3}px`, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}

export function MedicalChart({
  scene,
  live = false,
  className,
}: {
  scene: ChartScene;
  live?: boolean;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const { visible, partial, done } = useTypedScene(scene, reduced);
  const typing = scene.turns[visible.length];

  return (
    <article className={cn("rounded-xl bg-cream p-5 text-ink shadow-border sm:p-6", className)}>
      <header className="flex items-start justify-between gap-4 border-b border-line pb-3">
        <div className="min-w-0">
          <p className="font-outfit text-xs uppercase tracking-widest text-ink-muted">
            {scene.meta} · {scene.time} · {scene.field}
          </p>
          <p className="mt-1 font-display text-lg font-medium italic text-ink">{scene.specialist}</p>
        </div>
        {live ? (
          <p className="flex shrink-0 items-center gap-2 font-outfit text-xs text-pine">
            <ListenBars />
            dinliyor
          </p>
        ) : (
          <p className="shrink-0 font-outfit text-xs text-ink-muted">{done ? "tamamlandı" : "yazıyor"}</p>
        )}
      </header>
      <ol className="mt-4 flex flex-col gap-4">
        {visible.map((turn, i) => (
          <Turn key={`${scene.id}-${i}`} turn={turn} />
        ))}
        {typing && partial ? <Turn turn={{ ...typing, text: partial }} caret /> : null}
      </ol>
    </article>
  );
}

function Turn({ turn, caret = false }: { turn: ChartTurn; caret?: boolean }) {
  const isWarn = turn.role === "uyari";
  const isHekim = turn.role === "hekim";
  return (
    <li className={cn("grid gap-1", isHekim ? "justify-items-end" : "justify-items-start")}>
      <p className={cn("font-outfit text-xs uppercase tracking-widest", isWarn ? "text-warn" : "text-ink-muted")}>
        {turn.speaker}
      </p>
      <p
        className={cn(
          "max-w-md font-display text-base leading-snug sm:text-lg",
          isWarn && "border-l-2 border-warn pl-3 text-warn",
          isHekim && "text-right",
        )}
      >
        {turn.text}
        {caret ? <span className="dl-caret" /> : null}
      </p>
    </li>
  );
}

'use client';
/**
 * BUYUME-GRAFIK-V2 (Kaan, 2026-11-20: "kilo ve boy grafikleri çok istatistiksel ve sıkıcı… laboratuvar raporu gibi").
 * One growth curve, drawn in Notya's cream / pine language:
 *   - the reference as three soft sage bands (3–97, 10–90, 25–75) and one clear 50th-percentile line, labelled on the
 *     right edge — no grey "lab paper", no dashed lines;
 *   - the child's own measurements as the hero: large berry dots on a line, the latest one labelled with value and
 *     percentile; every dot has a hover / tap / keyboard tooltip (date, age, value, percentile, source);
 *   - a zoomed age window for the child's age (lib/clinical/buyumeGrafik.ts → yasPenceresi) with readable month ticks.
 * Pure SVG, measured to its container so text stays at real pixel sizes on a phone and on a wall screen.
 * Used by the patient file (HastaBuyumeEgrileri) and Araçlar › Büyüme stüdyosu (pediatri only — branch-gated by callers).
 */
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeRenk';
import { degerMetni, degerTikleri, persentilEtiketi, yasMetni, yasTikleri } from '@/lib/clinical/buyumeGrafik';

export interface EgriNoktasi { ay: number; deger: number }
export interface EgriSerisi { persentil: number; noktalar: EgriNoktasi[] }
export interface GrafikOlcumu { ay: number; deger: number; tarih: string; persentil?: number | null; kaynak?: string }
export interface GrafikVerisi { birim: string; egriler: EgriSerisi[]; noktalar: GrafikOlcumu[] }

/** Colour tokens of the growth charts (light only — the doctor app has no dark theme). */
export const BUYUME_RENK = {
  bandDis: '#e5eadb',   // 3–97
  bandOrta: '#d2ddc8',  // 10–90
  bandIc: '#bccdb2',    // 25–75
  medyan: '#5d7a62',
  olcum: '#b03a62',     // the child — berry, ≥ 3:1 on the card surface
  olcumHalka: '#fffcf6',
  izgara: 'rgba(58,44,34,0.07)',
  eksen: 'rgba(58,44,34,0.16)',
  yuzey: '#fffcf6',
  uyariZemin: '#fbeccd',
  uyariYazi: '#7a4a06',
  iyiZemin: '#e4ebdf',
  iyiYazi: '#2f4334',
} as const;

/** Every word the chart writes (Türkiye's defaults). */
export interface GrafikSozleri {
  ay: string; yas: string; dogum: string; duzeltilmis: string
  kaynak: Record<string, string>
}
export const GRAFIK_TR_SOZLER: GrafikSozleri = {
  ay: 'ay', yas: 'yaş', dogum: 'Doğum', duzeltilmis: 'düzeltilmiş yaş',
  kaynak: { bebek_karti: 'Doğum bilgisi · bebek kartı', intake: 'Doğum bilgisi · hasta bilgi formu', muayene: 'Muayene notu' },
};

/** "2026-09-20" → "20.09.2026" without a timezone shift; timestamps in the viewer's local day. */
export function tarihTR(t: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  const d = new Date(t);
  return isNaN(d.getTime()) ? t : d.toLocaleDateString('tr-TR');
}

type P = [number, number];
type Parca = { c1: P; c2: P; b: P };

/** Monotone cubic (Fritsch–Carlson) segments through points with increasing x — smooth, never overshoots. */
function monotonParcalar(p: P[]): Parca[] {
  const n = p.length;
  if (n < 2) return [];
  const dx: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = p[i + 1][0] - p[i][0]; m[i] = dx[i] ? (p[i + 1][1] - p[i][1]) / dx[i] : 0; }
  const t: number[] = new Array(n);
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t[i] = 0;
    else { const w1 = 2 * dx[i] + dx[i - 1], w2 = dx[i] + 2 * dx[i - 1]; t[i] = (w1 + w2) / (w1 / m[i - 1] + w2 / m[i]); }
  }
  const out: Parca[] = [];
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    out.push({ c1: [p[i][0] + h, p[i][1] + t[i] * h], c2: [p[i + 1][0] - h, p[i + 1][1] - t[i + 1] * h], b: p[i + 1] });
  }
  return out;
}
const f = (v: number) => v.toFixed(1);
function egriYolu(p: P[]): string {
  if (!p.length) return '';
  return `M${f(p[0][0])},${f(p[0][1])}` + monotonParcalar(p).map((s) => `C${f(s.c1[0])},${f(s.c1[1])} ${f(s.c2[0])},${f(s.c2[1])} ${f(s.b[0])},${f(s.b[1])}`).join('');
}
/** Closed band between an upper and a lower curve (same x samples). */
function bantYolu(ust: P[], alt: P[]): string {
  if (ust.length < 2 || alt.length < 2) return '';
  const ileri = egriYolu(ust);
  const altParca = monotonParcalar(alt);
  let geri = `L${f(alt[alt.length - 1][0])},${f(alt[alt.length - 1][1])}`;
  for (let i = altParca.length - 1; i >= 0; i--) {
    const s = altParca[i], bas = i === 0 ? alt[0] : altParca[i - 1].b;
    geri += `C${f(s.c2[0])},${f(s.c2[1])} ${f(s.c1[0])},${f(s.c1[1])} ${f(bas[0])},${f(bas[1])}`;
  }
  return `${ileri}${geri}Z`;
}

/** Hook: the element's content width (ResizeObserver), starting from a sensible server-render width. */
function useGenislik(baslangic: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [g, setG] = useState(baslangic);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((e) => { const w = Math.round(e[0].contentRect.width); if (w > 0) setG(w); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, g] as const;
}

export interface GrafikProps {
  veri: GrafikVerisi
  birim: string
  /** Full-screen view (taller, larger type). */
  buyuk?: boolean
  /** Upper bound of the visible age window (months). Default: the full range of the curves. */
  ustAy?: number
  /** Points are on corrected age (preterm) — the tooltip says so. */
  duzeltilmis?: boolean
  /** Open the tooltip of this point at first render (used by the static preview). */
  baslangicVurgu?: number | null
  sozler?: GrafikSozleri
  /** Fixed width for a server render; normally measured. */
  genislik?: number
}

export function Grafik({ veri, birim, buyuk, ustAy, duzeltilmis, baslangicVurgu = null, sozler = GRAFIK_TR_SOZLER, genislik }: GrafikProps) {
  const [kapRef, olculen] = useGenislik(genislik ?? (buyuk ? 960 : 360));
  const W = Math.max(260, genislik ?? olculen);
  const H = buyuk ? Math.min(560, Math.max(340, Math.round(W * 0.5))) : Math.max(190, Math.min(250, Math.round(W * 0.58)));
  const yazi = buyuk ? 13 : 11;
  const L = buyuk ? 52 : 38, R = buyuk ? 40 : 30, T = buyuk ? 26 : 22, B = buyuk ? 34 : 26;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [vurgu, setVurgu] = useState<number | null>(baslangicVurgu);

  const tamUst = Math.max(6, ...veri.egriler.flatMap((s) => s.noktalar.map((n) => n.ay)), ...veri.noktalar.map((n) => n.ay));
  const ust = Math.min(tamUst, ustAy ?? tamUst);
  // VKİ curves start at 24 months: the axis starts where the reference (or the first point) does — 0 for the others.
  const ilkAylar = [...veri.egriler.map((s) => s.noktalar[0]?.ay), ...veri.noktalar.map((n) => n.ay)].filter((a): a is number => typeof a === 'number');
  const altAy = ilkAylar.length ? Math.max(0, Math.min(...ilkAylar)) : 0;

  const hesap = useMemo(() => {
    const icinde = (a: number) => a <= ust + 1e-6;
    // Curve samples inside the window plus the first one past it (the clip path trims the overhang).
    const kes = (n: EgriNoktasi[]) => { const i = n.findIndex((p) => !icinde(p.ay)); return i < 0 ? n : n.slice(0, i + 1); };
    const seri = new Map(veri.egriler.map((s) => [s.persentil, kes(s.noktalar)]));
    const gorunenOlcum = veri.noktalar.map((n, i) => ({ ...n, i })).filter((n) => icinde(n.ay));
    const degerler = [
      ...[...seri.values()].flatMap((n) => n.filter((p) => icinde(p.ay)).map((p) => p.deger)),
      ...gorunenOlcum.map((n) => n.deger),
    ];
    const mn = degerler.length ? Math.min(...degerler) : 0, mx = degerler.length ? Math.max(...degerler) : 1;
    // The plot spans the data (bands + points) with a little air; ticks are the round values inside it.
    const pay = (mx - mn || 1) * 0.06;
    const alt = Math.max(0, mn - pay), ustD = mx + pay;
    const t = degerTikleri(alt, ustD, buyuk ? 6 : 4);
    const yt = { tikler: t.tikler.filter((v) => v >= alt - 1e-9 && v <= ustD + 1e-9), altSinir: alt, ustSinir: ustD };
    return { seri, gorunenOlcum, yt };
  }, [veri, ust, buyuk]);

  const x = (ay: number) => L + ((ay - altAy) / (ust - altAy || 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - hesap.yt.altSinir) / (hesap.yt.ustSinir - hesap.yt.altSinir || 1)) * (H - T - B);
  const pts = (p: number): P[] => (hesap.seri.get(p) || []).map((n) => [x(n.ay), y(n.deger)]);

  const bantlar: [number, number, string][] = [[97, 3, BUYUME_RENK.bandDis], [90, 10, BUYUME_RENK.bandOrta], [75, 25, BUYUME_RENK.bandIc]];
  const xtHam = yasTikleri(ust);
  const xt = { ...xtHam, tikler: xtHam.tikler.filter((t) => t.ay >= altAy - 1e-6) };

  // Right-edge band labels: 50 first, then the pairs 3/97, 10/90, 25/75 — a pair is shown only when both fit.
  const etiketler: { p: number; yy: number }[] = [];
  const kenarY = (p: number) => {
    const son = (hesap.seri.get(p) || []).filter((n) => n.ay <= ust + 1e-6).pop();
    if (!son) return null;
    const yy = y(son.deger);
    return yy < T - 2 || yy > H - B + 2 ? null : yy;
  };
  for (const grup of [[50], [3, 97], [10, 90], [25, 75]]) {
    const yer = grup.map((p) => ({ p, yy: kenarY(p) }));
    if (yer.some((e) => e.yy == null)) continue;
    if (yer.every((e) => etiketler.every((o) => Math.abs(o.yy - e.yy!) >= yazi + 1))) etiketler.push(...(yer as { p: number; yy: number }[]));
  }

  const olc = hesap.gorunenOlcum;
  const son = olc[olc.length - 1];
  const olcumYolu = olc.length > 1 ? olc.map((n, k) => `${k ? 'L' : 'M'}${f(x(n.ay))},${f(y(n.deger))}`).join('') : '';
  const r = buyuk ? 7 : 5.5;

  // Latest-point label: value · percentile on a small white pill. Of four spots around the dot, the first that stays
  // inside the plot and covers least of the child's own line wins.
  let sonEtiket: { x: number; y: number; w: number; h: number; metin: string } | null = null;
  if (son) {
    const metin = `${degerMetni(son.deger, birim)}${son.persentil != null ? ` · ${persentilEtiketi(son.persentil)}` : ''}`;
    const sx = x(son.ay), sy = y(son.deger);
    const w = Math.round(metin.length * (yazi + 0.5) * 0.5 + 14), h = yazi + 11;
    const ornek: P[] = [];
    for (let k = 1; k < olc.length; k++) {
      const a: P = [x(olc[k - 1].ay), y(olc[k - 1].deger)], b: P = [x(olc[k].ay), y(olc[k].deger)];
      for (let t = 0; t <= 1; t += 0.05) ornek.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
    const adaylar = [
      { x: sx + 10, y: sy - r - 6 - h }, { x: sx - 10 - w, y: sy - r - 6 - h },
      { x: sx + 10, y: sy + r + 6 }, { x: sx - 10 - w, y: sy + r + 6 },
      { x: sx - w / 2, y: sy - r - 8 - h }, { x: sx - w - 6, y: sy - r - 14 - 2 * h }, { x: sx - w / 2, y: sy - r - 14 - 2 * h },
    ];
    const puan = (c: { x: number; y: number }) => {
      const disari = c.x < L || c.x + w > W - R + 4 || c.y < T - 8 || c.y + h > H - B ? 1000 : 0;
      const ic = ([px, py]: P, pay: number) => px >= c.x - pay && px <= c.x + w + pay && py >= c.y - pay && py <= c.y + h + pay;
      return disari + ornek.filter((q) => ic(q, 3)).length + 8 * olc.filter((n) => ic([x(n.ay), y(n.deger)], r + 3)).length;
    };
    const en = adaylar.reduce((a, b) => (puan(b) < puan(a) ? b : a));
    sonEtiket = { x: Math.max(L + 2, Math.min(W - R - w + 4, en.x)), y: en.y, w, h, metin };
  }

  const aktif = vurgu != null ? veri.noktalar[vurgu] : null;
  const tip: CSSProperties | null = aktif ? (() => {
    const px = x(aktif.ay), py = y(aktif.deger);
    const solda = px > W * 0.62;
    return {
      position: 'absolute', top: Math.max(4, py - 12), transform: 'translateY(-100%)',
      ...(solda ? { right: Math.max(4, W - px - 14) } : { left: Math.max(4, px - 14) }),
    };
  })() : null;

  return (
    <div ref={kapRef} style={{ position: 'relative', width: '100%' }} onMouseLeave={() => setVurgu(baslangicVurgu)}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Büyüme eğrisi, ${birim}`} style={{ display: 'block', overflow: 'visible', fontFamily: CHROME_FONT.sans }}>
        <defs>
          <clipPath id={`k${uid}`}><rect x={L} y={T - 1} width={W - L - R} height={H - T - B + 2} /></clipPath>
        </defs>
        {/* value grid + ticks */}
        {hesap.yt.tikler.map((v, i) => (
          <g key={`y${i}`}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={BUYUME_RENK.izgara} strokeWidth={1} />
            <text x={L - 8} y={y(v) + yazi * 0.35} textAnchor="end" fontSize={yazi} fill={CHROME_RENK.muted} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {v.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}
            </text>
          </g>
        ))}
        {hesap.yt.tikler.length > 0 && (
          <text x={L - 8} y={Math.max(yazi, y(hesap.yt.tikler[hesap.yt.tikler.length - 1]) - yazi - 4)} textAnchor="end" fontSize={yazi} fontWeight={600} fill={CHROME_RENK.muted}>{birim}</text>
        )}
        {/* bands + median */}
        <g clipPath={`url(#k${uid})`}>
          {bantlar.map(([u, a, renk]) => <path key={u} d={bantYolu(pts(u), pts(a))} fill={renk} />)}
          <path d={egriYolu(pts(50))} fill="none" stroke={BUYUME_RENK.medyan} strokeWidth={buyuk ? 2 : 1.6} strokeLinecap="round" />
        </g>
        {/* age axis */}
        <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke={BUYUME_RENK.eksen} strokeWidth={1} />
        {xt.tikler.map((t, i) => (
          <g key={`x${i}`}>
            <line x1={x(t.ay)} x2={x(t.ay)} y1={H - B} y2={H - B + 4} stroke={BUYUME_RENK.eksen} strokeWidth={1} />
            <text x={x(t.ay)} y={H - B + 6 + yazi} textAnchor="middle" fontSize={yazi} fill={CHROME_RENK.muted} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {i === xt.tikler.length - 1 ? `${t.etiket} ${xt.birim === 'ay' ? sozler.ay : sozler.yas}` : t.etiket}
            </text>
          </g>
        ))}
        {/* band labels on the right edge */}
        {etiketler.map((e) => (
          <text key={e.p} x={W - R + 6} y={e.yy + yazi * 0.35} fontSize={yazi - 1} fontWeight={e.p === 50 ? 700 : 500} fill={e.p === 50 ? BUYUME_RENK.medyan : CHROME_RENK.muted} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {e.p}
          </text>
        ))}
        {/* the child */}
        {olcumYolu && <path d={olcumYolu} fill="none" stroke={BUYUME_RENK.olcum} strokeWidth={buyuk ? 3 : 2.4} strokeLinejoin="round" strokeLinecap="round" />}
        {olc.map((n) => {
          const sonMu = n === son, akt = vurgu === n.i;
          return (
            <g key={n.i}>
              <circle cx={x(n.ay)} cy={y(n.deger)} r={(sonMu ? r + 1 : r) + (akt ? 1.5 : 0)} fill={BUYUME_RENK.olcum} stroke={BUYUME_RENK.olcumHalka} strokeWidth={2.5} />
              <circle
                cx={x(n.ay)} cy={y(n.deger)} r={16} fill="transparent" tabIndex={0} role="button"
                aria-label={`${yasMetni(n.ay)}, ${tarihTR(n.tarih)}: ${degerMetni(n.deger, birim)}${n.persentil != null ? `, ${persentilEtiketi(n.persentil)}` : ''}`}
                style={{ cursor: 'pointer', outline: 'none' }}
                onMouseEnter={() => setVurgu(n.i)} onFocus={() => setVurgu(n.i)} onBlur={() => setVurgu(null)}
                onClick={(e) => { e.stopPropagation(); setVurgu(n.i); }}
              />
            </g>
          );
        })}
        {sonEtiket && vurgu == null && (
          <g pointerEvents="none">
            {son && (() => {
              // A leader to the dot when the pill had to move away from it.
              const sx = x(son.ay), sy = y(son.deger);
              const kx = Math.max(sonEtiket.x, Math.min(sonEtiket.x + sonEtiket.w, sx)), ky = Math.max(sonEtiket.y, Math.min(sonEtiket.y + sonEtiket.h, sy));
              const d = Math.hypot(kx - sx, ky - sy);
              if (d <= r + 14) return null;
              const k = (r + 4) / d;
              return <line x1={kx} y1={ky} x2={sx + (kx - sx) * k} y2={sy + (ky - sy) * k} stroke={CHROME_RENK.muted} strokeOpacity={0.6} strokeWidth={1} />;
            })()}
            <rect x={sonEtiket.x} y={sonEtiket.y} width={sonEtiket.w} height={sonEtiket.h} rx={sonEtiket.h / 2} fill="#fff" stroke="rgba(58,44,34,0.12)" />
            <text x={sonEtiket.x + sonEtiket.w / 2} y={sonEtiket.y + sonEtiket.h / 2 + yazi * 0.36} textAnchor="middle" fontSize={yazi + 0.5} fontWeight={700} fill={CHROME_RENK.ink} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {sonEtiket.metin}
            </text>
          </g>
        )}
      </svg>
      {aktif && tip && (
        <div role="status" style={{ ...tip, pointerEvents: 'none', background: '#fff', border: '1px solid rgba(58,44,34,0.12)', borderRadius: 10, padding: '8px 11px', boxShadow: '0 6px 20px rgba(58,44,34,0.12)', fontSize: 12.5, color: CHROME_RENK.ink, whiteSpace: 'nowrap', zIndex: 2, lineHeight: 1.35 }}>
          <div style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {degerMetni(aktif.deger, birim)}
            {aktif.persentil != null && <span style={{ fontWeight: 600, color: CHROME_RENK.muted, fontSize: 13 }}> · {persentilEtiketi(aktif.persentil)}</span>}
          </div>
          <div style={{ color: CHROME_RENK.muted }}>{tarihTR(aktif.tarih)} · {aktif.ay < 0.25 ? sozler.dogum : yasMetni(aktif.ay)}{duzeltilmis && aktif.ay < 24 ? ` (${sozler.duzeltilmis})` : ''}</div>
          {aktif.kaynak && sozler.kaynak[aktif.kaynak] && <div style={{ color: CHROME_RENK.muted, fontSize: 11.5 }}>{sozler.kaynak[aktif.kaynak]}</div>}
        </div>
      )}
    </div>
  );
}

/** Tiny key for the bands and the child's line — shown once above the cards. */
export function GrafikAnahtari({ stil }: { stil?: CSSProperties }) {
  const kutu = (renk: string): CSSProperties => ({ display: 'inline-block', width: 14, height: 10, borderRadius: 3, background: renk, verticalAlign: '-1px', marginRight: 5 });
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 14px', fontSize: 12.5, color: CHROME_RENK.muted, ...stil }}>
      <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 9, background: BUYUME_RENK.olcum, marginRight: 6, boxShadow: `0 0 0 2px ${BUYUME_RENK.olcumHalka}` }} />Ölçümler</span>
      <span><span style={{ display: 'inline-block', width: 14, height: 2, background: BUYUME_RENK.medyan, verticalAlign: '3px', marginRight: 5 }} />50. persentil</span>
      <span><span style={kutu(BUYUME_RENK.bandIc)} />25–75</span>
      <span><span style={kutu(BUYUME_RENK.bandOrta)} />10–90</span>
      <span><span style={kutu(BUYUME_RENK.bandDis)} />3–97 persentil</span>
    </span>
  );
}

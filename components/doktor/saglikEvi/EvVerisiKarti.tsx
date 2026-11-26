'use client'
/**
 * HASTA-PORTALI-GUNLUK → EV-VERISI-V2 — "Ev verisi" card in the patient file (core: every branş; the metrics shown depend
 * only on what the patient logged). Loaded on demand (next/dynamic from the patient-file page; its own request, never
 * part of the patient-file payload — performans-butcesi-koruma). Pure SVG / CSS, no chart or animation library.
 *
 * First view answers "is this patient OK at home?": one status sentence (calm / attention / urgent), İlaç + Ölçüm rings,
 * one tile per metric (hero value, trend vs the previous 3 weeks, smooth 28-day curve with the target band), the
 * patient's question. Everything else — alerts + "Gördüm", per-medicine 14-day strip + kritik flag, per-reading list,
 * Kontrol Öncesi Özet, per-patient thresholds — sits one tap away under "Ayrıntılar". Without the patient's KVKK
 * consent: that fact only (data access and the API contract are unchanged; see lib/saglikEvi/hekimSunucu.ts).
 */
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import dinamik from 'next/dynamic'
import type { EvVerisiKarti as Veri } from '@/lib/saglikEvi/evVerisi'
import { CHROME_RENK as R, CHROME_FONT as F } from '@/lib/doktor/chromeRenk'
import { doktorFetch } from '@/lib/doktor/oturumFetch'
import {
  HALKA_RENK, TON_PALET, TON_RENK, acikUyarilar, anaDeger, durumCumlesi, egilim, gunlukSeri, haftaninEksikDozlari,
  hedefDisi, hatirlatmasiKapaliKritikler, HATIRLATMA_KAPALI_NOTU, ilacOzetDurumu, karoYayilimi, kisaAd, metrikRengi, olcumGunleri, puruzsuzYol, sayi, sonOlcumMetni, uyariTonuKart, type Metrik, type Ton,
} from '@/lib/saglikEvi/evVerisiGorunum'
import { HEKIM_TON_ETIKETI, UYARI_RENK } from '@/lib/saglikEvi/uyariRenkleri'
import { UyariIsareti } from './UyariIsareti'
import { HekimPushIstemi } from './HekimPushIstemi'
import type { Sekme } from './EvVerisiAyrintilar'

// Details and threshold editing: own lazy chunk, fetched only when the doctor opens them.
const panelYukleniyor = () => <div className="evv-iskelet" style={{ height: 120, marginTop: 18 }} />
const Ayrintilar = dinamik(() => import('./EvVerisiAyrintilar'), { ssr: false, loading: panelYukleniyor })
const EsikPaneli = dinamik(() => import('./EvVerisiAyrintilar').then((m) => m.EsikPaneli), { ssr: false, loading: panelYukleniyor })
const ModulPaneli = dinamik(() => import('./EvVerisiAyrintilar').then((m) => m.ModulPaneli), { ssr: false, loading: panelYukleniyor })

const CSS = `
.evv{font-family:${F.sans};color:${R.ink};background:#fffdf9;border:1px solid ${R.border};border-radius:22px;padding:22px 24px 20px;position:relative;overflow:hidden;box-shadow:0 1px 0 rgba(58,44,34,.03),0 18px 40px -30px rgba(58,44,34,.35)}
.evv *{box-sizing:border-box}
.evv-tint{position:absolute;inset:0 0 auto 0;height:240px;pointer-events:none}
.evv-bas{position:relative;display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:18px}
.evv-bas h2{margin:0;font-size:15px;font-weight:700;letter-spacing:.005em}
.evv-bas h2 span{font-weight:500;color:${R.muted};margin-left:8px;font-size:13.5px}
.evv-taze{font-size:12.5px;color:${R.muted};white-space:nowrap}
.evv-ust{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:28px;align-items:center;margin-bottom:22px}
.evv-durum{display:flex;gap:14px;align-items:flex-start;background:none;border:0;padding:0;text-align:left;color:inherit;font:inherit;cursor:default}
.evv-durum[data-tik="1"]{cursor:pointer}
.evv-nokta{flex:none;width:10px;height:10px;border-radius:50%;margin-top:13px}
.evv-cumle{font-family:${F.serif};font-weight:480;font-size:27px;line-height:1.22;letter-spacing:-.012em;margin:0;max-width:30ch;text-wrap:balance}
.evv-alt{margin:8px 0 0;font-size:14.5px;line-height:1.45;color:${R.muted};max-width:60ch;text-wrap:pretty}
.evv-halkalar{display:flex;align-items:center;gap:18px;background:none;border:0;padding:6px 4px;color:inherit;font:inherit;text-align:left;cursor:pointer;border-radius:16px}
.evv-halka-svg{width:112px;height:112px;flex:none}
.evv-lej{display:grid;gap:12px;min-width:150px}
.evv-lej-s{display:grid;grid-template-columns:10px auto;column-gap:9px;align-items:baseline}
.evv-lej-s i{width:8px;height:8px;border-radius:50%;display:block;align-self:center}
.evv-lej-ad{font-size:12.5px;color:${R.muted}}
.evv-lej-d{grid-column:2;font-family:${F.serif};font-weight:560;font-size:24px;line-height:1.05;letter-spacing:-.01em}
.evv-lej-d small{font-family:${F.sans};font-weight:500;font-size:12.5px;color:${R.muted};margin-left:4px;letter-spacing:0}
.evv-lej-n{grid-column:2;font-size:12px;color:${R.muted};margin-top:2px}
.evv-karolar{display:grid;gap:12px;grid-template-columns:repeat(12,minmax(0,1fr))}
.evv-duzen{display:grid;gap:12px;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr)}
.evv-sag{display:grid;gap:12px;grid-template-columns:repeat(var(--evv-k),minmax(0,1fr))}
.evv-karo{all:unset;box-sizing:border-box;display:flex;flex-direction:column;gap:2px;background:#f8f3ea;border-radius:18px;padding:14px 16px 12px;cursor:pointer;min-width:0;transition:background .2s ease}
.evv-karo:hover{background:#f4eee2}
.evv-karo[data-one="1"]{padding:18px 20px 14px}
.evv-karo-ad{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#5d4f43}
.evv-karo-ad i{width:8px;height:8px;border-radius:50%;flex:none}
.evv-deger{display:flex;align-items:baseline;gap:5px;margin-top:6px;font-family:${F.serif};font-weight:560;font-size:34px;line-height:1;letter-spacing:-.02em;font-variant-numeric:lining-nums}
.evv-karo[data-one="1"] .evv-deger{font-size:56px;margin-top:10px}
.evv-deger small{font-family:${F.sans};font-size:13px;font-weight:500;color:${R.muted};letter-spacing:0}
.evv-acik{font-size:12px;color:${R.muted};margin-top:3px}
.evv-egilim{display:flex;align-items:center;gap:5px;font-size:12.5px;margin-top:5px;font-weight:500}
.evv-grafik{margin-top:auto;padding-top:10px}
.evv-grafik svg{display:block;width:100%;height:auto;overflow:visible}
.evv-eksen{display:block;padding-right:30px}
.evv-eksen-cizim{display:block;position:relative}
.evv-eksen-et{position:absolute;font-size:11px;color:${R.muted};line-height:1}
.evv-eksen-hedef{left:100%;margin-left:8px;transform:translateY(-50%)}
.evv-eksen-alt{display:flex;justify-content:space-between;font-size:11px;color:${R.muted};margin-top:6px}
.evv-dipnot{font-size:12px;color:${R.muted};margin:10px 2px 0;text-align:right}
.evv-soru{margin:16px 0 0;padding:14px 18px;background:#f8f3ea;border-radius:16px}
.evv-soru p{margin:0;font-family:${F.serif};font-style:italic;font-weight:480;font-size:17px;line-height:1.45}
.evv-soru span{display:block;font-size:12px;color:${R.muted};margin-top:6px}
.evv-alt-satir{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:16px}
.evv-btn{min-height:38px;padding:0 16px;border-radius:999px;border:1px solid ${R.border};background:#f6f0e6;color:${R.ink};font:600 13.5px ${F.sans};cursor:pointer;display:inline-flex;align-items:center;gap:8px}
.evv-btn:disabled{opacity:.55;cursor:default}
.evv-btn-ana{background:${R.pine};border-color:${R.pine};color:#faf6ee}
.evv-btn svg{transition:transform .25s ease}
.evv-btn[aria-expanded="true"] svg{transform:rotate(180deg)}
.evv-not{font-size:12px;color:${R.muted};margin-left:auto}
.evv-ac{display:grid;grid-template-rows:0fr;transition:grid-template-rows .32s cubic-bezier(.2,.7,.2,1)}
.evv-ac[data-acik="1"]{grid-template-rows:1fr}
.evv-ac>div{overflow:hidden;min-height:0}
.evv-ac[data-acik="0"]>div{visibility:hidden;transition:visibility 0s .32s}
.evv-ayr{border-top:1px solid ${R.borderSoft};margin-top:18px;padding-top:16px}
.evv-sekmeler{display:flex;gap:2px;background:#f1eadf;border-radius:999px;padding:3px;width:max-content;max-width:100%;overflow-x:auto;scrollbar-width:none}
.evv-sekmeler button{all:unset;cursor:pointer;padding:7px 14px;border-radius:999px;font-size:13px;font-weight:600;color:#6d5f52;white-space:nowrap}
.evv-sekmeler button[aria-selected="true"]{background:#fff;color:${R.ink};box-shadow:0 1px 2px rgba(58,44,34,.12)}
.evv-panel{padding-top:14px}
.evv-satir{display:grid;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid ${R.borderSoft};font-size:14px}
.evv-satir:last-child{border-bottom:0}
.evv-kucuk{font-size:12.5px;color:${R.muted}}
.evv-ilac{grid-template-columns:minmax(0,1fr) auto 44px auto}
.evv-serit{display:flex;gap:3px}
.evv-serit b{width:9px;height:18px;border-radius:3px;display:block}
.evv-serit b[data-d="alinmadi"]{background:transparent!important;box-shadow:inset 0 0 0 1.6px ${R.warn}}
.evv-anahtar{all:unset;position:relative;width:38px;height:22px;border-radius:999px;background:#e4ddd1;cursor:pointer;transition:background .2s ease;flex:none}
.evv-anahtar::after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.18);transition:transform .2s ease}
.evv-anahtar[aria-checked="true"]{background:${R.warn}}
.evv-anahtar[aria-checked="true"]::after{transform:translateX(16px)}
.evv-anahtar[data-ton="ilac"][aria-checked="true"]{background:${HALKA_RENK.ilac}}
.evv-anahtar:disabled{opacity:.6;cursor:default}
.evv-modul{grid-template-columns:12px minmax(0,1fr) auto auto}
.evv-modul[data-acik="0"]{color:#7a6c5f}
.evv-modul-nokta{width:10px;height:10px;border-radius:50%;display:block}
.evv-modul-baslik{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:${R.muted};margin:10px 0 0}
.evv-bag{all:unset;cursor:pointer;font-size:12.5px;font-weight:600;color:#0b7a70;padding:2px 2px}
.evv-bag:hover{text-decoration:underline}
.evv-cipler{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.evv-cip{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;font-size:13px;font-weight:600;background:#f6f0e6;color:#5d4f43}
.evv-cip[aria-pressed="true"]{background:${R.ink};color:#faf6ee}
.evv-cip i{width:7px;height:7px;border-radius:50%}
.evv-liste{max-height:340px;overflow-y:auto}
.evv-iskelet{background:linear-gradient(90deg,#f3ede3 0%,#faf6ee 50%,#f3ede3 100%);background-size:200% 100%;animation:evv-parla 1.4s linear infinite;border-radius:14px}
.evv :focus-visible{outline:2px solid ${R.pine};outline-offset:2px}
.evv-ciz{stroke-dasharray:1;stroke-dashoffset:0;animation:evv-ciz 1.1s cubic-bezier(.3,.6,.2,1) both}
.evv-dolgu{animation:evv-sol .9s .35s ease both}
.evv-halka-yay{animation:evv-halka 1.1s cubic-bezier(.3,.6,.2,1) both}
.evv-son{animation:evv-sol .4s .9s ease both}
@keyframes evv-ciz{from{stroke-dashoffset:1}}
@keyframes evv-halka{from{stroke-dashoffset:var(--evv-c)}}
@keyframes evv-sol{from{opacity:0}}
@keyframes evv-parla{to{background-position:-200% 0}}
@media (max-width:900px){.evv-duzen{grid-template-columns:1fr}.evv-sag{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:640px){
 .evv{padding:18px 16px 16px;border-radius:20px}
 .evv-ust{grid-template-columns:1fr;gap:18px}
 .evv-cumle{font-size:22px}
 .evv-halka-svg{width:92px;height:92px}
 .evv-karolar{grid-template-columns:repeat(2,minmax(0,1fr))}
 .evv-karolar>.evv-karo{grid-column:auto!important}
 .evv-dipnot{text-align:left}
 .evv-ilac{grid-template-columns:auto 1fr auto;row-gap:8px}
 .evv-sekmeler{width:100%}
 .evv-sekmeler button{flex:1 0 auto;text-align:center;padding:7px 9px;font-size:12.5px}
 .evv-ilac>span:first-child{grid-column:1/-1}
 .evv-karo{padding:12px 13px 10px}
 .evv-deger{font-size:28px}
 .evv-karo[data-one="1"] .evv-deger{font-size:46px}
 .evv-not{margin-left:0;flex-basis:100%}
 .evv-taze{display:none}
}
@media (prefers-reduced-motion:reduce){.evv *{animation:none!important;transition:none!important}}
`

const trTarih = (iso: string) => new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'Europe/Istanbul' })

function Ok({ yon, renk }: { yon: -1 | 0 | 1; renk: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden style={{ flex: 'none' }}>
      {yon === 0 ? <path d="M2 6h8M7.5 3.5 10 6 7.5 8.5" fill="none" stroke={renk} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        : <path d={yon > 0 ? 'M6 10V2M2.8 5.2 6 2l3.2 3.2' : 'M6 2v8M2.8 6.8 6 10l3.2-3.2'} fill="none" stroke={renk} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

/** Smooth 28-day curve of daily means, target band / lines, latest point emphasised. Few readings → dots only. */
function Egri({ m, simdiMs, genis, kolon }: { m: Metrik; simdiMs: number; genis: boolean; kolon?: number }) {
  const id = useId().replace(/:/g, '')
  const renk = metrikRengi(m.anahtar)
  const seri = useMemo(() => gunlukSeri(m, simdiMs), [m, simdiMs])
  const kb = m.anahtar === 'kb'
  const W = genis ? 600 : Math.round(280 * Math.max(1, (kolon ?? 3) / 3)), H = genis ? 285 : 74, PT = genis ? 22 : 6, PB = genis ? 6 : 4, PR = genis ? 6 : 6
  const degerler = seri.flatMap((s) => [s.y, ...(s.y2 != null ? [s.y2] : [])])
  const hedefler = [m.hedefMin, m.hedefMax, kb ? m.hedefMax2 : null].filter((x): x is number => x != null)
  // EV-ACIL-SEKER: glucometer HI / LO → off-scale triangles on the top / bottom edge (acil red), never a point on the line.
  const t0 = simdiMs - 28 * 86_400_000
  const isaretler = (m.isaretler || []).filter((i) => Date.parse(i.at) >= t0).map((i) => ({ x: Math.min(1, Math.max(0, (Date.parse(i.at) - t0) / (28 * 86_400_000))), isaret: i.isaret }))
  if (!degerler.length && !isaretler.length) return null
  if (!degerler.length) degerler.push(...(hedefler.length ? hedefler : [0, 1]))
  let min = Math.min(...degerler, ...hedefler), max = Math.max(...degerler, ...hedefler)
  const pay = (max - min || Math.abs(max) * 0.1 || 1) * 0.16; min -= pay; max += pay
  const x = (t: number) => t * (W - PR)
  const y = (d: number) => PT + (1 - (d - min) / (max - min || 1)) * (H - PT - PB)
  const nok = seri.map((s) => [x(s.x), y(s.y)] as [number, number])
  const isaretCiz = isaretler.map((i, k) => <path key={`i${k}`} data-isaret={i.isaret} d={i.isaret === 'hi' ? `M${x(i.x) - 6} ${PT - 2} L${x(i.x) + 6} ${PT - 2} L${x(i.x)} ${PT - 12} Z` : `M${x(i.x) - 6} ${H - PB - 8} L${x(i.x) + 6} ${H - PB - 8} L${x(i.x)} ${H - PB + 2} Z`} fill={UYARI_RENK.acil.vurgu} />)
  if (!nok.length) {
    return <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${kisaAd(m.anahtar)}: cihaz ölçüm aralığı dışında`} style={{ overflow: 'visible' }}>{isaretCiz}</svg>
  }
  const nok2 = kb ? seri.filter((s) => s.y2 != null).map((s) => [x(s.x), y(s.y2!)] as [number, number]) : []
  const az = seri.length < 3
  const yol = az ? '' : puruzsuzYol(nok)
  const son = nok[nok.length - 1]
  const bant = !az && m.hedefMin != null && m.hedefMax != null
  const buHafta = x(21 / 28)
  const svg = (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${kisaAd(m.anahtar)}, son 4 hafta`}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={renk} stopOpacity={genis ? 0.2 : 0.17} />
          <stop offset="100%" stopColor={renk} stopOpacity="0" />
        </linearGradient>
      </defs>
      {genis ? <rect x={buHafta} y={0} width={W - PR - buHafta} height={H} rx={10} fill={R.ink} opacity={0.035} /> : null}
      {bant ? <rect x={0} width={W - PR} y={y(m.hedefMax!)} height={Math.max(0, y(m.hedefMin!) - y(m.hedefMax!))} rx={4} fill={renk} opacity={genis ? 0.07 : 0.06} /> : null}
      {!bant && !az ? [m.hedefMax, m.hedefMin, kb ? m.hedefMax2 : null].map((v, i) => (v != null ? <line key={i} x1={0} x2={W - PR} y1={y(v)} y2={y(v)} stroke={renk} strokeOpacity={0.4} strokeDasharray="3 4" strokeWidth={1} /> : null)) : null}
      {!az ? (
        <>
          {!kb ? <path className="evv-dolgu" d={`${yol} L${son[0].toFixed(1)} ${H - PB} L${nok[0][0].toFixed(1)} ${H - PB} Z`} fill={`url(#g${id})`} /> : null}
          {kb && nok2.length > 2 ? <path className="evv-ciz" pathLength={1} d={puruzsuzYol(nok2)} fill="none" stroke={renk} strokeOpacity={0.45} strokeWidth={genis ? 2 : 1.6} strokeLinecap="round" /> : null}
          <path className="evv-ciz" pathLength={1} d={yol} fill="none" stroke={renk} strokeWidth={genis ? 2.75 : 2.2} strokeLinecap="round" strokeLinejoin="round" />
          {genis ? nok.slice(0, -1).map(([a, b], i) => <circle key={i} cx={a} cy={b} r={2.3} fill={renk} opacity={0.32} />) : null}
        </>
      ) : nok.map(([a, b], i) => <circle key={i} cx={a} cy={b} r={3.4} fill={renk} opacity={i === nok.length - 1 ? 0 : 0.55} />)}
      <g className="evv-son">
        <circle cx={son[0]} cy={son[1]} r={genis ? 9 : 7} fill={renk} opacity={0.16} />
        <circle cx={son[0]} cy={son[1]} r={genis ? 4.8 : 4} fill={renk} stroke="#fffdf9" strokeWidth={2} />
      </g>
      {isaretCiz}
    </svg>
  )
  if (!genis) return svg
  // Labels in HTML (not SVG text) so they stay readable at every width.
  const yuzde = (v: number) => `${(y(v) / H) * 100}%`
  return (
    <span className="evv-eksen">
      <span className="evv-eksen-cizim">
        {svg}
        <span className="evv-eksen-et" style={{ left: `${(buHafta / W) * 100}%`, top: 0, padding: '6px 9px' }}>bu hafta</span>
        {hedefler.map((v) => <span key={v} className="evv-eksen-et evv-eksen-hedef" style={{ top: yuzde(v) }}>{sayi(v)}</span>)}
      </span>
      <span className="evv-eksen-alt"><span>4 hafta önce</span><span>bugün</span></span>
    </span>
  )
}

/** Activity-style concentric rings: outer İlaç (this week's doses taken), inner Ölçüm (days with a reading, of 7). */
function Halkalar({ ilac, olcum }: { ilac: number | null; olcum: number }) {
  const C = 60
  const halka = (r: number, oran: number | null, renk: string) => {
    const c = 2 * Math.PI * r
    const o = Math.max(0, Math.min(1, oran ?? 0))
    return (
      <g transform={`rotate(-90 ${C} ${C})`}>
        <circle cx={C} cy={C} r={r} fill="none" stroke={renk} strokeOpacity={0.15} strokeWidth={12} />
        {o > 0 ? <circle className="evv-halka-yay" cx={C} cy={C} r={r} fill="none" stroke={renk} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - o)} style={{ ['--evv-c' as string]: c }} /> : null}
      </g>
    )
  }
  return (
    <svg className="evv-halka-svg" viewBox="0 0 120 120" aria-hidden>
      {ilac !== null ? halka(52, ilac, HALKA_RENK.ilac) : null}
      {halka(ilac !== null ? 37 : 52, olcum, HALKA_RENK.olcum)}
    </svg>
  )
}

function Karo({ m, simdiMs, one, uyarili, ac, kolon }: { m: Metrik; simdiMs: number; one: boolean; uyarili: Ton | null; ac: () => void; kolon?: number }) {
  const d = anaDeger(m, simdiMs)
  const azVeri = useMemo(() => gunlukSeri(m, simdiMs).length < 3, [m, simdiMs])
  const e = egilim(m)
  const vurgu = uyarili ? TON_RENK[uyarili].ana : hedefDisi(m) ? TON_RENK.dikkat.ana : null
  const renk = metrikRengi(m.anahtar)
  const sonIsaret = !m.noktalar.length && m.isaretler?.length ? m.isaretler[m.isaretler.length - 1] : null
  return (
    <button type="button" className="evv-karo" data-one={one ? '1' : '0'} style={kolon ? { gridColumn: `span ${kolon}` } : undefined} onClick={ac} aria-label={`${kisaAd(m.anahtar)}: ${d.metin} ${m.birim}, ${d.aciklama}${e ? `, ${e.metin}` : ''}. Ölçümleri göster.`}>
      <span className="evv-karo-ad"><i style={{ background: renk }} />{kisaAd(m.anahtar)}{uyarili && uyarili !== 'sakin' ? <UyariIsareti ton={TON_PALET[uyarili]} etiket={HEKIM_TON_ETIKETI[TON_PALET[uyarili]]} kucuk style={{ marginLeft: 'auto' }} /> : null}</span>
      {sonIsaret ? <span className="evv-deger" style={{ color: UYARI_RENK.acil.ana }}>{sonIsaret.isaret.toUpperCase()}<small>cihaz ölçüm aralığı {sonIsaret.isaret === 'hi' ? 'üstü' : 'altı'}</small></span> : <span className="evv-deger">{d.metin}<small>{m.birim}</small></span>}
      {m.isaretler?.length && m.noktalar.length ? <span className="evv-acik" style={{ color: UYARI_RENK.acil.ana, fontWeight: 600 }}>Cihaz {m.isaretler.filter((i) => i.isaret === 'hi').length ? `HI ×${m.isaretler.filter((i) => i.isaret === 'hi').length}` : ''}{m.isaretler.filter((i) => i.isaret === 'lo').length ? ` LO ×${m.isaretler.filter((i) => i.isaret === 'lo').length}` : ''} · ortalamaya katılmadı</span> : null}
      {e ? (
        <span className="evv-egilim" style={{ color: vurgu ?? R.muted }}><Ok yon={e.yon} renk={vurgu ?? R.muted} />{e.metin}</span>
      ) : <span className="evv-acik">{azVeri ? 'Eğilim için birkaç gün daha ölçüm gerekiyor' : d.aciklama}</span>}
      {e && one ? <span className="evv-acik">{d.aciklama}, {m.hafta.n} ölçüm</span> : null}
      {!azVeri || one ? <span className="evv-grafik"><Egri m={m} simdiMs={simdiMs} genis={one} kolon={kolon} /></span> : null}
    </button>
  )
}

function Kabuk({ children, ton }: { children: React.ReactNode; ton?: Ton }) {
  return (
    <section id="ev-verisi-karti" className="evv" style={{ gridColumn: '1 / -1' }} aria-label="Ev verisi">
      <style>{CSS}</style>
      {ton ? <div className="evv-tint" style={{ background: `linear-gradient(180deg, ${TON_RENK[ton].yumusak}, rgba(255,253,249,0) 100%)` }} /> : null}
      {children}
    </section>
  )
}

export default function EvVerisiKarti({ patientId, ornek }: { patientId: string; ornek?: Veri }) {
  const [veri, setVeri] = useState<Veri | null>(ornek || null)
  const [hata, setHata] = useState<string | null>(null)
  const [acik, setAcikHam] = useState(false)
  const [acildi, setAcildi] = useState(false)
  const setAcik = (a: boolean) => { setAcikHam(a); if (a) setAcildi(true) }
  const [sekme, setSekme] = useState<Sekme>('uyarilar')
  const [metrik, setMetrik] = useState<string | null>(null)
  const [esikAcik, setEsikAcik] = useState(false)
  const [mesgul, setMesgul] = useState(false)
  const [simdiMs] = useState(() => Date.now())
  const url = `/api/doktor/hastalar/${encodeURIComponent(patientId)}/ev-verisi`
  const yukle = useCallback(async () => {
    if (ornek) return
    try {
      const r = await doktorFetch(url, {})
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j?.error || 'Ev verisi yüklenemedi.')
      setVeri(j as Veri); setHata(null)
    } catch (e) { setHata(e instanceof Error ? e.message : 'Ev verisi yüklenemedi.') }
  }, [url, ornek])
  useEffect(() => { void yukle() }, [yukle])
  useEffect(() => {
    if (typeof window === 'undefined') return
    const q = new URLSearchParams(window.location.search)
    if (q.get('ev') === '1') document.getElementById('ev-verisi-karti')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const s = q.get('evAyrinti') as Sekme | null
    if (s && ['uyarilar', 'ilaclar', 'olcumler', 'ozet', 'hedefler', 'moduller'].includes(s)) { setAcik(true); setSekme(s) }
  }, [veri])
  const istek = async (method: 'POST' | 'PATCH', govde: Record<string, unknown>) => {
    if (ornek) {
      // Example data (internal demo): show the result locally, nothing is sent.
      setVeri((v) => {
        if (!v) return v
        if (govde.islem === 'gordum') return { ...v, uyarilar: v.uyarilar.map((u) => ({ ...u, goruldu: true })), acikUyari: 0 }
        const md = govde.modul as { anahtar: string; durum: 'acik' | 'kapali' | 'otomatik' } | undefined
        if (md) {
          const moduller = v.moduller.map((m) => (m.anahtar !== md.anahtar ? m : { ...m, hekimSecimi: md.durum === 'otomatik' ? null : md.durum, acik: md.durum === 'otomatik' ? m.kaynak != null && !m.hastaKapatti : md.durum === 'acik', kaynak: md.durum === 'acik' && !m.kaynak ? 'hekim' as const : m.kaynak }))
          return { ...v, moduller, olcumTipleri: moduller.filter((m) => m.acik && m.tur === 'olcum').map((m) => m.anahtar as never) }
        }
        const p = govde.plan as { planId: string; kritik: boolean } | undefined
        if (p) return { ...v, planlar: v.planlar.map((x) => (x.id === p.planId ? { ...x, kritik: p.kritik } : x)) }
        return v
      })
      return
    }
    setMesgul(true)
    try { await doktorFetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(govde) }); await yukle() } finally { setMesgul(false) }
  }
  const kaydet = (a: Record<string, unknown>) => istek('PATCH', { ayarlar: a })
  const durum = useMemo(() => (veri && veri.onay ? durumCumlesi(veri, simdiMs) : null), [veri, simdiMs])

  const baslik = (sag?: string | null) => (
    <div className="evv-bas">
      <h2>Ev verisi<span>Sağlığım günlüğünden</span></h2>
      {sag ? <span className="evv-taze">{sag}</span> : null}
    </div>
  )

  if (hata) {
    return (
      <Kabuk>{baslik()}
        <p className="evv-alt" style={{ marginTop: 0 }}>{hata}</p>
        <button type="button" className="evv-btn" style={{ marginTop: 12 }} onClick={() => { setHata(null); void yukle() }}>Tekrar dene</button>
      </Kabuk>
    )
  }
  if (!veri) {
    return (
      <Kabuk>{baslik()}
        <div aria-busy="true" aria-label="Ev verisi yükleniyor">
          <div className="evv-iskelet" style={{ height: 30, width: '62%', marginBottom: 10 }} />
          <div className="evv-iskelet" style={{ height: 16, width: '38%', marginBottom: 22 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>{[0, 1, 2, 3].map((i) => <div key={i} className="evv-iskelet" style={{ height: 132 }} />)}</div>
        </div>
      </Kabuk>
    )
  }

  if (!veri.onay) {
    return (
      <Kabuk>{baslik()}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden style={{ flex: 'none' }}>
            <circle cx="36" cy="36" r="31" fill="none" stroke={HALKA_RENK.ilac} strokeOpacity=".22" strokeWidth="8" strokeDasharray="2 7" strokeLinecap="round" />
            <circle cx="36" cy="36" r="19" fill="none" stroke={HALKA_RENK.olcum} strokeOpacity=".28" strokeWidth="8" strokeDasharray="2 7" strokeLinecap="round" />
          </svg>
          <div style={{ flex: '1 1 260px' }}>
            <p className="evv-cumle" style={{ fontSize: 23 }}>{veri.kullaniyor ? 'Hasta ev verisini henüz sizinle paylaşmadı' : 'Hasta henüz Sağlığım günlüğünü kullanmıyor'}</p>
            <p className="evv-alt">{veri.kullaniyor ? 'Sağlığım günlüğünü kullanıyor ancak paylaşım için açık rızasını (KVKK) vermedi. Onay sorusu hastanın ekranında duruyor; onay verdiğinde ölçümler ve ilaç uyumu burada görünür.' : 'Sağlığım bağlantısı gönderildiğinde ilaç saatleri ve ev ölçümleri, hastanın onayıyla burada görünür.'}</p>
          </div>
        </div>
        <div className="evv-alt-satir">
          <button type="button" className="evv-btn" aria-expanded={esikAcik} onClick={() => setEsikAcik(!esikAcik)}>Modüller, hedef ve eşikler<Chevron /></button>
        </div>
        <div className="evv-ac" data-acik={esikAcik ? '1' : '0'}><div>{esikAcik ? <div className="evv-ayr"><ModulPaneli veri={veri} istek={istek} mesgul={mesgul} /><div style={{ height: 18 }} /><EsikPaneli veri={veri} kaydet={kaydet} /></div> : null}</div></div>
      </Kabuk>
    )
  }

  const d = durum!
  const ton = d.ton
  const eksik = haftaninEksikDozlari(veri)
  // DOZ-KAYDI-ISTEGE-BAGLI: the İlaç ring only where a real % exists; otherwise a calm slate fact, never a fake 0 %.
  const ilacDurum = ilacOzetDurumu(veri)
  const ilacOran = ilacDurum?.tur === 'yuzde' ? ilacDurum.yuzde / 100 : null
  const sessizKritik = hatirlatmasiKapaliKritikler(veri)
  const gunler = olcumGunleri(veri, simdiMs)
  const acikU = acikUyarilar(veri)
  const one = d.metrik && veri.metrikler.length >= 3 ? d.metrik : null
  const sirali = one ? [...veri.metrikler].sort((a, b) => Number(b.anahtar === one) - Number(a.anahtar === one)) : veri.metrikler
  const uyariTonu = (anahtar: string): Ton | null => {
    const u = acikU.find((x) => x.metrik === anahtar || anahtar.startsWith(`${x.metrik}:`))
    return u ? uyariTonuKart(u) : null
  }
  const ayrintiAc = (s: Sekme, mk?: string) => { setSekme(s); if (mk) setMetrik(mk); setAcik(true) }
  const yayilim = karoYayilimi(sirali.length)
  const soru = veri.sorular[0]
  const bos = !veri.metrikler.length && !veri.uyum.ilaclar.length

  return (
    <Kabuk ton={ton}>
      {baslik(sonOlcumMetni(veri, simdiMs))}
      {/* HEKIM-PUSH: one-time prompt to get acil / doctor-notify alerts on the phone (never in the example). */}
      {!ornek ? <HekimPushIstemi /> : null}
      <div className="evv-ust">
        <button type="button" className="evv-durum" data-tik={acikU.length ? '1' : '0'} onClick={acikU.length ? () => ayrintiAc('uyarilar') : undefined} tabIndex={acikU.length ? 0 : -1} aria-label={acikU.length ? `${d.baslik}. Uyarıyı göster.` : undefined}>
          <span className="evv-nokta" style={ton === 'uyum' ? { background: 'transparent', border: `2px dashed ${TON_RENK.uyum.vurgu}`, width: 12, height: 12 } : { background: TON_RENK[ton].vurgu, boxShadow: `0 0 0 5px ${TON_RENK[ton].yumusak.replace(/0\.\d+\)$/, '0.16)')}` }} aria-hidden />
          <span>
            {ton !== 'sakin' ? <span style={{ display: 'block', marginBottom: 8 }}><UyariIsareti ton={TON_PALET[ton]} etiket={HEKIM_TON_ETIKETI[TON_PALET[ton]]} /></span> : null}
            <span role="status" className="evv-cumle" style={{ display: 'block' }}>{d.baslik}</span>
            {d.alt ? <span className="evv-alt" style={{ display: 'block' }}>{d.alt}</span> : null}
          </span>
        </button>
        {!bos ? (
          <button type="button" className="evv-halkalar" onClick={() => ayrintiAc('ilaclar')} aria-label={`${ilacDurum?.tur === 'yuzde' ? `İlaç uyumu bu hafta ${ilacDurum.yuzde} yüzde` : ilacDurum?.tur === 'tutmuyor' ? 'Hasta doz kaydı tutmuyor' : ilacDurum?.tur === 'kayit_yok' ? 'İlaç: kayıt yok' : 'Planlı ilaç yok'}; ölçüm girilen gün ${gunler}/7. İlaçları göster.`}>
            <Halkalar ilac={ilacOran} olcum={gunler / 7} />
            <span className="evv-lej">
              {ilacDurum?.tur === 'yuzde' ? (
                <span className="evv-lej-s">
                  <i style={{ background: HALKA_RENK.ilac }} /><span className="evv-lej-ad">İlaç, bu hafta</span>
                  <span className="evv-lej-d">{`%${ilacDurum.yuzde}`}{ilacDurum.ay != null ? <small>30 günde %{ilacDurum.ay}</small> : null}</span>
                  {eksik.toplam ? <span className="evv-lej-n" style={{ color: TON_RENK.uyum.ana, display: 'inline-flex', alignItems: 'center', gap: 5 }}><svg width="11" height="11" viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="8.5" fill="none" stroke={TON_RENK.uyum.vurgu} strokeWidth="3" strokeDasharray="3.2 3" /></svg>{eksik.toplam} doz alınmadı (“Atladım”){eksik.ilaclar.length === 1 ? ` · ${eksik.ilaclar[0]}` : ''}</span> : <span className="evv-lej-n">İşaretlenen dozların hepsi alındı</span>}
                </span>
              ) : ilacDurum ? (
                <span className="evv-lej-s" data-testid="ilac-kayit-yok">
                  <i style={{ background: 'transparent', border: `1.5px dashed ${TON_RENK.uyum.vurgu}`, boxSizing: 'border-box' }} /><span className="evv-lej-ad">İlaç</span>
                  <span className="evv-lej-d" style={{ fontSize: 15, color: TON_RENK.uyum.ana }}>{ilacDurum.tur === 'tutmuyor' ? 'Hasta doz kaydı tutmuyor' : 'Kayıt yok'}</span>
                  <span className="evv-lej-n">{ilacDurum.tur === 'tutmuyor' ? 'Hatırlatma alıyor; işaretlenmeyen doz alınmadı demek değildir' : 'Bu hafta işaretlenen doz yok'}</span>
                </span>
              ) : null}
              {sessizKritik.length ? (
                <span className="evv-lej-s" data-testid="kritik-hatirlatma-kapali">
                  <i style={{ background: 'transparent', border: `1.5px dashed ${TON_RENK.uyum.vurgu}`, boxSizing: 'border-box' }} /><span className="evv-lej-ad" style={{ color: TON_RENK.uyum.ana }}>{HATIRLATMA_KAPALI_NOTU}</span>
                  <span className="evv-lej-n">{sessizKritik.join(', ')} · kritik</span>
                </span>
              ) : null}
              <span className="evv-lej-s">
                <i style={{ background: HALKA_RENK.olcum }} /><span className="evv-lej-ad">Ölçüm girilen gün</span>
                <span className="evv-lej-d">{gunler}<small>/ 7</small></span>
              </span>
            </span>
          </button>
        ) : null}
      </div>

      {veri.metrikler.length ? (
        <>
          {one ? (
            <div className="evv-duzen">
              <Karo m={sirali[0]} simdiMs={simdiMs} one uyarili={uyariTonu(sirali[0].anahtar)} ac={() => ayrintiAc('olcumler', sirali[0].anahtar)} />
              <div className="evv-karolar evv-sag" style={{ ['--evv-k' as string]: sirali.length - 1 >= 4 ? 2 : 1 }}>
                {sirali.slice(1).map((m) => <Karo key={m.anahtar} m={m} simdiMs={simdiMs} one={false} uyarili={uyariTonu(m.anahtar)} ac={() => ayrintiAc('olcumler', m.anahtar)} />)}
              </div>
            </div>
          ) : (
            <div className="evv-karolar">
              {sirali.map((m, i) => <Karo key={m.anahtar} m={m} simdiMs={simdiMs} one={false} uyarili={uyariTonu(m.anahtar)} ac={() => ayrintiAc('olcumler', m.anahtar)} kolon={yayilim[i]} />)}
            </div>
          )}
          {veri.metrikler.some((m) => egilim(m)) ? <p className="evv-dipnot">Büyük rakamlar 7 günlük ortalama; değişim önceki 3 haftaya göre.</p> : null}
        </>
      ) : !bos ? (
        <div data-bos="1" style={{ background: '#f8f3ea', borderRadius: 18, padding: '22px 20px', display: 'flex', gap: 16, alignItems: 'center' }}>
          <svg width="88" height="34" viewBox="0 0 88 34" aria-hidden style={{ flex: 'none' }}><path d="M2 26 C 16 26, 20 12, 34 14 S 56 28, 68 18 S 82 8, 86 8" fill="none" stroke={R.muted} strokeOpacity=".35" strokeWidth="2" strokeDasharray="3 5" strokeLinecap="round" /></svg>
          <span className="evv-kucuk" style={{ fontSize: 14 }}>Son 4 haftada ev ölçümü yok. Hasta ilk ölçümünü girdiğinde eğilim grafikleri burada belirir.</span>
        </div>
      ) : null}

      {soru ? (
        <figure className="evv-soru">
          <p>“{soru.metin}”</p>
          <span>Hastanın sorusu, {trTarih(soru.tarih)}{veri.sorular.length > 1 ? ` · ${veri.sorular.length - 1} soru daha` : ''}</span>
        </figure>
      ) : null}

      <div className="evv-alt-satir">
        <button type="button" className="evv-btn evv-btn-ana" aria-expanded={acik} onClick={() => setAcik(!acik)}>Ayrıntılar<Chevron /></button>
        {veri.kontrolOzeti ? <button type="button" className="evv-btn" onClick={() => ayrintiAc('ozet')}>Kontrol öncesi özet</button> : null}
        <span className="evv-not">Ölçümler hastanın kendi cihazından; değerlendirme hekime aittir.</span>
      </div>
      <div className="evv-ac" data-acik={acik ? '1' : '0'}>
        <div>{acik || acildi ? <Ayrintilar veri={veri} sirali={sirali} sekme={sekme} setSekme={setSekme} metrik={metrik} setMetrik={setMetrik} mesgul={mesgul} istek={istek} kaydet={kaydet} /> : null}</div>
      </div>
    </Kabuk>
  )
}

function Chevron() {
  return <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

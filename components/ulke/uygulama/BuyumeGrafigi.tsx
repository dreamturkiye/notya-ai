'use client'

/**
 * AU-ARAC-GORUNUM-01 — THE GROWTH CHART, as a plot. Reads the SAME kept results the flat list already shows
 * (./AracKayitlari.tsx is untouched) for the kit's `buyume-persentili` tool and draws them against the WHO
 * standard's own percentile bands (lib/ulke/araclar/buyumeGrafigi.ts — no new clinical content, see that file).
 *
 * NOT MOUNTED ANYWHERE YET. `buyume-persentili` is itself a switched-OFF slot of every pack today (e.g. Australia's
 * own `countries/au/araclar/yuvalarim.ts`, `acik: false`): the mechanism is ready and tested, but no pack has
 * turned it on, because the SAME clinical-lead sign-off `AU-DEPTH-PARITY-02` already asks for (a named local
 * clinician confirming the WHO standard is the right chart to show) gates the tool itself, not just this view of
 * it. Building the chart now, inert until that sign-off, means the view does not have to be built twice; wiring it
 * onto a patient's file before the tool exists would show every patient an empty chart for no reason. See
 * docs/OPEN-COMMITMENTS.md.
 *
 * Text is NOT yet routed through the per-country catalogue (lib/ulke/arayuz/metinTipleri.ts): with nothing
 * switched on anywhere to read it in the account's own form, adding new mandatory words to every pack's text file
 * for a view nobody can reach yet would be guesswork, not localisation. `metin` is a small, local, explicit prop —
 * whichever pack mounts this once the tool is live supplies its own words the same way every other tool's copy
 * comes from that pack, not a shared default. Logged as the same follow-up, not a new one.
 */
import React, { useCallback, useEffect, useState } from 'react'
import type { Uygulama } from './Kabuk'
import { buyumeCinsiyeti, buyumeEgrileriWho, buyumeNoktalari, BUYUME_PARAMETRELERI, BUYUME_PERSENTILI_ANAHTARI, type BuyumeNoktasi, type BuyumeParametresi } from '@/lib/ulke/araclar/buyumeGrafigi'
import type { EgriSerisi } from '@/lib/clinical/lmsCekirdek'
import { ARAC_KAYDI_API, type AracKaydi } from '@/lib/ulke/araclar/kayitTipleri'

export type BuyumeGrafigiMetni = {
  baslik: string
  /** No measurement of this parameter has been kept for this patient yet. */
  bos: string
  parametreAdi: Readonly<Record<BuyumeParametresi, string>>
  birim: Readonly<Record<BuyumeParametresi, string>>
  kaynak: string
}

const RENK_50 = '#0F9B8E'
const RENK_DIS = 'rgba(100,116,139,0.55)'
const RENK_ORTA = 'rgba(15,118,110,0.45)'
const RENK_IC = 'rgba(15,118,110,0.75)'
const RENK_NOKTA = '#C2410C'

function bandRenk(persentil: number): string {
  if (persentil === 50) return RENK_50
  if (persentil === 25 || persentil === 75) return RENK_IC
  if (persentil === 10 || persentil === 90) return RENK_ORTA
  return RENK_DIS
}

/** One parameter's chart: the WHO bands and this patient's own points. Pure SVG, no text but the axis numbers. */
export function Grafik({ egriler, noktalar }: { egriler: readonly EgriSerisi[]; noktalar: readonly BuyumeNoktasi[] }) {
  const W = 320, H = 190, L = 34, R = 10, T = 10, B = 22
  const maxAy = Math.max(...egriler.flatMap((s) => s.noktalar.map((n) => n.ay)), ...noktalar.map((n) => n.ay), 6)
  const degerler = [...egriler.flatMap((s) => s.noktalar.map((n) => n.deger)), ...noktalar.map((n) => n.deger)]
  let min = Math.min(...degerler), max = Math.max(...degerler)
  const pad = (max - min || 1) * 0.08
  min = Math.max(0, min - pad); max = max + pad
  const x = (ay: number) => L + (ay / maxAy) * (W - L - R)
  const y = (v: number) => T + (1 - (v - min) / (max - min || 1)) * (H - T - B)
  const path = (n: readonly { ay: number; deger: number }[]) => n.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.ay).toFixed(1)},${y(p.deger).toFixed(1)}`).join(' ')
  const p50 = egriler.find((s) => s.persentil === 50)
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-hidden="true" style={{ display: 'block' }}>
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <g key={i}>
          <line x1={L} x2={W - R} y1={T + f * (H - T - B)} y2={T + f * (H - T - B)} stroke="rgba(58,44,34,0.12)" strokeWidth="1" />
          <text x={L - 6} y={T + f * (H - T - B) + 3.5} textAnchor="end" fontSize={9.5} fill="#8b7d70">{Math.round((min + (max - min) * (1 - f)) * 10) / 10}</text>
        </g>
      ))}
      {p50 && p50.noktalar.length > 0 && (
        <path d={`${path(p50.noktalar)} L${x(p50.noktalar[p50.noktalar.length - 1].ay).toFixed(1)},${y(min).toFixed(1)} L${x(0).toFixed(1)},${y(min).toFixed(1)} Z`} fill={RENK_50} fillOpacity={0.08} />
      )}
      {egriler.map((s) => (
        <path key={s.persentil} d={path(s.noktalar)} fill="none" stroke={bandRenk(s.persentil)} strokeWidth={s.persentil === 50 ? 2.2 : 1.1} strokeDasharray={s.persentil === 50 ? undefined : '3 3'} strokeLinecap="round" />
      ))}
      {noktalar.map((n, i) => (
        <circle key={i} cx={x(n.ay)} cy={y(n.deger)} r={4} fill={RENK_NOKTA} stroke="#fff" strokeWidth={1.5}>
          <title>{`${Math.round(n.ay * 10) / 10}m — ${n.deger}`}</title>
        </circle>
      ))}
    </svg>
  )
}

/** Pure: one card per parameter the patient has at least one kept measurement of. */
export function BuyumeGrafigiGorunumu({ metin, kayitlar, cinsiyetVarsayilan }: { metin: BuyumeGrafigiMetni; kayitlar: readonly AracKaydi[] | null; cinsiyetVarsayilan?: 'male' | 'female' | null }) {
  if (!kayitlar) return null
  const cinsiyet = buyumeCinsiyeti(kayitlar) ?? cinsiyetVarsayilan ?? null
  const paramlar = BUYUME_PARAMETRELERI.map((p) => ({ p, noktalar: buyumeNoktalari(kayitlar, p) })).filter((x) => x.noktalar.length > 0)
  if (!cinsiyet || !paramlar.length) return null
  return (
    <section className="uza-kart" data-alan="buyume-grafigi" data-arac={BUYUME_PERSENTILI_ANAHTARI}>
      <h2 className="uza-h2">{metin.baslik}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {paramlar.map(({ p, noktalar }) => {
          const maxAy = Math.max(...noktalar.map((n) => n.ay))
          return (
            <div key={p}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{metin.parametreAdi[p]} <span style={{ fontWeight: 400, color: '#8b7d70' }}>({metin.birim[p]})</span></div>
              <Grafik egriler={buyumeEgrileriWho(p, cinsiyet, maxAy)} noktalar={noktalar} />
            </div>
          )
        })}
      </div>
      <p className="uza-ipucu" style={{ marginTop: 10 }}>{metin.kaynak}</p>
    </section>
  )
}

/** The card: reads the patient's kept results and shows the chart. null while nothing is kept yet — no empty chart shown. */
export function BuyumeGrafigiKarti({ u, hastaId, metin, cinsiyetVarsayilan }: { u: Uygulama; hastaId: string; metin: BuyumeGrafigiMetni; cinsiyetVarsayilan?: 'male' | 'female' | null }) {
  const [kayitlar, setKayitlar] = useState<AracKaydi[] | null>(null)
  const { hesap, api } = u
  const yukle = useCallback(() => {
    api(`${ARAC_KAYDI_API}?hasta=${encodeURIComponent(hastaId)}`).then((r) => { if (r.ok && Array.isArray(r.j.kayitlar)) setKayitlar(r.j.kayitlar) }).catch(() => { /* no chart without a readable list */ })
  }, [api, hastaId])
  useEffect(() => { if (hesap) yukle() }, [hesap, yukle])
  return <BuyumeGrafigiGorunumu metin={metin} kayitlar={kayitlar} cinsiyetVarsayilan={cinsiyetVarsayilan} />
}

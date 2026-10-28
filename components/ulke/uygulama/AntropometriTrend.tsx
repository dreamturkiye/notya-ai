'use client'

/**
 * AU-DIETETICS-TREND-01 — adult anthropometry trend on the patient's file.
 *
 * Reads kept results of the pack-named body-size tool (`UlkeAraclari.antropometriTrendAraci`) and plots
 * weight (kg), waist (cm) and BMI over time. Wall rule D7: this file never names a country-prefixed key.
 */
import React, { useCallback, useEffect, useState } from 'react'
import type { Uygulama } from './Kabuk'
import { paketAraci } from './aracOrtak'
import { arayuz, araclarMetni } from '@/lib/ulke/arayuz'
import {
  ANTROPOMETRI_PARAMETRELERI,
  antropometriNoktalari,
  type AntropometriNoktasi,
  type AntropometriParametresi,
} from '@/lib/ulke/araclar/antropometriTrend'
import { ARAC_KAYDI_API, type AracKaydi } from '@/lib/ulke/araclar/kayitTipleri'

export type AntropometriTrendMetni = {
  baslik: string
  bos: string
  parametreAdi: Readonly<Record<AntropometriParametresi, string>>
  birim: Readonly<Record<AntropometriParametresi, string>>
  kaynak: string
}

const RENK = { agirlik: '#0F9B8E', bel: '#C2410C', bmi: '#1D4ED8' } as const

/** Pure SVG: one series of dated points. X = visit order (equal spacing by date order). */
export function AntropometriGrafik({ noktalar, renk }: { noktalar: readonly AntropometriNoktasi[]; renk: string }) {
  const W = 320, H = 160, L = 40, R = 12, T = 12, B = 28
  if (noktalar.length === 0) return null
  const degerler = noktalar.map((n) => n.deger)
  let min = Math.min(...degerler), max = Math.max(...degerler)
  const pad = (max - min || 1) * 0.12
  min = Math.max(0, min - pad)
  max = max + pad
  const n = Math.max(noktalar.length - 1, 1)
  const x = (i: number) => L + (i / n) * (W - L - R)
  const y = (v: number) => T + (1 - (v - min) / (max - min || 1)) * (H - T - B)
  const path = noktalar.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.deger).toFixed(1)}`).join(' ')
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-hidden="true" style={{ display: 'block' }}>
      {[0, 0.5, 1].map((f, i) => (
        <g key={i}>
          <line x1={L} x2={W - R} y1={T + f * (H - T - B)} y2={T + f * (H - T - B)} stroke="rgba(58,44,34,0.12)" strokeWidth="1" />
          <text x={L - 6} y={T + f * (H - T - B) + 3.5} textAnchor="end" fontSize={9.5} fill="#8b7d70">{Math.round((min + (max - min) * (1 - f)) * 10) / 10}</text>
        </g>
      ))}
      <path d={path} fill="none" stroke={renk} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      {noktalar.map((p, i) => (
        <circle key={`${p.tarih}-${i}`} cx={x(i)} cy={y(p.deger)} r={4} fill={renk} stroke="#fff" strokeWidth={1.5}>
          <title>{`${p.tarih} — ${p.deger}`}</title>
        </circle>
      ))}
      {noktalar.map((p, i) => (
        <text key={`t-${p.tarih}-${i}`} x={x(i)} y={H - 8} textAnchor="middle" fontSize={8.5} fill="#8b7d70">
          {p.tarih.slice(5)}
        </text>
      ))}
    </svg>
  )
}

export function AntropometriTrendGorunumu({
  metin,
  kayitlar,
  aracAnahtari,
}: {
  metin: AntropometriTrendMetni
  kayitlar: readonly AracKaydi[] | null
  aracAnahtari: string
}) {
  if (!kayitlar) return null
  const paramlar = ANTROPOMETRI_PARAMETRELERI.map((p) => ({
    p,
    noktalar: antropometriNoktalari(kayitlar, aracAnahtari, p),
  })).filter((x) => x.noktalar.length > 0)
  if (!paramlar.length) {
    return (
      <section className="uza-kart" data-alan="antropometri-trend" data-arac={aracAnahtari}>
        <h2 className="uza-h2">{metin.baslik}</h2>
        <p className="uza-bos">{metin.bos}</p>
      </section>
    )
  }
  return (
    <section className="uza-kart" data-alan="antropometri-trend" data-arac={aracAnahtari}>
      <h2 className="uza-h2">{metin.baslik}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {paramlar.map(({ p, noktalar }) => (
          <div key={p} data-parametre={p}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              {metin.parametreAdi[p]}{' '}
              <span style={{ fontWeight: 400, color: '#8b7d70' }}>({metin.birim[p]})</span>
            </div>
            <AntropometriGrafik noktalar={noktalar} renk={RENK[p]} />
            <ul className="uza-liste" style={{ marginTop: 8 }}>
              {[...noktalar].reverse().slice(0, 6).map((n) => (
                <li key={`${p}-${n.tarih}`}>
                  <span className="uza-liste-ad">{n.tarih}</span>
                  <span className="uza-liste-alt">
                    {n.deger} {metin.birim[p]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="uza-ipucu" style={{ marginTop: 10 }}>{metin.kaynak}</p>
    </section>
  )
}

/** Card on the patient's file. null when the pack names no antropometriTrendAraci or omits catalogue text. */
export function AntropometriTrendKarti({ u, hastaId }: { u: Uygulama; hastaId: string }) {
  const [kayitlar, setKayitlar] = useState<AracKaydi[] | null>(null)
  const { hesap, api, dil } = u
  const icerik = arayuz().araclar
  const anahtar = icerik?.antropometriTrendAraci ?? null
  const metin = araclarMetni(dil).antropometriTrend
  const acik = Boolean(icerik && metin && anahtar && paketAraci(icerik, anahtar))
  const yukle = useCallback(() => {
    api(`${ARAC_KAYDI_API}?hasta=${encodeURIComponent(hastaId)}`)
      .then((r) => { if (r.ok && Array.isArray(r.j.kayitlar)) setKayitlar(r.j.kayitlar) })
      .catch(() => { /* no chart without a readable list */ })
  }, [api, hastaId])
  useEffect(() => { if (hesap && acik) yukle() }, [hesap, acik, yukle])
  if (!acik || !metin || !anahtar) return null
  return <AntropometriTrendGorunumu metin={metin} kayitlar={kayitlar} aracAnahtari={anahtar} />
}

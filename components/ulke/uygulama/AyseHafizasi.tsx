'use client'

/**
 * AYSE-OGRENME-V3f — Settings › the assistant's memory, in a country build: the learning momentum (corrections per
 * approved note) with its honest empty state. The same card as Türkiye's Ayarlar › Ayşe'nin hafızası (white card, pine
 * line, same figures: first→last average, direction from six notes, the weekly line), drawn once for every country with
 * the pack's words. NO WORD IS WRITTEN HERE: every string is the pack's (`ayarlar.ayseHafizasi`); a pack form without
 * them has no row.
 *
 * The figures come from /api/ulke/hafiza/ivme, which reads only this account's own measurements. The row never
 * breaks the Settings page: a failed or missing answer shows the pack's one "could not be loaded" line (or nothing).
 */
import React, { useEffect, useState } from 'react'
import { AyarSatiri } from './AyarSatiri'
import type { Uygulama } from './Kabuk'
import type { UygulamaMetni } from '@/lib/ulke/arayuz'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeRenk'
import type { HaftalikOzet, IvmeSonucu } from '@/lib/doktor/ogrenme/ivme'

type Sozler = NonNullable<UygulamaMetni['ayarlar']['ayseHafizasi']>

/** The direction sentence: only said when there is enough data (the server's `yon`). */
export function yonMetni(s: IvmeSonucu, m: Sozler): string {
  return s.yon === 'azaliyor' ? m.ivmeAzaliyor : s.yon === 'artiyor' ? m.ivmeArtiyor : s.yon === 'sabit' ? m.ivmeSabit : m.ivmeErken
}

/** The weekly line, or null when the server has none (fewer than three notes, or none this week). */
export function haftaMetni(h: HaftalikOzet | null, m: Sozler): string | null {
  if (!h) return null
  return h.oncekiHaftaOrtalama == null
    ? yerine(m.haftalik, h.buHaftaOrtalama, h.buHaftaNot)
    : yerine(m.haftalikOnceki, h.buHaftaOrtalama, h.buHaftaNot, h.oncekiHaftaOrtalama)
}

function IvmeCizgisi({ seri, etiket }: { seri: { duzeltme: number }[]; etiket: string }) {
  const w = 240
  const h = 44
  const max = Math.max(1, ...seri.map((s) => s.duzeltme))
  const x = (i: number) => (seri.length === 1 ? w / 2 : (i / (seri.length - 1)) * (w - 8) + 4)
  const y = (v: number) => h - 4 - (v / max) * (h - 8)
  const yol = seri.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(s.duzeltme).toFixed(1)}`).join(' ')
  return (
    <svg width={w} height={h} role="img" aria-label={etiket} style={{ display: 'block', marginTop: 8, maxWidth: '100%' }}>
      <path d={yol} fill="none" stroke={CHROME_RENK.pine} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {seri.map((s, i) => <circle key={i} cx={x(i)} cy={y(s.duzeltme)} r={2.5} fill={CHROME_RENK.pine} />)}
    </svg>
  )
}

/** The card itself. Pure: renders in a plain Node test. */
export function AyseHafizasiGorunumu({ m, ivme, haftalik, hata }: { m: Sozler; ivme: IvmeSonucu | null; haftalik: HaftalikOzet | null; hata: boolean }) {
  const hafta = haftaMetni(haftalik, m)
  return (
    <div data-alan="ayse-hafizasi-ivme" style={{ fontFamily: CHROME_FONT.sans, background: '#fff', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 14, padding: '14px 16px' }}>
      <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 20, fontWeight: 500, margin: '0 0 6px', color: '#2e251d' }}>{m.ivmeBaslik}</h2>
      {hata ? <div data-alan="ayse-hafizasi-hata" style={{ fontSize: 13, color: CHROME_RENK.muted }}>{m.yuklenemedi}</div> : null}
      {!hata && ivme && !ivme.yeterli ? <div data-alan="ayse-hafizasi-bos" style={{ fontSize: 13, color: CHROME_RENK.muted }}>{yerine(m.ivmeBos, ivme.n)}</div> : null}
      {!hata && ivme && ivme.yeterli ? (
        <>
          <div style={{ fontSize: 15, fontWeight: 600, color: CHROME_RENK.ink }}>{yerine(m.ivmeSatir, ivme.n, String(ivme.ilkOrtalama), String(ivme.sonOrtalama))}</div>
          <div style={{ fontSize: 13, color: CHROME_RENK.pine, marginTop: 2 }}>{yonMetni(ivme, m)}</div>
          <IvmeCizgisi seri={ivme.seri.slice(-30)} etiket={m.ivmeBirim} />
          {hafta ? <div style={{ fontSize: 13, color: CHROME_RENK.ink, marginTop: 8 }}>{hafta}</div> : null}
          <div style={{ fontSize: 11, color: CHROME_RENK.muted, marginTop: 6 }}>{yerine(m.ivmeNot, ivme.n)} · {m.ivmeBirim}</div>
        </>
      ) : null}
    </div>
  )
}

export function AyseHafizasiSatiri({ u }: { u: Uygulama }) {
  const m = u.m.ayarlar.ayseHafizasi
  const [ivme, setIvme] = useState<IvmeSonucu | null>(null)
  const [haftalik, setHaftalik] = useState<HaftalikOzet | null>(null)
  const [hata, setHata] = useState(false)
  useEffect(() => {
    if (!m) return
    let iptal = false
    void (async () => {
      try {
        const r = await u.api('/api/ulke/hafiza/ivme')
        if (iptal) return
        if (r.ok && r.j.ivme && typeof r.j.ivme === 'object') { setIvme(r.j.ivme as IvmeSonucu); setHaftalik((r.j.haftalik as HaftalikOzet | null) ?? null) } else setHata(true)
      } catch { if (!iptal) setHata(true) }
    })()
    return () => { iptal = true }
  }, [m, u])
  if (!m) return null
  return (
    <AyarSatiri emoji={'✦'} ad={m.baslik} alt={m.aciklama} alan="ayse-hafizasi">
      <AyseHafizasiGorunumu m={m} ivme={ivme} haftalik={haftalik} hata={hata} />
    </AyarSatiri>
  )
}

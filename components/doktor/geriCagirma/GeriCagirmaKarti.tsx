'use client'
/**
 * GERI-CAGIRMA-01 — the home card (CORE: every branş, doktor + sekreter).
 *
 * Shows this month's stored numbers, a six-month trend and "N hasta şu an geri çağrılabilir". HIDDEN ENTIRELY until
 * there is something true to show (a patient who can be recalled now, or a recall that left) — and before migration
 * 196 is applied. It never slows the home page: it reads stored counters (one small request), and only when the
 * stored number is stale does it ask for a refresh, a few seconds after the page has rendered.
 */
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { cagrilabilirCumlesi, SAYIM_KURALI, sayacCumlesi } from '@/lib/geriCagirma/metin'
import type { GeriCagirmaOzeti } from '@/lib/geriCagirma/tipler'

const R = CHROME_RENK
export const GERI_CAGIRMA_YOLU = '/doktor-tools/geri-cagirma'
const YENILEME_GECIKMESI_MS = 4000

const ayKisa = (ay: string) => new Intl.DateTimeFormat('tr-TR', { timeZone: 'UTC', month: 'short' }).format(new Date(`${ay}-15T12:00:00Z`))

/** Pure view (exported for the render test): null when there is nothing to show. */
export function GeriCagirmaKartiGorunumu({ ozet }: { ozet: GeriCagirmaOzeti | null }) {
  const [kural, setKural] = useState(false)
  if (!ozet || !ozet.kurulu || !ozet.goster) return null
  const tepe = Math.max(1, ...ozet.egilim.map((a) => Math.max(a.gonderilen, a.randevuAlan)))
  return (
    <section data-alan="geri-cagirma-karti" style={{ background: '#FFFFFF', border: `1px solid ${R.border}`, borderRadius: 16, padding: 16, margin: '0 0 16px', fontFamily: CHROME_FONT.sans, color: R.ink }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Geri çağırma</h2>
        <button type="button" onClick={() => setKural((v) => !v)} aria-expanded={kural} aria-label="Sayım kuralı" title={SAYIM_KURALI}
          style={{ border: `1px solid ${R.border}`, background: 'transparent', color: R.muted, borderRadius: 999, width: 22, height: 22, fontSize: 12, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>i</button>
      </div>
      <p data-alan="geri-cagirma-sayac" style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.45 }}>{sayacCumlesi(ozet.buAy, ozet.paraBirimi)}</p>
      {kural && <p data-alan="geri-cagirma-kural" style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.5, color: R.muted }}>{SAYIM_KURALI}</p>}
      <div aria-label="Son altı ay: geri çağrılan ve randevu alan hasta sayısı" role="img" style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 54, margin: '12px 0 4px' }}>
        {ozet.egilim.map((a) => (
          <div key={a.ay} title={`${ayKisa(a.ay)}: ${a.gonderilen} geri çağrıldı · ${a.randevuAlan} randevu aldı · ${a.gelen} geldi`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 36, width: '100%', justifyContent: 'center' }}>
              <span style={{ width: 8, height: Math.max(2, Math.round((a.gonderilen / tepe) * 36)), background: R.border, borderRadius: 2 }} />
              <span style={{ width: 8, height: Math.max(2, Math.round((a.randevuAlan / tepe) * 36)), background: R.pine, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 11, color: R.muted }}>{ayKisa(a.ay)}</span>
          </div>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 11, color: R.muted }}>Açık: geri çağrılan hasta · Koyu: randevu alan hasta</p>
      <Link href={GERI_CAGIRMA_YOLU} data-alan="geri-cagirma-baglanti" style={{ display: 'inline-block', marginTop: 10, fontSize: 14, fontWeight: 700, color: R.pine, textDecoration: 'none' }}>
        {ozet.cagrilabilir > 0 ? `${cagrilabilirCumlesi(ozet.cagrilabilir)} → Geri çağırma` : 'Geri çağırma →'}
      </Link>
    </section>
  )
}

export default function GeriCagirmaKarti() {
  const [ozet, setOzet] = useState<GeriCagirmaOzeti | null>(null)
  useEffect(() => {
    let iptal = false
    let zamanlayici: ReturnType<typeof setTimeout> | null = null
    const al = async (yol: string, method: 'GET' | 'POST'): Promise<GeriCagirmaOzeti | null> => {
      try {
        const t = await ensureDoctorAccessToken()
        if (!t) return null
        const r = await fetch(yol, { method, headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
        return r.ok ? ((await r.json()) as GeriCagirmaOzeti) : null
      } catch { return null }
    }
    void al('/api/doktor/geri-cagirma/ozet', 'GET').then((o) => {
      if (iptal || !o) return
      setOzet(o)
      // Stale stored number → one background refresh, after the page has settled. Never when the feature is not installed.
      if (o.kurulu && o.bayat) {
        zamanlayici = setTimeout(() => { void al('/api/doktor/geri-cagirma/yenile', 'POST').then((y) => { if (!iptal && y) setOzet(y) }) }, YENILEME_GECIKMESI_MS)
      }
    })
    return () => { iptal = true; if (zamanlayici) clearTimeout(zamanlayici) }
  }, [])
  return <GeriCagirmaKartiGorunumu ozet={ozet} />
}

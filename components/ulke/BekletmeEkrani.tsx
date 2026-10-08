'use client'

/**
 * NOTYA-ULKE-01 — the single page a signed-in account sees while its pilot access is prepared (/welcome).
 * Shown in the ACCOUNT's language (users.ui_language, read by /api/ulke/hesap), not the browser's: the server page
 * hands over the text for every switched-on language of the country and this picks one.
 * No session, or an account that does not belong to this country → back to login. Nothing else is reachable.
 */
import React from 'react'
import { useEffect, useState } from 'react'
import { ulkeIstemciSupabase } from '@/lib/ulke/istemciSupabase'
import type { DilKodu, YuzeyMetinleri } from '@/lib/ulke/tipler'
import { ulkeYolu } from '@/lib/ulke/yol'
import { CHROME_FONT, CHROME_RENK as R } from '@/lib/doktor/chromeRenk'
import { ULKE_STIL as S, UlkeKart } from './UlkeKart'

export type BekletmeEkraniProps = {
  varsayilanDil: DilKodu
  metinler: Partial<Record<DilKodu, YuzeyMetinleri<'bekletme'>>>
  giris: string
}

export default function BekletmeEkrani({ varsayilanDil, metinler, giris }: BekletmeEkraniProps) {
  const [durum, setDurum] = useState<{ dil: DilKodu; ad: string } | null>(null)

  useEffect(() => {
    let iptal = false
    const supabase = ulkeIstemciSupabase()
    const cik = async () => { try { await supabase?.auth.signOut() } catch { /* already gone */ } if (!iptal) window.location.replace(giris) }
    ;(async () => {
      if (!supabase) { window.location.replace(giris); return }
      const { data } = await supabase.auth.getSession()
      const jeton = data.session?.access_token
      if (!jeton) { window.location.replace(giris); return }
      try {
        const r = await fetch(ulkeYolu('/api/ulke/hesap'), { headers: { Authorization: `Bearer ${jeton}` }, cache: 'no-store' })
        if (!r.ok) { await cik(); return }
        const j = (await r.json()) as { dil?: string; ad?: string }
        const dil = (j.dil && metinler[j.dil as DilKodu] ? j.dil : varsayilanDil) as DilKodu
        if (!iptal) setDurum({ dil, ad: String(j.ad || '') })
      } catch {
        if (!iptal) setDurum({ dil: varsayilanDil, ad: '' })
      }
    })()
    return () => { iptal = true }
  }, [giris, metinler, varsayilanDil])

  const dil = durum?.dil ?? varsayilanDil
  const m = metinler[dil] ?? metinler[varsayilanDil]
  if (!m) return null

  async function cikis() {
    try { await ulkeIstemciSupabase()?.auth.signOut() } catch { /* already gone */ }
    window.location.replace(giris)
  }

  return <BekletmeIcerigi dil={dil} metin={m} ad={durum?.ad ?? ''} yukleniyor={!durum} cikis={cikis} />
}

/** The page itself, without the session logic: what an account reads. Pure, so it can be rendered and leak-tested. */
export function BekletmeIcerigi({ dil, metin: m, ad, yukleniyor, cikis }: { dil: DilKodu; metin: YuzeyMetinleri<'bekletme'>; ad: string; yukleniyor: boolean; cikis: () => void }) {
  return (
    <UlkeKart dil={dil}>
      {yukleniyor ? (
        <p style={{ margin: 0, textAlign: 'center', color: R.muted, fontSize: 15 }}>{m.yukleniyor}</p>
      ) : (
        <div style={{ textAlign: 'center' }}>
          {ad ? <p style={{ margin: '0 0 6px', fontSize: 14, color: R.muted }}>{ad}</p> : null}
          <h1 style={{ margin: 0, fontFamily: CHROME_FONT.serif, fontWeight: 560, fontSize: 'clamp(1.5rem, 5vw, 1.9rem)', lineHeight: 1.2, letterSpacing: '-0.02em', color: R.ink }}>{m.baslik}</h1>
          <p style={{ margin: '16px 0 0', fontSize: 15.5, lineHeight: 1.65, color: R.ink }}>{m.govde}</p>
          <div style={{ marginTop: 26 }}>
            <button type="button" onClick={cikis} style={S.cizgiDugme}>{m.cikis}</button>
          </div>
        </div>
      )}
    </UlkeKart>
  )
}

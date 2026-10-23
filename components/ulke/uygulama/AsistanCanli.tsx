'use client'

/**
 * AU-CANLI-01/02 — the home's entry to the live assistant. It no longer holds a call of its own (that was the one-button
 * widget whose click did nothing): it is the door to the assistant page (/asistan), where Türkiye's page has its voice,
 * its typed chat and its history. FAIL CLOSED: the card draws NOTHING until the server says the assistant is available
 * (`GET /api/ulke/asistan-canli` → `hazir: true`): a pack without the feature, a role without a persona, a deployment
 * without the agents or the secrets — the home looks as it did before.
 */
import React, { useEffect, useState } from 'react'
import type { UygulamaMetni } from '@/lib/ulke/arayuz'
import { YOL, type Api } from './Kabuk'

type Metin = NonNullable<UygulamaMetni['asistanCanli']>

/** Pure: renders in a plain test. */
export function CanliKarti({ t, ad, href }: { t: Metin; ad: string; href: string }) {
  return (
    <section className="uza-kart" data-alan="asistan-canli">
      <p className="uza-ust-yazi">{ad}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 6 }}>
        <a href={href} className="uza-dugme" data-eylem="ac">{t.baslat}</a>
      </div>
      <p className="uza-ipucu" style={{ marginTop: 10 }} data-alan="asistan-canli-not">{t.not}</p>
    </section>
  )
}

export function AsistanCanli({ m, api }: { m: UygulamaMetni; api?: Api }) {
  const t = m.asistanCanli
  const [hazir, setHazir] = useState<{ ad: string } | null>(null)
  useEffect(() => {
    if (!t || !api) return
    let iptal = false
    ;(async () => {
      try {
        const r = await api('/api/ulke/asistan-canli')
        if (!iptal && r.ok && r.j.hazir === true && typeof r.j.ad === 'string' && r.j.ad) setHazir({ ad: r.j.ad })
      } catch { /* stays hidden */ }
    })()
    return () => { iptal = true }
  }, [t, api])
  if (!t || !api || !hazir) return null
  return <CanliKarti t={t} ad={hazir.ad} href={YOL.asistan} />
}

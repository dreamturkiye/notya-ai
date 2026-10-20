'use client'

/**
 * The two voices of the signed-in assistant. Each button asks the account's own route to speak that voice's
 * fixed specialty line. A pack with no voices renders nothing: the caller decides whether to mount this.
 */
import React, { useState } from 'react'
import type { UygulamaMetni } from '@/lib/ulke/arayuz'
import type { Api } from './Kabuk'

export function AsistanSesKontrol({ m, api, sesler }: {
  m: UygulamaMetni
  api?: Api
  sesler: { erkek: string; kadin: string }
}) {
  const [konusuyor, setKonusuyor] = useState<'erkek' | 'kadin' | null>(null)
  const [hata, setHata] = useState(false)

  async function dinle(cinsiyet: 'erkek' | 'kadin') {
    if (!api || konusuyor) return
    setKonusuyor(cinsiyet)
    setHata(false)
    try {
      const r = await api('/api/ulke/asistan-ses', { method: 'POST', govde: { cinsiyet } })
      const ses = typeof r.j.ses === 'string' ? r.j.ses : ''
      if (!r.ok || !ses) { setHata(true); return }
      const ikili = atob(ses)
      const bayt = new Uint8Array(ikili.length)
      for (let i = 0; i < ikili.length; i++) bayt[i] = ikili.charCodeAt(i)
      const url = URL.createObjectURL(new Blob([bayt], { type: 'audio/mpeg' }))
      const oynatici = new Audio(url)
      oynatici.onended = () => URL.revokeObjectURL(url)
      await oynatici.play()
    } catch {
      setHata(true)
    } finally {
      setKonusuyor(null)
    }
  }

  return (
    <div data-alan="asistan-ses">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {(['erkek', 'kadin'] as const).map((cinsiyet) => api ? (
          <button key={cinsiyet} type="button" className="uza-dugme uza-dugme-kucuk uza-dugme-cizgi" data-ses={cinsiyet} disabled={konusuyor !== null} onClick={() => { void dinle(cinsiyet) }}>{sesler[cinsiyet]}</button>
        ) : (
          <span key={cinsiyet} data-ses={cinsiyet}>{sesler[cinsiyet]}</span>
        ))}
      </div>
      {hata ? <p data-alan="asistan-ses-hata">{m.kabuk.hata}</p> : null}
    </div>
  )
}

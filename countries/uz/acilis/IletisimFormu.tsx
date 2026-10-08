'use client'

/**
 * NOTYA-ULKE-01 — "request a price" on the Uzbekistan landing page.
 *
 * Nothing is sent to or stored on Notya's servers: submitting opens the visitor's own mail app with the message
 * written and addressed (mailto:). Chosen on purpose while the data-law gate is open (checklist A1): no personal data
 * of a visitor is collected by the product before the rules for storing it are known.
 * The Turkish clinic page has no contact mechanism to reuse (its "request an offer" label is a link to sign-up).
 */
import React from 'react'
import { useState, type FormEvent } from 'react'
import type { AcilisIcerigi } from './icerik'

type FormMetni = AcilisIcerigi['fiyat']['form']

export function mailtoBaglantisi(adres: string, metin: FormMetni, alan: { adSoyad: string; kurum: string; telefon: string; uzmanlik: string; mesaj: string }): string {
  const satirlar = [
    `${metin.satir.adSoyad}: ${alan.adSoyad}`,
    `${metin.satir.kurum}: ${alan.kurum}`,
    `${metin.satir.telefon}: ${alan.telefon}`,
    `${metin.satir.uzmanlik}: ${alan.uzmanlik}`,
    alan.mesaj ? `${metin.satir.mesaj}: ${alan.mesaj}` : '',
  ].filter(Boolean)
  return `mailto:${adres}?subject=${encodeURIComponent(metin.konu)}&body=${encodeURIComponent(satirlar.join('\n'))}`
}

export function IletisimFormu({ adres, metin }: { adres: string; metin: FormMetni }) {
  const [hata, setHata] = useState('')

  function gonder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const veri = new FormData(e.currentTarget)
    const al = (ad: string) => String(veri.get(ad) ?? '').trim().slice(0, 500)
    const alan = { adSoyad: al('adSoyad'), kurum: al('kurum'), telefon: al('telefon'), uzmanlik: al('uzmanlik'), mesaj: al('mesaj') }
    if (!alan.adSoyad || !alan.telefon) { setHata(metin.eksik); return }
    setHata('')
    window.location.href = mailtoBaglantisi(adres, metin, alan)
  }

  return (
    <form className="uzl-kart uzl-form" onSubmit={gonder} noValidate>
      <p className="uzl-kart-etiket">{metin.etiket}</p>
      <label>
        <span>{metin.adSoyad}</span>
        <input name="adSoyad" autoComplete="name" maxLength={120} />
      </label>
      <label>
        <span>{metin.kurum}</span>
        <input name="kurum" autoComplete="organization" maxLength={160} />
      </label>
      <label>
        <span>{metin.telefon}</span>
        <input name="telefon" type="tel" inputMode="tel" autoComplete="tel" placeholder={metin.telefonOrnek} maxLength={40} />
      </label>
      <label>
        <span>{metin.uzmanlik}</span>
        <input name="uzmanlik" maxLength={120} />
      </label>
      <label>
        <span>{metin.mesaj}</span>
        <textarea name="mesaj" rows={3} maxLength={500} />
      </label>
      {hata ? <p className="uzl-form-hata" role="alert">{hata}</p> : null}
      <button type="submit" className="uzl-dugme uzl-dugme-cam uzl-dugme-tam">{metin.gonder}</button>
      <p className="uzl-form-ipucu">{metin.ipucu}</p>
    </form>
  )
}

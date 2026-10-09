'use client'

/**
 * NOTYA-ULKE-01 — "request a price" on the Uzbekistan landing page.
 *
 * Nothing is sent to or stored on Notya's servers: submitting opens the visitor's own mail app with the message
 * written and addressed (mailto:). Chosen on purpose while the data-law gate is open (checklist A1): no personal data
 * of a visitor is collected by the product before the rules for storing it are known.
 *
 * NOTYA-UZ-ACILIS-02: same form, same fields, same behaviour; it is now set in the card of the Turkish page's
 * closing section (label above a 44px field, full-width button). The Turkish form itself is not reused: it is a
 * trial sign-up that sends the visitor to Türkiye's registration page.
 */
import React from 'react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/doktor-landing/button'
import type { AcilisIcerigi } from '@/lib/ulke/arayuz/acilisTipleri'

type FormMetni = AcilisIcerigi['sorov']['form']

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

const ALAN = 'h-11 rounded-md bg-paper px-3 text-ink shadow-border outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine'
const ETIKET = 'grid gap-1.5 font-outfit text-sm'

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
    <form className="uzl-form flex flex-col gap-4" onSubmit={gonder} noValidate>
      <p className="font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">{metin.etiket}</p>
      <label className={ETIKET}>
        <span className="text-ink-muted">{metin.adSoyad}</span>
        <input name="adSoyad" autoComplete="name" maxLength={120} className={ALAN} />
      </label>
      <label className={ETIKET}>
        <span className="text-ink-muted">{metin.kurum}</span>
        <input name="kurum" autoComplete="organization" maxLength={160} className={ALAN} />
      </label>
      <label className={ETIKET}>
        <span className="text-ink-muted">{metin.telefon}</span>
        <input name="telefon" type="tel" inputMode="tel" autoComplete="tel" placeholder={metin.telefonOrnek} maxLength={40} className={ALAN} />
      </label>
      <label className={ETIKET}>
        <span className="text-ink-muted">{metin.uzmanlik}</span>
        <input name="uzmanlik" maxLength={120} className={ALAN} />
      </label>
      <label className={ETIKET}>
        <span className="text-ink-muted">{metin.mesaj}</span>
        <textarea name="mesaj" rows={3} maxLength={500} className="rounded-md bg-paper px-3 py-2 text-ink shadow-border outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine" />
      </label>
      {hata ? <p className="font-outfit text-sm text-warn" role="alert">{hata}</p> : null}
      <Button type="submit" size="lg">{metin.gonder}</Button>
      <p className="font-outfit text-xs leading-relaxed text-ink-muted">{metin.ipucu}</p>
    </form>
  )
}

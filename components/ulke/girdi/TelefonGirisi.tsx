'use client'

/**
 * THE KIT'S ONE PHONE FIELD: a telephone keypad on a phone (type="tel", inputMode="tel"), the country's own example
 * number as the placeholder, and — once `hata` is set — the country's sentence under the field. The rule itself is
 * lib/telefon/dogrula.ts (the same on the server); the caller decides when to show the message.
 */
import React from 'react'
import { ulkePaketi } from '@/lib/ulke/ulke'

export function TelefonGirisi({ id, deger, degistir, hata, ad, maxLength = 40, zorunlu, ek }: {
  id: string
  deger: string
  degistir: (metin: string) => void
  /** The sentence to show under the field, or null. */
  hata: string | null
  ad?: string
  maxLength?: number
  zorunlu?: boolean
  ek?: Readonly<Record<string, string | number | boolean | undefined>>
}) {
  const hataId = `${id}-hata`
  return (
    <>
      <input id={id} name={ad} className="uza-girdi" type="tel" inputMode="tel" autoComplete="tel" value={deger} onChange={(e) => degistir(e.target.value)} placeholder={ulkePaketi().telefon.ornek} maxLength={maxLength}
        aria-required={zorunlu || undefined} aria-invalid={hata ? true : undefined} aria-describedby={hata ? hataId : undefined} data-hata={hata ? 'telefon' : undefined} {...ek} />
      {hata ? <p id={hataId} className="uza-ipucu uza-girdi-hata" role="alert" data-hata="telefon">{hata}</p> : null}
    </>
  )
}

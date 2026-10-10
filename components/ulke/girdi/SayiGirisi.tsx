'use client'

/**
 * NOTYA-ULKE-DENETIM-01a — THE KIT'S ONE NUMBER FIELD. Every number a person types into a tool or into the intake
 * form is typed here and read by ONE parser with the pack's own number rules (lib/ulke/arayuz/sayi.ts).
 *
 * A NUMBER THAT CAN BE READ TWO WAYS IS REFUSED, NEVER GUESSED. Before this field the kit turned a typed comma into
 * a point: a day limit typed "1,500" in a country that groups thousands with a comma was worked with as 1.5. Now
 * such a text either IS the country's way of writing the number, or the field says — in the pack's own sentence,
 * with two examples written the pack's way — that it could not be read and asks for it to be typed again. While it
 * cannot be read, the screen gets no number at all.
 *
 * The message waits while the person is still typing something that can become a number ("1," on the way to "1,500").
 * The field stays a text field with the decimal keypad on a phone. No word is written in this file.
 */
import React, { useState, type ReactNode } from 'react'
import type { GirdiMetni } from '@/lib/ulke/arayuz'
import { sayiCozKuralla, sayiKurali, sayiOrnekleri, sayiYaziliyorMu, type SayiKurali } from '@/lib/ulke/arayuz/sayi'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'

export function SayiGirisi({ id, deger, degistir, m, kural, satirSonu, gecersiz, ek }: {
  id: string
  /** The text of the field, exactly as typed. */
  deger: string
  degistir: (metin: string) => void
  /** The pack's sentence for a number that cannot be read, in the form of the screen. */
  m: GirdiMetni
  /** The pack's own number rules unless a caller hands in the ones it already holds. */
  kural?: SayiKurali
  /** Drawn on the field's own line, after it: a unit. */
  satirSonu?: ReactNode
  /** true = the number is read but the screen refuses it for a reason of its own (out of range): marked, with the screen's own message. */
  gecersiz?: boolean
  /** Further attributes of the field itself (`maxLength`, `data-birim`, `aria-required` …). */
  ek?: Readonly<Record<string, string | number | boolean | undefined>>
}) {
  const k = kural ?? sayiKurali()
  const [odak, setOdak] = useState(false)
  const o = sayiCozKuralla(deger, k)
  const okunamadi = !o.tamam && o.neden === 'okunamadi'
  const hataGoster = okunamadi && (!odak || !sayiYaziliyorMu(deger, k))
  const hataId = `${id}-okunamadi`
  const [tamOrnek, ondalikOrnek] = sayiOrnekleri(k)
  const girdi = (
    <input {...ek} id={id} type="text" inputMode="decimal" autoComplete="off" className="uza-girdi" value={deger} data-okuma={okunamadi ? 'okunamadi' : o.tamam ? 'tamam' : 'bos'}
      onChange={(e) => degistir(e.target.value)} onFocus={() => setOdak(true)} onBlur={() => setOdak(false)}
      aria-invalid={hataGoster || gecersiz || undefined} aria-describedby={hataGoster ? hataId : undefined} />
  )
  return (
    <>
      {satirSonu ? <div className="uza-arama-satir">{girdi}{satirSonu}</div> : girdi}
      {hataGoster ? <p id={hataId} className="uza-ipucu uza-girdi-hata" role="alert" data-hata="sayi-okunamadi">{yerine(m.sayiOkunamadi, tamOrnek, ondalikOrnek)}</p> : null}
    </>
  )
}

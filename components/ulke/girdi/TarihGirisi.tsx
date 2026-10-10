'use client'

/**
 * NOTYA-ULKE-DENETIM-01b — THE KIT'S ONE DATE FIELD. Every day a person types in a country build is typed here.
 *
 * NEVER A BROWSER'S OWN DATE FIELD. `<input type="date">` is drawn in the order of the browser's language: the same
 * keystrokes gave 7 March in a British browser and 3 July in an American one, on screens that look identical. This
 * field is three small fields, each with its own label, IN THE ORDER OF THE PACK'S OWN DATE PATTERN
 * (`bicim.tarihDeseni`: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, DD.MM.YYYY …) with the pack's own mark between them.
 * Nothing about it comes from the browser.
 *
 *   labels        the pack's words for day, month and year (`girdi`), in the form the screen is written in
 *   a real day    31 February, a month 13, a two-digit year and a half-typed date are not a day; the pack's
 *                 sentence says so under the field, and the screen is handed GIRDI_GECERSIZ, never a guess
 *   what it hands over   '' (nothing typed), 'YYYY-MM-DD' (a day), or GIRDI_GECERSIZ: the same ISO value the
 *                 browser's field handed over before, so nothing that is stored or sent changes
 *   on a phone    the numeric keypad (`inputMode="numeric"`); a whole date pasted in the pack's pattern fills all three
 *   for a screen reader   a group named by its legend, each part named by its own label, the message tied to the parts
 *
 * No word is written in this file.
 */
import React, { useEffect, useRef, useState, type ClipboardEvent, type ReactNode } from 'react'
import type { GirdiMetni } from '@/lib/ulke/arayuz'
import { tarihDeseni } from '@/lib/ulke/arayuz/bicim'
import { GIRDI_GECERSIZ, girdiDegeri, gundenParcalar, PARCA_UZUNLUGU, tarihDuzeni, tarihOku, tarihParcasiYaz, type TarihParcalari, type TarihParcasi } from '@/lib/ulke/arayuz/zamanGirdisi'
import { gunCoz } from '@/lib/ulke/uygulama/zaman'

const PARCA_ADI: Readonly<Record<TarihParcasi, 'gun' | 'ay' | 'yil'>> = { DD: 'gun', MM: 'ay', YYYY: 'yil' }

export function TarihGirisi({ id, etiket, deger, degistir, m, zorunlu, ad, alan, hata, desen }: {
  /** The id of the group; its parts are `<id>-gun`, `<id>-ay`, `<id>-yil`. */
  id: string
  /** What the field is called: the group's legend. */
  etiket: ReactNode
  /** '' · 'YYYY-MM-DD' · GIRDI_GECERSIZ */
  deger: string
  degistir: (deger: string) => void
  /** The pack's words for the parts and for "not a day", in the form of the screen. */
  m: GirdiMetni
  zorunlu?: boolean
  /** A name for the value inside a form: a hidden field carries the day (or '' while there is none). */
  ad?: string
  /** `data-alan`, as the screens mark their fields. */
  alan?: string
  /** true = say "not a day" now, whatever the focus (the screen was asked to send and the day is missing or wrong). */
  hata?: boolean
  /** The pack's own pattern unless a test hands in another. */
  desen?: string
}) {
  const kalip = desen ?? tarihDeseni()
  const duzen = tarihDuzeni(kalip)
  const [p, setP] = useState<TarihParcalari>(() => gundenParcalar(deger))
  const [odak, setOdak] = useState(false)
  const son = useRef(deger)

  // The screen changed the day itself (a form reset, a day chosen with a button): show that day.
  useEffect(() => {
    if (deger === son.current) return
    son.current = deger
    setP(gundenParcalar(deger))
  }, [deger])
  // Drawn anew while the screen still holds "not a day" from an earlier drawing: the parts are empty, so say "nothing".
  useEffect(() => { if (deger === GIRDI_GECERSIZ && tarihOku(p).durum === 'bos') { son.current = ''; degistir('') } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const yerlestir = (yeni: TarihParcalari) => {
    setP(yeni)
    const d = girdiDegeri(tarihOku(yeni))
    son.current = d
    if (d !== deger) degistir(d)
  }
  /** A whole date pasted in the pack's own pattern (or as YYYY-MM-DD) fills the three parts. Anything else is pasted as usual. */
  const yapistir = (e: ClipboardEvent<HTMLInputElement>) => {
    const gun = gunCoz(e.clipboardData.getData('text'), kalip)
    if (!gun) return
    e.preventDefault()
    yerlestir(gundenParcalar(gun))
  }

  const o = tarihOku(p)
  const hataGoster = o.durum === 'gecersiz' || (o.durum === 'yarim' && !odak) || (Boolean(hata) && o.durum !== 'tamam')
  const hataId = `${id}-hata`
  return (
    <fieldset id={id} className="uza-parcali" data-girdi="tarih" data-alan={alan} data-desen={kalip} data-durum={o.durum} data-deger={o.deger || undefined}
      onFocus={() => setOdak(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOdak(false) }}>
      <legend className="uza-etiket">{etiket}</legend>
      <div className="uza-parcali-satir">
        {duzen.sira.map((k, i) => (
          <React.Fragment key={k}>
            {i > 0 ? <span className="uza-parca-ayrac" aria-hidden="true">{duzen.ayrac}</span> : null}
            <span className="uza-parca" data-parca={k}>
              <label className="uza-parca-ad" htmlFor={`${id}-${PARCA_ADI[k]}`}>{m[PARCA_ADI[k]]}</label>
              <input id={`${id}-${PARCA_ADI[k]}`} name={ad ? `${ad}-${PARCA_ADI[k]}` : undefined} className="uza-girdi" type="text" inputMode="numeric" autoComplete="off"
                maxLength={PARCA_UZUNLUGU[k]} value={p[k]} onChange={(e) => yerlestir({ ...p, [k]: tarihParcasiYaz(k, e.target.value) })} onPaste={yapistir}
                aria-required={zorunlu || undefined} aria-invalid={hataGoster || undefined} aria-describedby={hataGoster ? hataId : undefined} />
            </span>
          </React.Fragment>
        ))}
      </div>
      {ad ? <input type="hidden" name={ad} value={o.deger} /> : null}
      {hataGoster ? <p id={hataId} className="uza-ipucu uza-girdi-hata" role="alert" data-hata="tarih">{m.tarihGecersiz}</p> : null}
    </fieldset>
  )
}

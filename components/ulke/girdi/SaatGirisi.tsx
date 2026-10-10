'use client'

/**
 * NOTYA-ULKE-DENETIM-01b — THE KIT'S ONE TIME-OF-DAY FIELD. Every time of day a person types in a country build is
 * typed here.
 *
 * NEVER A BROWSER'S OWN TIME FIELD. `<input type="time">` shows a 12- or a 24-hour clock by the browser's and the
 * system's language, whatever the country. This field follows THE PACK'S CLOCK (`uygulama.saatBicimi`):
 *
 *   24   hour (00–23) and minute
 *   12   hour (1–12), minute, and AN EXPLICIT CHOICE of the half of the day, which starts unchosen: a time is not a
 *        time until the person has said which half. 12 before noon is midnight; 12 after noon is noon.
 *
 * The words for the two halves are the ones the screens write beside every time ("AM"/"PM", "a.m."/"p.m.",
 * "am"/"pm": the platform's data for the pack's own locale, lib/ulke/arayuz/bicim.ts). The labels of hour and minute
 * are the pack's (`girdi`). No word is written in this file.
 *
 * What it hands over: '' (nothing typed), 24-hour 'HH:MM' (a time), or GIRDI_GECERSIZ — the same value the browser's
 * field handed over before, so nothing that is stored or sent changes.
 */
import React, { useEffect, useRef, useState, type ReactNode } from 'react'
import type { GirdiMetni } from '@/lib/ulke/arayuz'
import { gunYarisiAdlari, saatBicimi } from '@/lib/ulke/arayuz/bicim'
import { GIRDI_GECERSIZ, girdiDegeri, saatOku, saatParcasiYaz, saattenParcalar, type GunYarisi, type SaatBicimi, type SaatParcalari } from '@/lib/ulke/arayuz/zamanGirdisi'

export function SaatGirisi({ id, etiket, deger, degistir, m, zorunlu, ad, alan, hata, bicim }: {
  /** The id of the group; its parts are `<id>-saat`, `<id>-dakika` and, on a 12-hour clock, `<id>-yari`. */
  id: string
  etiket: ReactNode
  /** '' · 'HH:MM' (24-hour) · GIRDI_GECERSIZ */
  deger: string
  degistir: (deger: string) => void
  m: GirdiMetni
  zorunlu?: boolean
  /** A name for the value inside a form: a hidden field carries the time (or '' while there is none). */
  ad?: string
  alan?: string
  /** true = say "not a time" now, whatever the focus. */
  hata?: boolean
  /** The pack's own clock unless a test hands in another. */
  bicim?: SaatBicimi
}) {
  const b = bicim ?? saatBicimi()
  const [p, setP] = useState<SaatParcalari>(() => saattenParcalar(deger, b))
  const [odak, setOdak] = useState(false)
  const son = useRef(deger)

  useEffect(() => {
    if (deger === son.current) return
    son.current = deger
    setP(saattenParcalar(deger, b))
  }, [deger, b])
  useEffect(() => { if (deger === GIRDI_GECERSIZ && saatOku(p, b).durum === 'bos') { son.current = ''; degistir('') } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const yerlestir = (yeni: SaatParcalari) => {
    setP(yeni)
    const d = girdiDegeri(saatOku(yeni, b))
    son.current = d
    if (d !== deger) degistir(d)
  }

  const o = saatOku(p, b)
  const hataGoster = o.durum === 'gecersiz' || (o.durum === 'yarim' && !odak) || (Boolean(hata) && o.durum !== 'tamam')
  const hataId = `${id}-hata`
  const yarilar = b === 12 ? gunYarisiAdlari() : null
  const ortak = { className: 'uza-girdi', 'aria-required': zorunlu || undefined, 'aria-invalid': hataGoster || undefined, 'aria-describedby': hataGoster ? hataId : undefined }
  const sayiAlani = (k: 'saat' | 'dakika') => (
    <span className="uza-parca" data-parca={k}>
      <label className="uza-parca-ad" htmlFor={`${id}-${k}`}>{m[k]}</label>
      <input id={`${id}-${k}`} name={ad ? `${ad}-${k}` : undefined} {...ortak} type="text" inputMode="numeric" autoComplete="off" maxLength={2}
        value={p[k]} onChange={(e) => yerlestir({ ...p, [k]: saatParcasiYaz(e.target.value) })} />
    </span>
  )
  return (
    <fieldset id={id} className="uza-parcali" data-girdi="saat" data-alan={alan} data-saat-bicimi={b} data-durum={o.durum} data-deger={o.deger || undefined}
      onFocus={() => setOdak(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOdak(false) }}>
      <legend className="uza-etiket">{etiket}</legend>
      <div className="uza-parcali-satir">
        {sayiAlani('saat')}
        <span className="uza-parca-ayrac" aria-hidden="true">:</span>
        {sayiAlani('dakika')}
        {yarilar ? (
          <span className="uza-parca" data-parca="yari">
            <label className="uza-parca-ad" htmlFor={`${id}-yari`}>{yarilar.oo} / {yarilar.os}</label>
            <select id={`${id}-yari`} name={ad ? `${ad}-yari` : undefined} {...ortak} value={p.yari} onChange={(e) => yerlestir({ ...p, yari: e.target.value as GunYarisi })}>
              <option value="">—</option>
              <option value="oo">{yarilar.oo}</option>
              <option value="os">{yarilar.os}</option>
            </select>
          </span>
        ) : null}
      </div>
      {ad ? <input type="hidden" name={ad} value={o.deger} /> : null}
      {hataGoster ? <p id={hataId} className="uza-ipucu uza-girdi-hata" role="alert" data-hata="saat">{m.saatGecersiz}</p> : null}
    </fieldset>
  )
}

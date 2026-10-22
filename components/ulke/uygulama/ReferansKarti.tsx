'use client'

/**
 * AU-BETA-01 — REFERENCE LOOKUPS AND LINKS (pack extension `uzanti.referansAramalari` / `referansBolumleri` / `kayitSistemi`).
 *
 * LINK-OUT ONLY. Nothing here stores, copies or computes a drug, a dose, a schedule or a threshold. A lookup builds an
 * address on the official site's own search from the term typed; the term leaves the browser only when the doctor
 * presses the button, in a new tab. The record-system card is a labelled STUB: no connection, no network call.
 * Initial clinical draft – external clinician review later.
 */
import React, { useState } from 'react'
import { ulkePaketi } from '@/lib/ulke/ulke'

export function referansAdresi(sablon: string, terim: string): string | null {
  const t = terim.trim().slice(0, 100)
  if (!t || !sablon.includes('{q}')) return null
  return sablon.replace('{q}', encodeURIComponent(t))
}

export function ReferansAramalari() {
  const a = ulkePaketi().uzanti?.referansAramalari
  const [q, setQ] = useState<Record<string, string>>({})
  if (!a?.length) return null
  return (
    <section className="uza-kart" data-alan="referans-aramalari">
      {a.map((x) => {
        const adres = referansAdresi(x.adresSablonu, q[x.anahtar] ?? '')
        return (
          <form key={x.anahtar} className="uza-form" data-referans={x.anahtar} onSubmit={(e) => { e.preventDefault(); if (adres) window.open(adres, '_blank', 'noopener,noreferrer') }}>
            <label className="uza-etiket" htmlFor={`ref-${x.anahtar}`}>{x.etiket}</label>
            <input id={`ref-${x.anahtar}`} className="uza-girdi" value={q[x.anahtar] ?? ''} maxLength={100} placeholder={x.yerTutucu} autoComplete="off" onChange={(e) => setQ({ ...q, [x.anahtar]: e.target.value })} />
            <div className="uza-eylemler" style={{ marginTop: 0 }}><button type="submit" className="uza-dugme uza-dugme-cizgi" disabled={!adres} data-eylem="referans-ac">{x.dugme}</button></div>
            <p className="uza-ipucu">{x.not}</p>
            <p className="uza-ipucu" data-alan="kaynak-satiri">Source: {x.kaynak}</p>
          </form>
        )
      })}
    </section>
  )
}

export function ReferansBolumleri() {
  const b = ulkePaketi().uzanti?.referansBolumleri
  if (!b?.length) return null
  return (
    <>
      {b.map((s) => (
        <section key={s.baslik} className="uza-kart" data-alan="referans-bolumu">
          <h2 className="uza-h2">{s.baslik}</h2>
          <p className="uza-aciklama">{s.aciklama}</p>
          <p className="uza-ipucu" data-alan="taslak-etiketi">{s.taslakEtiketi}</p>
          <ul className="uza-liste">
            {s.baglantilar.map((l) => (
              <li key={l.adres}><div className="uza-satir"><span className="uza-liste-ad"><a href={l.adres} target="_blank" rel="noopener noreferrer">{l.etiket}</a><span className="uza-liste-alt">{l.aciklama}</span><span className="uza-liste-alt" data-alan="kaynak-satiri">Source: {l.kaynak}</span></span></div></li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

export function KayitSistemiKarti() {
  const k = ulkePaketi().uzanti?.kayitSistemi
  if (!k) return null
  return (
    <section className="uza-kart" data-alan="kayit-sistemi" data-bagli="hayir">
      <h2 className="uza-h2">{k.baslik}</h2>
      <p className="uza-aciklama">{k.aciklama}</p>
      <div role="status" className="uza-bilgi-kutu" data-alan="baglanmadi">{k.baglanmadi}</div>
      <p className="uza-ipucu" data-alan="kaynak-satiri">Source: {k.kaynak}</p>
    </section>
  )
}

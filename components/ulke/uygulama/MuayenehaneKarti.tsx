'use client'

/**
 * AU-BETA-01 — the practice particulars form (pack extension `uzanti.muayenehane`): fields, formats and sentences are the
 * pack's. Every field optional; an invalid one shows its sentence beside it and nothing else happens.
 */
import { AyarSatiri } from './AyarSatiri'
import React, { useEffect, useState } from 'react'
import { Bilgi, Hata, type Uygulama } from './Kabuk'
import { ulkePaketi } from '@/lib/ulke/ulke'

export function MuayenehaneKarti({ u }: { u: Uygulama }) {
  const t = ulkePaketi().uzanti?.muayenehane
  const [d, setD] = useState<Record<string, string>>({})
  const [hatalar, setHatalar] = useState<Record<string, string>>({})
  const [uyarilar, setUyarilar] = useState<Record<string, string>>({})
  const [sonuc, setSonuc] = useState<'tamam' | 'hata' | null>(null)
  const [bekliyor, setBekliyor] = useState(false)
  const { api, hesap } = u
  useEffect(() => { if (t && hesap) api('/api/ulke/muayenehane').then((r) => { if (r.ok && r.j.degerler) setD(r.j.degerler as Record<string, string>) }).catch(() => { /* the form stays empty */ }) }, [t, hesap, api])
  if (!t) return null
  async function gonder() {
    setBekliyor(true); setSonuc(null); setHatalar({}); setUyarilar({})
    try {
      const r = await api('/api/ulke/muayenehane', { method: 'POST', govde: d })
      if (r.ok) { setSonuc('tamam'); setUyarilar((r.j.uyarilar as Record<string, string>) ?? {}); setD((r.j.degerler as Record<string, string>) ?? {}) }
      else if (r.j.hatalar) setHatalar(r.j.hatalar as Record<string, string>)
      else setSonuc('hata')
    } catch { setSonuc('hata') }
    setBekliyor(false)
  }
  return (
    <AyarSatiri emoji={'\u{1F3E2}'} ad={t.baslik} alan="muayenehane">
        <form className="uza-form" onSubmit={(e) => { e.preventDefault(); void gonder() }} noValidate>
          <p className="uza-ipucu">{t.aciklama}</p>
          {t.alanlar.map((a) => (
            <div className="uza-alan" key={a.anahtar}>
              <label className="uza-etiket" htmlFor={`mh-${a.anahtar}`}>{a.etiket}</label>
              {a.secenekler ? (
                <select id={`mh-${a.anahtar}`} className="uza-girdi" value={d[a.anahtar] ?? ''} onChange={(e) => setD({ ...d, [a.anahtar]: e.target.value })}>
                  <option value="" />{a.secenekler.map((s) => <option key={s.deger} value={s.deger}>{s.etiket}</option>)}
                </select>
              ) : <input id={`mh-${a.anahtar}`} className="uza-girdi" value={d[a.anahtar] ?? ''} maxLength={a.azami} autoComplete="off" onChange={(e) => setD({ ...d, [a.anahtar]: e.target.value })} data-alan={`mh-${a.anahtar}`} aria-invalid={hatalar[a.anahtar] ? true : undefined} />}
              {a.ipucu ? <p className="uza-ipucu">{a.ipucu}</p> : null}
              {hatalar[a.anahtar] ? <div role="alert" className="uza-uyari-kutu" data-hata={a.anahtar}>{hatalar[a.anahtar]}</div> : null}
              {uyarilar[a.anahtar] ? <p className="uza-ipucu" data-uyari={a.anahtar}>{uyarilar[a.anahtar]}</p> : null}
            </div>
          ))}
          <Hata>{sonuc === 'hata' ? t.kaydedilemedi : null}</Hata>
          <Bilgi>{sonuc === 'tamam' ? t.kaydedildi : null}</Bilgi>
          <button type="submit" className="uza-dugme" disabled={bekliyor} data-eylem="muayenehane-kaydet">{bekliyor ? t.kaydediliyor : t.kaydet}</button>
        </form>
    </AyarSatiri>
  )
}

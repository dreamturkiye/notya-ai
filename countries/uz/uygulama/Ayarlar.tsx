'use client'

/**
 * NOTYA-UZ-MUAYENE-01 — /settings: interface language, note language, script. Three small questions; the script
 * applies wherever Uzbek is chosen (interface, notes, or both). Saved together; the page then re-reads itself in
 * the new interface language.
 */
import React, { useEffect, useState } from 'react'
import { Bilgi, Cerceve, Hata, useUygulama, Yukleniyor, type Hesap } from './Kabuk'
import { DilSecimi, YaziSecimi } from './DilFormu'
import { dilBirlestir, temelDil, yaziSec, type TemelDil, type UygulamaMetni, type UzUygulamaDili, type Yazi } from './metinler'

export type AyarDurumu = { arayuz: TemelDil; not: TemelDil; yazi: Yazi }

/** The script of the account: the Uzbek one in use, interface first. */
export function ayarDurumu(h: Pick<Hesap, 'dil' | 'notDili'>): AyarDurumu {
  const uzbekce = [h.dil, h.notDili].find((d) => d !== 'ru')
  return { arayuz: temelDil(h.dil), not: temelDil(h.notDili), yazi: uzbekce ? yaziSec(uzbekce) : 'Latn' }
}

export function AyarlarGorunumu({ m, d, set, gonder, bekliyor, sonuc }: {
  m: UygulamaMetni; d: AyarDurumu; set: (d: AyarDurumu) => void; gonder: () => void; bekliyor: boolean; sonuc: 'tamam' | 'hata' | null
}) {
  return (
    <section className="uza-kart uza-dar">
      <h1 className="uza-h1">{m.ayarlar.baslik}</h1>
      <form className="uza-form" onSubmit={(e) => { e.preventDefault(); gonder() }}>
        <DilSecimi etiket={m.ayarlar.arayuzDili} ad="arayuz" deger={d.arayuz} yazi={d.yazi} sec={(arayuz) => set({ ...d, arayuz })} />
        <DilSecimi etiket={m.ayarlar.notDili} ad="not" deger={d.not} yazi={d.yazi} sec={(not) => set({ ...d, not })} />
        {d.arayuz === 'uz' || d.not === 'uz' ? (
          <div>
            <YaziSecimi m={m} etiket={m.ayarlar.yazi} deger={d.yazi} sec={(yazi) => set({ ...d, yazi })} />
            <p className="uza-ipucu">{m.ayarlar.yaziIzoh}</p>
          </div>
        ) : null}
        <Hata>{sonuc === 'hata' ? m.ayarlar.kaydedilemedi : null}</Hata>
        <Bilgi>{sonuc === 'tamam' ? m.ayarlar.kaydedildi : null}</Bilgi>
        <button type="submit" className="uza-dugme" disabled={bekliyor}>{bekliyor ? m.ayarlar.kaydediliyor : m.ayarlar.kaydet}</button>
      </form>
    </section>
  )
}

export default function Ayarlar() {
  const u = useUygulama('ayarlar')
  const [d, setD] = useState<AyarDurumu>({ arayuz: 'uz', not: 'uz', yazi: 'Latn' })
  const [hazir, setHazir] = useState(false)
  const [bekliyor, setBekliyor] = useState(false)
  const [sonuc, setSonuc] = useState<'tamam' | 'hata' | null>(null)

  useEffect(() => { if (u.hesap && !hazir) { setD(ayarDurumu(u.hesap)); setHazir(true) } }, [u.hesap, hazir])

  if (!u.hesap) return <Yukleniyor m={u.m} dil={u.dil} />

  async function gonder() {
    const arayuzDili: UzUygulamaDili = dilBirlestir(d.arayuz, d.yazi)
    const notDili: UzUygulamaDili = dilBirlestir(d.not, d.yazi)
    setBekliyor(true); setSonuc(null)
    try {
      const r = await u.api('/api/ulke/tercihler', { method: 'POST', govde: { arayuzDili, notDili } })
      if (r.ok) { u.hesabiGuncelle({ dil: arayuzDili, notDili }); setSonuc('tamam') } else setSonuc('hata')
    } catch { setSonuc('hata') }
    setBekliyor(false)
  }

  return (
    <Cerceve dil={u.dil} m={u.m} ad={u.hesap.ad} aktif="ayarlar" cikis={u.cikis}>
      <AyarlarGorunumu m={u.m} d={d} set={(yeni) => { setD(yeni); setSonuc(null) }} gonder={gonder} bekliyor={bekliyor} sonuc={sonuc} />
    </Cerceve>
  )
}

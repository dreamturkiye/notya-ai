'use client'

/**
 * NOTYA-UZ-MUAYENE-01 — /settings: interface language, note language, script. Three small questions; the script
 * applies wherever Uzbek is chosen (interface, notes, or both). Saved together; the page then re-reads itself in
 * the new interface language.
 *
 * NOTYA-UZ-BRANSLAR-01 — and, in a card of its own, the role the account works as (./RolFormu.tsx). Saved on its
 * own: changing it changes the assistant shown and the structure of the NEXT visit notes; notes already written
 * keep the structure they were written with.
 */
import React, { useEffect, useState } from 'react'
import { Bilgi, Cerceve, Hata, useUygulama, Yukleniyor, type Hesap } from './Kabuk'
import { DilSecimi, YaziSecimi } from './DilFormu'
import { RolSecimi } from './RolFormu'
import { asistanAdi } from './Asistan'
import { uzRolMu } from '../klinik/rolAdlari'
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

export function RolAyariGorunumu({ m, rol, kayitliRol, setRol, gonder, bekliyor, sonuc }: {
  m: UygulamaMetni; rol: string; /** The role as saved: its assistant is the one named. */ kayitliRol: string | null
  setRol: (r: string) => void; gonder: () => void; bekliyor: boolean; sonuc: 'tamam' | 'hata' | 'gerekli' | null
}) {
  return (
    <section className="uza-kart uza-dar" data-alan="rol-ayari">
      <h2 className="uza-h2">{m.rol.ayarBaslik}</h2>
      <form className="uza-form" onSubmit={(e) => { e.preventDefault(); gonder() }}>
        <RolSecimi m={m} deger={rol} sec={setRol} kimlik="uza-rol-ayar" />
        <p className="uza-ipucu">{m.asistan.etiket}: <span data-alan="asistan-ad">{asistanAdi(m, kayitliRol)}</span></p>
        <p className="uza-ipucu">{m.rol.ayarIzoh}</p>
        <Hata>{sonuc === 'hata' ? m.rol.kaydedilemedi : sonuc === 'gerekli' ? m.rol.gerekli : null}</Hata>
        <Bilgi>{sonuc === 'tamam' ? m.rol.kaydedildi : null}</Bilgi>
        <button type="submit" className="uza-dugme" disabled={bekliyor} data-eylem="rol-kaydet">{bekliyor ? m.rol.kaydediliyor : m.rol.kaydet}</button>
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

  const [rol, setRol] = useState('')
  const [rolBekliyor, setRolBekliyor] = useState(false)
  const [rolSonucu, setRolSonucu] = useState<'tamam' | 'hata' | 'gerekli' | null>(null)

  useEffect(() => { if (u.hesap && !hazir) { setD(ayarDurumu(u.hesap)); setRol(u.hesap.rol ?? ''); setHazir(true) } }, [u.hesap, hazir])

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

  async function rolGonder() {
    if (!uzRolMu(rol)) { setRolSonucu('gerekli'); return }
    setRolBekliyor(true); setRolSonucu(null)
    try {
      const r = await u.api('/api/ulke/rol', { method: 'POST', govde: { rol } })
      if (r.ok) { u.hesabiGuncelle({ rol }); setRolSonucu('tamam') } else setRolSonucu('hata')
    } catch { setRolSonucu('hata') }
    setRolBekliyor(false)
  }

  return (
    <Cerceve dil={u.dil} m={u.m} ad={u.hesap.ad} aktif="ayarlar" cikis={u.cikis}>
      <AyarlarGorunumu m={u.m} d={d} set={(yeni) => { setD(yeni); setSonuc(null) }} gonder={gonder} bekliyor={bekliyor} sonuc={sonuc} />
      <RolAyariGorunumu m={u.m} rol={rol} kayitliRol={u.hesap.rol} setRol={(r) => { setRol(r); setRolSonucu(null) }} gonder={rolGonder} bekliyor={rolBekliyor} sonuc={rolSonucu} />
    </Cerceve>
  )
}

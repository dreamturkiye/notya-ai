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
import { dilBirlestir, dilSecimiVarMi, rolMu, roller, temelDil, varsayilanYazi, yaziSec, yaziSorulurMu, type UygulamaMetni } from '@/lib/ulke/arayuz'
import { hesapSaatDilimiAyarla } from '@/lib/ulke/arayuz/bicim'
import { ulkePaketi } from '@/lib/ulke/ulke'
import type { DilKodu } from '@/lib/ulke/tipler'

export type AyarDurumu = { arayuz: string; not: string; yazi: string | null }

/** The script of the account: that of the form in use whose language has several scripts, interface first. */
export function ayarDurumu(h: Pick<Hesap, 'dil' | 'notDili'>): AyarDurumu {
  const cokYazili = [h.dil, h.notDili].find((d) => yaziSorulurMu(temelDil(d)))
  return { arayuz: temelDil(h.dil), not: temelDil(h.notDili), yazi: cokYazili ? yaziSec(cokYazili) : varsayilanYazi() }
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
        {yaziSorulurMu(d.arayuz) || yaziSorulurMu(d.not) ? (
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

/**
 * NOTYA-ULKE-SABLON-01 — the account's TIME ZONE, for a country that has more than one. Not drawn at all where the
 * pack lists one zone. A zone is shown by its international name (a place, not a sentence: there is nothing to translate).
 */
export function SaatDilimiGorunumu({ m, dilim, dilimler, sec, gonder, bekliyor, sonuc }: {
  m: UygulamaMetni; dilim: string; dilimler: readonly string[]; sec: (d: string) => void; gonder: () => void; bekliyor: boolean; sonuc: 'tamam' | 'hata' | null
}) {
  return (
    <section className="uza-kart uza-dar" data-alan="saat-dilimi">
      <form className="uza-form" onSubmit={(e) => { e.preventDefault(); gonder() }}>
        <div className="uza-alan">
          <label className="uza-etiket" htmlFor="uza-saat-dilimi">{m.ayarlar.saatDilimi}</label>
          <select id="uza-saat-dilimi" name="saatDilimi" className="uza-girdi" value={dilim} onChange={(e) => sec(e.target.value)}>
            {dilimler.map((d) => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        {m.ayarlar.saatDilimiIzoh ? <p className="uza-ipucu">{m.ayarlar.saatDilimiIzoh}</p> : null}
        <Hata>{sonuc === 'hata' ? m.ayarlar.kaydedilemedi : null}</Hata>
        <Bilgi>{sonuc === 'tamam' ? m.ayarlar.kaydedildi : null}</Bilgi>
        <button type="submit" className="uza-dugme" disabled={bekliyor} data-eylem="saat-dilimi-kaydet">{bekliyor ? m.ayarlar.kaydediliyor : m.ayarlar.kaydet}</button>
      </form>
    </section>
  )
}

export default function Ayarlar() {
  const u = useUygulama('ayarlar')
  const [d, setD] = useState<AyarDurumu>(() => { const t = temelDil(ulkePaketi().varsayilanDil); return { arayuz: t, not: t, yazi: varsayilanYazi() } })
  const [hazir, setHazir] = useState(false)
  const [bekliyor, setBekliyor] = useState(false)
  const [sonuc, setSonuc] = useState<'tamam' | 'hata' | null>(null)

  const [dilim, setDilim] = useState('')
  const [dilimBekliyor, setDilimBekliyor] = useState(false)
  const [dilimSonucu, setDilimSonucu] = useState<'tamam' | 'hata' | null>(null)

  const [rol, setRol] = useState('')
  const [rolBekliyor, setRolBekliyor] = useState(false)
  const [rolSonucu, setRolSonucu] = useState<'tamam' | 'hata' | 'gerekli' | null>(null)

  useEffect(() => { if (u.hesap && !hazir) { setD(ayarDurumu(u.hesap)); setRol(u.hesap.rol ?? ''); setDilim(u.hesap.saatDilimi ?? ''); setHazir(true) } }, [u.hesap, hazir])

  if (!u.hesap) return <Yukleniyor m={u.m} dil={u.dil} />

  async function gonder() {
    const arayuzDili: DilKodu = dilBirlestir(d.arayuz, d.yazi)
    const notDili: DilKodu = dilBirlestir(d.not, d.yazi)
    setBekliyor(true); setSonuc(null)
    try {
      const r = await u.api('/api/ulke/tercihler', { method: 'POST', govde: { arayuzDili, notDili } })
      if (r.ok) { u.hesabiGuncelle({ dil: arayuzDili, notDili }); setSonuc('tamam') } else setSonuc('hata')
    } catch { setSonuc('hata') }
    setBekliyor(false)
  }

  async function dilimGonder() {
    if (!u.hesap) return
    setDilimBekliyor(true); setDilimSonucu(null)
    try {
      // The languages are sent as they stand: this request changes the time zone only.
      const r = await u.api('/api/ulke/tercihler', { method: 'POST', govde: { arayuzDili: u.hesap.dil, notDili: u.hesap.notDili, saatDilimi: dilim } })
      if (r.ok) { u.hesabiGuncelle({ saatDilimi: dilim }); hesapSaatDilimiAyarla(dilim); setDilimSonucu('tamam') } else setDilimSonucu('hata')
    } catch { setDilimSonucu('hata') }
    setDilimBekliyor(false)
  }

  async function rolGonder() {
    if (!rolMu(rol)) { setRolSonucu('gerekli'); return }
    setRolBekliyor(true); setRolSonucu(null)
    try {
      const r = await u.api('/api/ulke/rol', { method: 'POST', govde: { rol } })
      if (r.ok) { u.hesabiGuncelle({ rol }); setRolSonucu('tamam') } else setRolSonucu('hata')
    } catch { setRolSonucu('hata') }
    setRolBekliyor(false)
  }

  return (
    <Cerceve dil={u.dil} m={u.m} ad={u.hesap.ad} aktif="ayarlar" cikis={u.cikis}>
      {dilSecimiVarMi() ? <AyarlarGorunumu m={u.m} d={d} set={(yeni) => { setD(yeni); setSonuc(null) }} gonder={gonder} bekliyor={bekliyor} sonuc={sonuc} /> : null}
      {u.hesap.saatDilimleri && u.hesap.saatDilimleri.length > 1 ? <SaatDilimiGorunumu m={u.m} dilim={dilim} dilimler={u.hesap.saatDilimleri} sec={(z) => { setDilim(z); setDilimSonucu(null) }} gonder={dilimGonder} bekliyor={dilimBekliyor} sonuc={dilimSonucu} /> : null}
      {roller().length ? <RolAyariGorunumu m={u.m} rol={rol} kayitliRol={u.hesap.rol} setRol={(r) => { setRol(r); setRolSonucu(null) }} gonder={rolGonder} bekliyor={rolBekliyor} sonuc={rolSonucu} /> : null}
    </Cerceve>
  )
}

'use client'

/**
 * NOTYA-UZ-MUAYENE-01 — /start: what an account is asked at first login. "Uzbek or Russian?" and, for Uzbek,
 * "Latin or Cyrillic?". The answer becomes the interface language AND the default language of visit notes; both
 * stay changeable in /settings. The screen re-reads itself in the chosen form as soon as it is chosen.
 *
 * NOTYA-UZ-BRANSLAR-01 — then, in the chosen language: "what are you?" — a doctor specialty, a clinic doctor role
 * or a clinic allied profession (./RolFormu.tsx). The answer decides the assistant the account sees and the
 * structure of its visit notes; it stays changeable in /settings. An account that answered the language question
 * before roles existed is asked only this second question.
 */
import React, { useEffect, useRef, useState } from 'react'
import { Cerceve, Hata, useUygulama, YOL, Yukleniyor } from './Kabuk'
import { DilSecimi, YaziSecimi } from './DilFormu'
import { RolGorunumu } from './RolFormu'
import { dilBirlestir, dilSecimiVarMi, roller, rolMu, temelDil, uygulamaMetni, varsayilanYazi, yaziSec, yaziSorulurMu } from '@/lib/ulke/arayuz'
import { ulkePaketi } from '@/lib/ulke/ulke'
import type { DilKodu } from '@/lib/ulke/tipler'

export function BaslangicGorunumu({ temel, yazi, setTemel, setYazi, gonder, bekliyor, hata }: {
  temel: string; yazi: string | null; setTemel: (t: string) => void; setYazi: (y: string) => void
  gonder: () => void; bekliyor: boolean; hata: boolean
}) {
  const dil: DilKodu = dilBirlestir(temel, yazi)
  const m = uygulamaMetni(dil)
  return (
    <Cerceve dil={dil} m={m} sade>
      <section className="uza-kart uza-dar">
        <h1 className="uza-h1">{m.baslangic.baslik}</h1>
        <p className="uza-aciklama">{m.baslangic.aciklama}</p>
        <form className="uza-form" onSubmit={(e) => { e.preventDefault(); gonder() }}>
          <DilSecimi etiket={m.baslangic.dil} ad="dil" deger={temel} yazi={yazi} sec={setTemel} />
          {yaziSorulurMu(temel) ? <YaziSecimi m={m} deger={yazi} sec={setYazi} /> : null}
          <Hata>{hata ? m.baslangic.kaydedilemedi : null}</Hata>
          <button type="submit" className="uza-dugme" disabled={bekliyor}>{bekliyor ? m.baslangic.kaydediliyor : m.baslangic.devam}</button>
        </form>
      </section>
    </Cerceve>
  )
}

export default function Baslangic() {
  const u = useUygulama('baslangic')
  // Until the account is known: the pack's default language, and the first script of the language that has several.
  const [temel, setTemel] = useState<string>(() => temelDil(ulkePaketi().varsayilanDil))
  const [yazi, setYazi] = useState<string | null>(() => varsayilanYazi())
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState(false)

  /** null until the language has been saved on this screen: then the step follows what the account has answered. */
  const [adim, setAdim] = useState<'rol' | null>(null)
  const [rol, setRol] = useState('')
  const [rolHatasi, setRolHatasi] = useState<'gerekli' | 'kaydedilemedi' | null>(null)
  const [hazir, setHazir] = useState(false)
  const otomatik = useRef(false)

  // Start from the language chosen at sign-up.
  useEffect(() => {
    if (!u.hesap || hazir) return
    setTemel(temelDil(u.hesap.dil)); setYazi(yaziSec(u.hesap.dil) ?? varsayilanYazi())
    setHazir(true)
  }, [u.hesap, hazir])

  async function gonder() {
    const dil = dilBirlestir(temel, yazi)
    setBekliyor(true); setHata(false)
    try {
      const r = await u.api('/api/ulke/tercihler', { method: 'POST', govde: { arayuzDili: dil, notDili: dil } })
      if (r.ok) {
        // A country without roles has no second question: straight to the home.
        if (roller().length === 0) { window.location.assign(YOL.bugun); return }
        // Saved: the next question is asked in the language just chosen.
        u.hesabiGuncelle({ dil, notDili: dil, dilSoruldu: true }); setAdim('rol')
      } else setHata(true)
    } catch { setHata(true) }
    setBekliyor(false)
  }

  // A country with ONE language in ONE script has nothing to ask: its only form is recorded once, without a screen,
  // and the next step follows. (Uzbekistan has three forms and is asked as before.)
  const tekBicim = !dilSecimiVarMi()
  useEffect(() => {
    if (!tekBicim || !u.hesap || !hazir || u.hesap.dilSoruldu || otomatik.current) return
    otomatik.current = true
    void gonder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tekBicim, u.hesap, hazir])

  if (!u.hesap || (tekBicim && !u.hesap.dilSoruldu && !hata)) return <Yukleniyor m={u.m} dil={u.dil} />

  async function rolGonder() {
    if (!rolMu(rol)) { setRolHatasi('gerekli'); return }
    setBekliyor(true); setRolHatasi(null)
    try {
      const r = await u.api('/api/ulke/rol', { method: 'POST', govde: { rol } })
      if (r.ok) { window.location.assign(YOL.bugun); return }
      setRolHatasi('kaydedilemedi')
    } catch { setRolHatasi('kaydedilemedi') }
    setBekliyor(false)
  }

  // An account that has answered the language question (before roles existed, or a moment ago) is asked only the role.
  if (adim === 'rol' || u.hesap.dilSoruldu) return <RolGorunumu dil={u.dil} m={u.m} rol={rol} setRol={(r) => { setRol(r); setRolHatasi(null) }} gonder={rolGonder} bekliyor={bekliyor} hata={rolHatasi} />

  return <BaslangicGorunumu temel={temel} yazi={yazi} setTemel={setTemel} setYazi={setYazi} gonder={gonder} bekliyor={bekliyor} hata={hata} />
}

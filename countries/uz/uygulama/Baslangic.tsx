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
import React, { useEffect, useState } from 'react'
import { Cerceve, Hata, useUygulama, YOL, Yukleniyor } from './Kabuk'
import { DilSecimi, YaziSecimi } from './DilFormu'
import { RolGorunumu } from './RolFormu'
import { uzRolMu } from '../klinik/rolAdlari'
import { dilBirlestir, temelDil, uygulamaMetni, yaziSec, type TemelDil, type UzUygulamaDili, type Yazi } from './metinler'

export function BaslangicGorunumu({ temel, yazi, setTemel, setYazi, gonder, bekliyor, hata }: {
  temel: TemelDil; yazi: Yazi; setTemel: (t: TemelDil) => void; setYazi: (y: Yazi) => void
  gonder: () => void; bekliyor: boolean; hata: boolean
}) {
  const dil: UzUygulamaDili = dilBirlestir(temel, yazi)
  const m = uygulamaMetni(dil)
  return (
    <Cerceve dil={dil} m={m} sade>
      <section className="uza-kart uza-dar">
        <h1 className="uza-h1">{m.baslangic.baslik}</h1>
        <p className="uza-aciklama">{m.baslangic.aciklama}</p>
        <form className="uza-form" onSubmit={(e) => { e.preventDefault(); gonder() }}>
          <DilSecimi etiket={m.baslangic.dil} ad="dil" deger={temel} yazi={yazi} sec={setTemel} />
          {temel === 'uz' ? <YaziSecimi m={m} deger={yazi} sec={setYazi} /> : null}
          <Hata>{hata ? m.baslangic.kaydedilemedi : null}</Hata>
          <button type="submit" className="uza-dugme" disabled={bekliyor}>{bekliyor ? m.baslangic.kaydediliyor : m.baslangic.devam}</button>
        </form>
      </section>
    </Cerceve>
  )
}

export default function Baslangic() {
  const u = useUygulama('baslangic')
  const [temel, setTemel] = useState<TemelDil>('uz')
  const [yazi, setYazi] = useState<Yazi>('Latn')
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState(false)

  const [adim, setAdim] = useState<'dil' | 'rol'>('dil')
  const [rol, setRol] = useState('')
  const [rolHatasi, setRolHatasi] = useState<'gerekli' | 'kaydedilemedi' | null>(null)
  const [hazir, setHazir] = useState(false)

  // Start from the language chosen at sign-up; an account that has answered the language question goes straight to the role.
  useEffect(() => {
    if (!u.hesap || hazir) return
    setTemel(temelDil(u.hesap.dil)); setYazi(yaziSec(u.hesap.dil))
    if (u.hesap.dilSoruldu) setAdim('rol')
    if (u.hesap.rol) setRol(u.hesap.rol)
    setHazir(true)
  }, [u.hesap, hazir])

  if (!u.hesap) return <Yukleniyor m={u.m} dil={u.dil} />

  async function gonder() {
    const dil = dilBirlestir(temel, yazi)
    setBekliyor(true); setHata(false)
    try {
      const r = await u.api('/api/ulke/tercihler', { method: 'POST', govde: { arayuzDili: dil, notDili: dil } })
      // Saved: the next question is asked in the language just chosen.
      if (r.ok) { u.hesabiGuncelle({ dil, notDili: dil, dilSoruldu: true }); setAdim('rol') } else setHata(true)
    } catch { setHata(true) }
    setBekliyor(false)
  }

  async function rolGonder() {
    if (!uzRolMu(rol)) { setRolHatasi('gerekli'); return }
    setBekliyor(true); setRolHatasi(null)
    try {
      const r = await u.api('/api/ulke/rol', { method: 'POST', govde: { rol } })
      if (r.ok) { window.location.assign(YOL.bugun); return }
      setRolHatasi('kaydedilemedi')
    } catch { setRolHatasi('kaydedilemedi') }
    setBekliyor(false)
  }

  if (adim === 'rol') return <RolGorunumu dil={u.dil} m={u.m} rol={rol} setRol={(r) => { setRol(r); setRolHatasi(null) }} gonder={rolGonder} bekliyor={bekliyor} hata={rolHatasi} />

  return <BaslangicGorunumu temel={temel} yazi={yazi} setTemel={setTemel} setYazi={setYazi} gonder={gonder} bekliyor={bekliyor} hata={hata} />
}

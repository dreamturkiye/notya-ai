/**
 * NOTYA-UZ-BRANSLAR-01 — "what are you?": the role an account works as. One list of 40, in three groups: a doctor
 * specialty (30), a clinic doctor (5), a clinic allied profession (5). Asked at first login after the language
 * question (./Baslangic.tsx) and changeable in settings (./Ayarlar.tsx). Pure: state lives in the caller.
 *
 * What is shown is the role's NAME in the account's form (../klinik/rolAdlari.ts). The option's value is the
 * internal key; it is never shown.
 */
import React from 'react'
import { Cerceve, Hata } from './Kabuk'
import { metninDili, rolAdi, rolGruplari, type RolTarafi, type UygulamaMetni } from '@/lib/ulke/arayuz'
import type { DilKodu } from '@/lib/ulke/tipler'

const grupAdi = (m: UygulamaMetni, taraf: RolTarafi): string => (taraf === 'doktor' ? m.rol.grupDoktor : taraf === 'klinik-hekim' ? m.rol.grupKlinikHekim : m.rol.grupKlinikMuttefik)

export function RolSecimi({ m, deger, sec, kimlik = 'uza-rol' }: { m: UygulamaMetni; deger: string; sec: (rol: string) => void; kimlik?: string }) {
  const dil = metninDili(m)
  return (
    <div className="uza-alan">
      <label className="uza-etiket" htmlFor={kimlik}>{m.rol.etiket}</label>
      <select id={kimlik} name="rol" className="uza-girdi" value={deger} onChange={(e) => sec(e.target.value)} required>
        <option value="" disabled>{m.rol.sec}</option>
        {rolGruplari().map((g) => (
          <optgroup key={g.taraf} label={grupAdi(m, g.taraf)}>
            {g.roller.map((rol) => <option key={rol.anahtar} value={rol.anahtar}>{rolAdi(rol.anahtar, dil) ?? ''}</option>)}
          </optgroup>
        ))}
      </select>
    </div>
  )
}

/** The first-login step that follows the language question. */
export function RolGorunumu({ dil, m, rol, setRol, gonder, bekliyor, hata }: {
  dil: DilKodu; m: UygulamaMetni; rol: string; setRol: (r: string) => void; gonder: () => void; bekliyor: boolean; hata: 'gerekli' | 'kaydedilemedi' | null
}) {
  return (
    <Cerceve dil={dil} m={m} sade>
      <section className="uza-kart uza-dar" data-alan="rol-sorusu">
        <h1 className="uza-h1">{m.rol.baslik}</h1>
        <p className="uza-aciklama">{m.rol.aciklama}</p>
        <form className="uza-form" onSubmit={(e) => { e.preventDefault(); gonder() }}>
          <RolSecimi m={m} deger={rol} sec={setRol} />
          <Hata>{hata === 'gerekli' ? m.rol.gerekli : hata === 'kaydedilemedi' ? m.rol.kaydedilemedi : null}</Hata>
          <button type="submit" className="uza-dugme" disabled={bekliyor} data-eylem="rol-kaydet">{bekliyor ? m.rol.kaydediliyor : m.rol.devam}</button>
        </form>
      </section>
    </Cerceve>
  )
}

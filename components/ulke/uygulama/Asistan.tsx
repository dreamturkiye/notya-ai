/**
 * NOTYA-UZ-BRANSLAR-01 — the assistant as an account sees it: the name for the account's ROLE, from the owner's
 * list (../klinik/asistanAdlari.ts through ../klinik/asistanKimligi.ts), and one neutral line.
 *
 * No biography: no years of practice, no place of work, no degree. That text is the owner's to decide with a local
 * clinician. A role without an entry — and an account without a role — gets no personal name at all: the neutral
 * "Notya assistant". Never another role's name.
 *
 * Pure: these render in a plain Node test.
 */
import React from 'react'
import PersonaFoto from '@/components/asistan/PersonaFoto'
import { ulkeYolu } from '@/lib/ulke/yol'
import { asistanKimligi, marka, metninDili, rolAdi, rolMu, type UygulamaMetni } from '@/lib/ulke/arayuz'

/** The name a screen shows for the assistant of `rol`: the owner's name for that role, or the neutral one. */
export function asistanAdi(m: UygulamaMetni, rol: string | null | undefined): string {
  return asistanKimligi(rol, metninDili(m))?.tamAd ?? m.asistan.notr.replace('%', marka())
}

/** AU-PORTRE-01: the portrait URL of the role's assistant, or null (no portrait produced: screens show nothing / initials). */
export function asistanPortresi(m: UygulamaMetni, rol: string | null | undefined): string | null {
  const yol = asistanKimligi(rol, metninDili(m))?.portre
  return yol ? ulkeYolu(yol) : null
}

/** Small round portrait for the home line and the card. Draws nothing without a portrait. */
export function AsistanKucukFoto({ m, rol, boy = 28 }: { m: UygulamaMetni; rol: string | null | undefined; boy?: number }) {
  const src = asistanPortresi(m, rol)
  if (!src) return null
  const ad = asistanAdi(m, rol)
  return <span data-alan="asistan-portre" aria-hidden="true" style={{ display: 'inline-block', width: boy, height: boy, borderRadius: '50%', overflow: 'hidden', verticalAlign: 'middle', marginRight: 8 }}><PersonaFoto src={src} ad={ad} harf="" /></span>
}

/** "Your senior colleague · Cardiology" — only for a role that has an assistant of its own. '' otherwise. */
export function asistanSatiri(m: UygulamaMetni, rol: string | null | undefined): string {
  const dil = metninDili(m)
  const ad = rolAdi(rol, dil)
  return asistanKimligi(rol, dil) && ad ? `${m.asistan.satir} · ${ad}` : ''
}

/** The home screen's card. */
export function AsistanKarti({ m, rol }: { m: UygulamaMetni; rol: string | null | undefined }) {
  const satir = asistanSatiri(m, rol)
  return (
    <section className="uza-kart" data-alan="asistan" data-rol={rolMu(rol) ? rol : undefined}>
      <p className="uza-ust-yazi">{m.asistan.etiket}</p>
      <div style={{ display: 'flex', alignItems: 'center' }}><AsistanKucukFoto m={m} rol={rol} boy={40} /><p className="uza-asistan-ad" data-alan="asistan-ad">{asistanAdi(m, rol)}</p></div>
      {satir ? <p className="uza-ipucu" style={{ marginTop: 2 }} data-alan="asistan-satir">{satir}</p> : null}
    </section>
  )
}

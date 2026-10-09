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
import { asistanKimligi, marka, metninDili, rolAdi, rolMu, type UygulamaMetni } from '@/lib/ulke/arayuz'

/** The name a screen shows for the assistant of `rol`: the owner's name for that role, or the neutral one. */
export function asistanAdi(m: UygulamaMetni, rol: string | null | undefined): string {
  return asistanKimligi(rol, metninDili(m))?.tamAd ?? m.asistan.notr.replace('%', marka())
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
      <p className="uza-asistan-ad" data-alan="asistan-ad">{asistanAdi(m, rol)}</p>
      {satir ? <p className="uza-ipucu" style={{ marginTop: 2 }} data-alan="asistan-satir">{satir}</p> : null}
    </section>
  )
}

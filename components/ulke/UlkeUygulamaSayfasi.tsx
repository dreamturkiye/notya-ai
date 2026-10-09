/**
 * NOTYA-UZ-MUAYENE-01 — one screen of the signed-in application, for a country that switches the feature
 * `cekirdekMuayene` on. Core holds only this door: the screen and every sentence on it are the active pack's own
 * (countries/active/sayfalar). Feature off, or a screen the pack does not bring → "not found". There is no default
 * screen and no other country's screen to fall back to.
 */
import React from 'react'
import { notFound } from 'next/navigation'
import { AKTIF_ARAYUZ } from '@/countries/active/arayuz'
import { UYGULAMA_EKRAN_BILESENLERI } from '@/components/ulke/uygulama'
import { UYGULAMA_EKRANLARI } from '@/lib/ulke/tipler'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { rotaAcikMi } from '@/lib/ulke/rotaKapisi'
import type { UygulamaEkrani } from '@/lib/ulke/tipler'

export function UlkeUygulamaSayfasi({ ekran }: { ekran: UygulamaEkrani }) {
  // A screen exists where the feature is on, the pack brings content for the shared screens, and the pack lists the
  // screen's route. Anything else is "not found": there is no default screen and no other country's.
  const var_ = ozellikAcik('cekirdekMuayene') && AKTIF_ARAYUZ !== null && rotaAcikMi(ulkePaketi().rotalar, UYGULAMA_EKRANLARI[ekran]) && (ekran !== 'takvim' || ozellikAcik('randevu'))
  const Ekran = var_ ? UYGULAMA_EKRAN_BILESENLERI[ekran] : undefined
  if (!Ekran) notFound()
  return <Ekran />
}

/**
 * NOTYA-UZ-MUAYENE-01 — one screen of the signed-in application, for a country that switches the feature
 * `cekirdekMuayene` on. Core holds only this door: the screen and every sentence on it are the active pack's own
 * (countries/active/sayfalar). Feature off, or a screen the pack does not bring → "not found". There is no default
 * screen and no other country's screen to fall back to.
 */
import React from 'react'
import { notFound } from 'next/navigation'
import { AKTIF_SAYFALAR } from '@/countries/active/sayfalar'
import { ozellikAcik } from '@/lib/ulke/ulke'
import type { UygulamaEkrani } from '@/lib/ulke/tipler'

export function UlkeUygulamaSayfasi({ ekran }: { ekran: UygulamaEkrani }) {
  const Ekran = ozellikAcik('cekirdekMuayene') ? AKTIF_SAYFALAR.uygulama?.[ekran] : undefined
  if (!Ekran) notFound()
  return <Ekran />
}

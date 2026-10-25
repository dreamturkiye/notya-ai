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
import { BitkiSaglayici, HedefBoyGorselSaglayici } from '@/components/ulke/uygulama/bitki'
import { UYGULAMA_EKRANLARI } from '@/lib/ulke/tipler'
import { asistanSesAdlari } from '@/lib/ulke/arayuz'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { rotaAcikMi } from '@/lib/ulke/rotaKapisi'
import type { UygulamaEkrani } from '@/lib/ulke/tipler'
import bitki from '../../public/doktor-chrome/plant.jpg'
import hbBaba from '../../public/hedef-boy/baba.png'
import hbAnne from '../../public/hedef-boy/anne.png'
import hbErkek from '../../public/hedef-boy/cocuk-erkek.png'
import hbKiz from '../../public/hedef-boy/cocuk-kiz.png'

export function UlkeUygulamaSayfasi({ ekran }: { ekran: UygulamaEkrani }) {
  // A screen exists where the feature is on, the pack brings content for the shared screens, and the pack lists the
  // screen's route. Anything else is "not found": there is no default screen and no other country's.
  const var_ = ozellikAcik('cekirdekMuayene') && AKTIF_ARAYUZ !== null && rotaAcikMi(ulkePaketi().rotalar, UYGULAMA_EKRANLARI[ekran]) && (ekran !== 'takvim' || ozellikAcik('randevu')) && (ekran !== 'araclar' || ozellikAcik('araclar'))
    // NOTYA-ULKE-KLINIK-01: the clinic's screen where the pack has clinic accounts; the front-desk workspace needs appointments as well.
    && ((ekran !== 'klinik' && ekran !== 'onBuro') || ozellikAcik('klinikHesaplari')) && (ekran !== 'onBuro' || ozellikAcik('randevu'))
    // AU-BETA-01: the privacy-request and invoice screens exist only where the pack brings that extension.
    && (ekran !== 'gizlilikTalepleri' || Boolean(ulkePaketi().uzanti?.gizlilik)) && (ekran !== 'taniKodlari' || Boolean(ulkePaketi().uzanti?.taniKodlari)) && (ekran !== 'islemKodlari' || Boolean(ulkePaketi().uzanti?.islemKodlari)) && (ekran !== 'fatura' || Boolean(ulkePaketi().uzanti?.fatura))
    // AU-CANLI-02: the assistant page exists only where the pack has the live assistant (its two voices and its settings).
    && (ekran !== 'asistan' || asistanSesAdlari() !== null)
    // The messages inbox exists where doctors and patients can write to each other.
    && (ekran !== 'mesajlar' || ozellikAcik('hastaMesajlari'))
  const Ekran = var_ ? UYGULAMA_EKRAN_BILESENLERI[ekran] : undefined
  if (!Ekran) notFound()
  return <BitkiSaglayici src={bitki.src}><HedefBoyGorselSaglayici gorseller={{ baba: hbBaba.src, anne: hbAnne.src, erkek: hbErkek.src, kiz: hbKiz.src }}><Ekran /></HedefBoyGorselSaglayici></BitkiSaglayici>
}

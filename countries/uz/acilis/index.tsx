/**
 * NOTYA-ULKE-01 — the pages Uzbekistan brings itself. Reached only through countries/active/sayfalar.
 * The stylesheets and the photographs are imported here, not in the component, so the component renders in a plain
 * Node test.
 *
 * NOTYA-UZ-ACILIS-02: the photographs are the Turkish landing page's own three files (public/landing), reused as
 * they are. They are imported, not linked by path: the build then serves them from its own asset folder
 * (/uzbek/_next/static/media/…), which the country gate lets through — a path under public/ is closed in an
 * Uzbekistan build (middleware.ulke.ts), and no path has to be opened for them.
 */
import './utilities.css'
import './acilis.css'
import React from 'react'
import type { AcilisSayfasiProps, UlkeSayfalari } from '@/lib/ulke/tipler'
import xona from '../../../public/landing/hero-clinic.jpg'
import stol from '../../../public/landing/desk-notes.jpg'
import yolak from '../../../public/landing/corridor.jpg'
import { AcilisSayfasi } from './AcilisSayfasi'
import { UZ_UYGULAMA } from '../uygulama'

function UzAcilis(props: AcilisSayfasiProps) {
  return <AcilisSayfasi {...props} gorseller={{ xona: xona.src, stol: stol.src, yolak: yolak.src }} />
}

export const UZ_SAYFALARI: UlkeSayfalari = {
  acilis: UzAcilis,
  uygulama: UZ_UYGULAMA,
}

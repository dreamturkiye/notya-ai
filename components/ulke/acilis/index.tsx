/**
 * NOTYA-ULKE-SABLON-01 — the landing page of a country, as the root route serves it: the kit's layout
 * (./AcilisSayfasi.tsx) with the active pack's content (countries/active/arayuz → `acilis`).
 *
 * This is the one file of the landing page that needs the bundler: it brings the two stylesheets and the three
 * photographs. The photographs are the Turkish landing page's own files (public/landing), imported here so that the
 * build serves them from this build's asset folder under the country's path prefix — nothing under public/ is
 * reachable in a country build. Everything else renders in a plain Node test.
 */
import './utilities.css'
import './acilis.css'
import React from 'react'
import type { UlkeAcilisi } from '@/lib/ulke/arayuz/acilisTipleri'
import type { AcilisSayfasiProps } from '@/lib/ulke/tipler'
import xona from '../../../public/landing/hero-clinic.jpg'
import stol from '../../../public/landing/desk-notes.jpg'
import yolak from '../../../public/landing/corridor.jpg'
import { AcilisSayfasi } from './AcilisSayfasi'

export function UlkeAcilisSayfasi(props: AcilisSayfasiProps & { acilis: UlkeAcilisi }) {
  return <AcilisSayfasi {...props} gorseller={{ xona: xona.src, stol: stol.src, yolak: yolak.src }} />
}

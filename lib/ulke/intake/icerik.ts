/**
 * NOTYA-ULKE-INTAKE-01 — the active pack's questions for the intake form. SERVER ONLY: the questions are part of the
 * pack's clinical half (countries/active/klinik), and a role's questions reach a browser only inside a form of that role.
 */
import { AKTIF_KLINIK } from '@/countries/active/klinik'
import { ozellikAcik } from '../ulke'
import type { HastaFormuIcerigi } from './tipler'

/** true = the intake form exists in this country: the application, the portal and the form are on, and the pack brings questions. */
export const formAcik = (): boolean => ozellikAcik('cekirdekMuayene') && ozellikAcik('hastaPortali') && ozellikAcik('hastaFormu') && Boolean(AKTIF_KLINIK?.hastaFormu)

/** The pack's questions, or null where the country has no intake form. */
export const aktifFormIcerigi = (): HastaFormuIcerigi | null => (formAcik() ? AKTIF_KLINIK?.hastaFormu ?? null : null)

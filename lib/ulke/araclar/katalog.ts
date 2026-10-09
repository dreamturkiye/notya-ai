/**
 * NOTYA-ULKE-ARACLAR-01 — THE KIT'S CATALOGUE OF TOOLS: every tool mechanism a country build can have, by key.
 * Country-neutral: keys, fields, arithmetic, citations of published sources. No word a doctor reads is here.
 *
 * A key appears on a country's screens only when that country's pack lists it too (with its roles and its text).
 * What is NOT here does not exist in any country build: in particular no tool of one country's state or payer
 * system (countries/yasak-araclar.json; scripts/ulke-duvarlari.mjs, rule D7).
 */
import type { AracTanimi } from './tipler'
import { BOS_SONUC } from './yardimci'
import { ACIL_ANESTEZI_BEYIN } from './tanimlar/acilAnesteziBeyin'
import { CERRAHI_DAHILIYE_DERM } from './tanimlar/cerrahiDahiliyeDerm'
import { ENDO_ENFEKSIYON_GASTRO } from './tanimlar/endoEnfeksiyonGastro'
import { CERRAHI_GOGUS_GOZ } from './tanimlar/cerrahiGogusGoz'
import { KALP_KBB } from './tanimlar/kalpKbb'
import { NEFRO_ONKO } from './tanimlar/nefroOnko'
import { ORTO_PEDI_RADYO_ROMA } from './tanimlar/ortoPediRadyoRoma'

/**
 * The patient portal as a tile: finding a patient and opening their file, where access is given (a link and a PIN)
 * and what is shared is chosen. The screen is the kit's own; the tool has no fields and works nothing out.
 */
const HASTA_PORTALI: AracTanimi = { anahtar: 'hasta-portali', tur: 'ekran', ekran: 'hastaPortali', alanlar: [], cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: [] }, kaynak: null, hesapla: () => BOS_SONUC }

export const KIT_ARACLARI: readonly AracTanimi[] = [HASTA_PORTALI, ...ACIL_ANESTEZI_BEYIN, ...CERRAHI_DAHILIYE_DERM, ...ENDO_ENFEKSIYON_GASTRO, ...CERRAHI_GOGUS_GOZ, ...KALP_KBB, ...NEFRO_ONKO, ...ORTO_PEDI_RADYO_ROMA]

const DIZIN: ReadonlyMap<string, AracTanimi> = new Map(KIT_ARACLARI.map((a) => [a.anahtar, a]))

/** The kit's definition of a tool, or null: a key the kit does not have is not a tool anywhere. */
export const kitAraci = (anahtar: unknown): AracTanimi | null => (typeof anahtar === 'string' ? DIZIN.get(anahtar) ?? null : null)

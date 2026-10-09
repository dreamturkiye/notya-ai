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

/**
 * The follow-up list as a tile (migration 139; ./kayit.ts): the results the doctor kept on patients WITH a follow-up
 * day the doctor entered, earliest first, overdue ones marked; the doctor marks one as done. The screen is the kit's
 * own. It replaces the per-specialty cohort panels of the pre-split application with ONE list: what it shows is the
 * follow-up the doctor set, not columns of one disease. The kit proposes no day.
 */
const TAKIP_PANELI: AracTanimi = { anahtar: 'takip-paneli', tur: 'ekran', ekran: 'takipPaneli', alanlar: [], cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: [] }, kaynak: null, hesapla: () => BOS_SONUC }

/**
 * "My templates" as a tile (migration 141; lib/ulke/sablon/): the doctor's own reusable text blocks for notes and
 * messages — create, edit, delete. The screen is the kit's own; the tool has no fields, works nothing out and knows
 * no patient. It exists only where the pack also switches the feature `hekimSablonlari` on (the pack check holds the
 * two together).
 */
const SABLONLARIM: AracTanimi = { anahtar: 'sablonlarim', tur: 'ekran', ekran: 'sablonlarim', alanlar: [], cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: [] }, kaynak: null, hesapla: () => BOS_SONUC }

/**
 * Consultation between doctors as a tile (migration 142; lib/ulke/konsultasyon/): the account's own consultation
 * code, what it was asked by colleagues and what it asked. The screen is the kit's own; the tool has no fields and
 * works nothing out. A consultation is ASKED from a patient's file. It exists only where the pack also switches the
 * feature `konsultasyon` on (the pack check holds the two together).
 */
const KONSULTASYONLAR: AracTanimi = { anahtar: 'konsultasyonlar', tur: 'ekran', ekran: 'konsultasyonlar', alanlar: [], cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: [] }, kaynak: null, hesapla: () => BOS_SONUC }

export const KIT_ARACLARI: readonly AracTanimi[] = [HASTA_PORTALI, TAKIP_PANELI, SABLONLARIM, KONSULTASYONLAR, ...ACIL_ANESTEZI_BEYIN, ...CERRAHI_DAHILIYE_DERM, ...ENDO_ENFEKSIYON_GASTRO, ...CERRAHI_GOGUS_GOZ, ...KALP_KBB, ...NEFRO_ONKO, ...ORTO_PEDI_RADYO_ROMA]

const DIZIN: ReadonlyMap<string, AracTanimi> = new Map(KIT_ARACLARI.map((a) => [a.anahtar, a]))

/** The kit's definition of a tool, or null: a key the kit does not have is not a tool anywhere. */
export const kitAraci = (anahtar: unknown): AracTanimi | null => (typeof anahtar === 'string' ? DIZIN.get(anahtar) ?? null : null)

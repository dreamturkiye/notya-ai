/**
 * NOTYA-ULKE-MESAJ-01 — THE PACK CHECK FOR "MY TEMPLATES". Called by the pack check (lib/ulke/paketDenetimi.ts);
 * answers with a list, like every other rule there, and a country's build fails on any line of it. Pure.
 *
 *   - the catalogue is there in every language form, and a sentence that carries a value holds its placeholder;
 *   - THE FEATURE AND ITS TILE GO TOGETHER: templates are kept on the tile `sablonlarim` of the tools area, so a pack
 *     that switches the feature on lists the tile (and has the tools area), and a pack that lists the tile switches
 *     the feature on — a tile must never open a screen whose route answers "not found";
 *   - the tile is a BASE tool (`roller: null`): every role keeps its own text blocks the same way.
 *
 * What no machine can check: a pack brings NO ready-made template. A doctor's templates are the doctor's own.
 */
import type { UlkeArayuzu } from '../arayuz/tipler'
import { eksikAyarMi, eksikMetinMi } from '../eksik'
import type { DilKodu, UlkePaketi } from '../tipler'
import { SABLON_ARACI } from './sabitler'

export type SablonSorunu = { yer: string; sorun: string }

/** Sentences of the templates' catalogue that carry a value: path → the placeholders they must hold. */
export const SABLON_YER_TUTUCULARI: readonly (readonly [string, readonly string[]])[] = [['cokUzun', ['%']], ['cokFazla', ['%']]]

export function sablonSorunlari(paket: UlkePaketi, arayuz: UlkeArayuzu | null, diller: readonly DilKodu[], metinleriGez: (deger: unknown, yer: string, sorunlar: SablonSorunu[]) => void): SablonSorunu[] {
  const s: SablonSorunu[] = []
  const ekle = (yer: string, sorun: string) => s.push({ yer, sorun })
  const acik = paket.ozellikler.hekimSablonlari === true
  if (acik && !paket.ozellikler.cekirdekMuayene) ekle('ozellikler.hekimSablonlari', '"my templates" need the signed-in application (cekirdekMuayene)')
  if (!arayuz) return s
  // the tile, where the pack has decided its tools at all
  const araclar = arayuz.araclar && !eksikAyarMi(arayuz.araclar) && Array.isArray(arayuz.araclar.araclar) ? arayuz.araclar.araclar : null
  const kutu = araclar?.find((p) => p?.anahtar === SABLON_ARACI) ?? null
  if (kutu && !acik) ekle(`arayuz.araclar.${SABLON_ARACI}`, 'the tile is listed and the feature hekimSablonlari is off: the tile would open a screen whose route answers "not found"')
  if (!acik) return s
  if (!paket.ozellikler.araclar) ekle('ozellikler.hekimSablonlari', '"my templates" need the tools area (araclar): the templates are kept on its tile')
  else if (araclar && !kutu) ekle(`arayuz.araclar.${SABLON_ARACI}`, `"my templates" are on and the tools area does not list the tile "${SABLON_ARACI}": a doctor could use templates and never create one`)
  if (kutu && !eksikAyarMi(kutu.roller) && kutu.roller !== null) ekle(`arayuz.araclar.${SABLON_ARACI}.roller`, 'must be null: "my templates" is a base tool, the same for every role')
  for (const d of diller) {
    const sm = arayuz.sablonMetinleri?.[d]
    const yer = `arayuz.sablonMetinleri[${d}]`
    if (!sm) { ekle(yer, '"my templates" are on and this form has no catalogue for them'); continue }
    metinleriGez(sm, yer, s)
    for (const [yol, yerler] of SABLON_YER_TUTUCULARI) {
      const metin = (sm as unknown as Record<string, unknown>)[yol]
      if (typeof metin !== 'string' || eksikMetinMi(metin) || !metin.trim()) continue
      for (const y of yerler) if (!/%(?!\d)/.test(metin)) ekle(`${yer}.${yol}`, `must hold "${y}" where the value is written`)
    }
  }
  return s
}

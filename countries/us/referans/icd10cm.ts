/**
 * FY2027 ICD-10-CM order file, read from disk. Node only: do not import this
 * from the pack. The pack is loaded in the browser, and this file is the full
 * order list.
 *
 * Source: CDC/NCHS FTP, icd10cm-code-descriptions-2027.zip, file
 * icd10cm-order-2027.txt, retrieved 14 October 2026.
 * https://ftp.cdc.gov/pub/health_statistics/nchs/publications/ICD10CM/2027/icd10cm-code-descriptions-2027.zip
 * The CDC files page says FY27 codes are for services from 1 October 2026
 * through 30 September 2027: https://www.cdc.gov/nchs/icd/icd-10-cm/files.html
 *
 * A line is the order-file layout: five-digit order number, a 7-character
 * code with no dot, a flag, a 60-character short description, then the long
 * description. Flag 0 is a header. Flag 1 is marked valid for submission.
 * The order-file note names a transaction context; that sentence is not copied.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export type UsIcdSatir = { sira: string; kod: string; bayrak: '0' | '1'; kisa: string; uzun: string }

let bellek: Map<string, UsIcdSatir> | null = null

function yukle(): Map<string, UsIcdSatir> {
  if (bellek) return bellek
  const ham = readFileSync(join(__dirname, 'icd10cm-order-2027.txt'), 'latin1')
  const tablo = new Map<string, UsIcdSatir>()
  for (const line of ham.split(/\n/)) {
    if (line.length < 16) continue
    const bayrak = line[14]
    if (bayrak !== '0' && bayrak !== '1') continue
    const kod = line.slice(6, 13).trim()
    tablo.set(kod, { sira: line.slice(0, 5).trim(), kod, bayrak, kisa: line.slice(16, 76).trim(), uzun: line.slice(77).trim() })
  }
  bellek = tablo
  return tablo
}

/** Dots are ignored, so A00.0 and A000 are the same row. */
export function usIcdBak(kod: string): UsIcdSatir | null {
  const anahtar = kod.replace(/\./g, '').trim().toUpperCase()
  if (!anahtar) return null
  return yukle().get(anahtar) ?? null
}

export function usIcdSay(): { satir: number; bildirilir: number; baslik: number } {
  let bildirilir = 0
  let baslik = 0
  for (const s of yukle().values()) {
    if (s.bayrak === '1') bildirilir++
    else baslik++
  }
  return { satir: yukle().size, bildirilir, baslik }
}

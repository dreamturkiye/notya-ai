/**
 * AMELIYAT-NOTU-01 — PRE-FILLED PARAGRAPHS (PaketAraci.sablonlar): choosing an option of a choice field fills each
 * paragraph field the pack words for that option, ONLY WHERE IT IS STILL EMPTY. What the doctor already wrote is never
 * replaced. Pure; no text of any country (the words are the pack's, picked in the account's language form).
 */
import type { HamGirdi } from './girdi'
import type { AracTanimi, PaketAraci } from './tipler'
import { metinSiniri } from './yardimci'

export function sablonuUygula(paket: Pick<PaketAraci, 'sablonlar'>, tanim: Pick<AracTanimi, 'alanlar'>, ham: HamGirdi, alan: string, secenek: unknown, dil: string): HamGirdi {
  const sozler = typeof secenek === 'string' ? paket.sablonlar?.[alan]?.[secenek] : undefined
  if (!sozler) return ham
  const cikti: Record<string, string | boolean> = { ...ham }
  for (const [k, metin] of Object.entries(sozler)) {
    const hedef = tanim.alanlar.find((a) => a.anahtar === k)
    if (!hedef || hedef.tur !== 'metin' || hedef.uzun !== true) continue
    const mevcut = cikti[k]
    if (typeof mevcut === 'string' && mevcut.trim()) continue
    const t = metin[dil] ?? Object.values(metin)[0]
    if (typeof t === 'string' && t) cikti[k] = t.slice(0, metinSiniri(hedef))
  }
  return cikti
}

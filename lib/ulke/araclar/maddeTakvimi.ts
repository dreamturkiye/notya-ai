/**
 * AU-ARAC-GORUNUM-01 — THE MILESTONE CALENDAR: pure functions over a checklist tool's own fields and a patient's
 * kept results of it, for the shared screen that shows it as a calendar instead of in the generic flat list
 * (UlkeAraclari.takvimliListeAraci, components/ulke/uygulama/AsiTakvimi.tsx).
 *
 * Country-neutral and content-free: no milestone name, no vaccine, no word of any pack is here. The milestones are
 * read from the tool's OWN definition (`AracTanimi.alanlar`, the fields of type 'isaret', in the order it lists
 * them) and their labels come from the pack's own text — this file only works out, from the kept results, WHICH
 * milestones are done and on what date.
 */
import type { AracKaydi } from './kayitTipleri'
import type { AracTanimi } from './tipler'

/** The keys of a checklist tool's own milestones, in the order the tool lists them (its 'isaret' fields). */
export function maddeAnahtarlari(tanim: Pick<AracTanimi, 'alanlar'>): string[] {
  return tanim.alanlar.filter((a) => a.tur === 'isaret').map((a) => a.anahtar)
}

export type MaddeDurumu = { tamam: boolean; tarih: string | null }

/**
 * ONE PATIENT'S STATUS of every milestone, merged across every kept result of this one tool (a doctor may tick a
 * few milestones at one visit and more at the next: nothing here assumes one record holds the whole history).
 * Kayitlar are read oldest first, so a later record's tick and date are what stand for a milestone; a milestone
 * ticked with no date keeps whatever date an earlier record already gave it, never loses one.
 */
export function maddeTakvimiDurumu(kayitlar: readonly AracKaydi[], maddeler: readonly string[]): Record<string, MaddeDurumu> {
  const durum: Record<string, MaddeDurumu> = {}
  for (const m of maddeler) durum[m] = { tamam: false, tarih: null }
  const siraliKayitlar = [...kayitlar].sort((a, b) => (a.gun || a.olusturuldu).localeCompare(b.gun || b.olusturuldu))
  for (const k of siraliKayitlar) {
    if (!k.girdiler) continue
    for (const m of maddeler) {
      if (k.girdiler[m] !== true) continue
      const tarihden = k.sonuc?.tarihler.find((t) => t.anahtar === `${m}_tarih`)?.tarih ?? null
      const ham = typeof k.girdiler[`${m}_tarih`] === 'string' ? (k.girdiler[`${m}_tarih`] as string) : null
      durum[m] = { tamam: true, tarih: tarihden ?? ham ?? durum[m].tarih }
    }
  }
  return durum
}

/** true = at least one milestone of this tool has ever been ticked for this patient. */
export const maddeTakvimiBosMu = (durum: Readonly<Record<string, MaddeDurumu>>): boolean => !Object.values(durum).some((d) => d.tamam)

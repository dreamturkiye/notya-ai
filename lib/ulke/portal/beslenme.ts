/**
 * AU-DIETETICS-MEAL-01 / portal coaching — meal plan, food diary, agreed goals and clinic weight
 * for the patient portal.
 *
 * Pure shaping over kept tool results. Which tools, IF ANY, come from the pack
 * (`uygulama.portal.beslenme`). No note text; no nutrient analysis; no diagnosis.
 */
import { antropometriNoktalari } from '../araclar/antropometriTrend'
import type { AracKaydi } from '../araclar/kayitTipleri'
import type { PortalIcerigi } from './tipler'

const metin = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

/**
 * Current meal plan for the portal / file card.
 * Callers pass `kayitlar` newest-first (as `hastaninAracKayitlari` returns); the first completed plan wins.
 */
export function portalOgunPlani(kayitlar: readonly AracKaydi[], planAraci: string): NonNullable<PortalIcerigi['beslenme']>['plan'] {
  for (const k of kayitlar) {
    if (k.arac !== planAraci || !k.sonuc?.tamam || !k.girdiler) continue
    const g = k.girdiler
    const kahvalti = metin(g.kahvalti)
    const ogle = metin(g.ogle)
    const aksam = metin(g.aksam)
    const atistirmalik = metin(g.atistirmalik)
    if (!kahvalti && !ogle && !aksam && !atistirmalik) continue
    return {
      gun: typeof g.plan_tarihi === 'string' ? g.plan_tarihi : k.gun,
      kahvalti,
      ogle,
      aksam,
      atistirmalik,
      notlar: metin(g.notlar),
    }
  }
  return null
}

/** Recent food-diary entries, newest first, capped. */
export function portalYemekGunlugu(
  kayitlar: readonly AracKaydi[],
  gunlukAraci: string,
  enCok = 12,
): NonNullable<PortalIcerigi['beslenme']>['gunluk'] {
  const liste: { gun: string; ogun: string; aciklama: string; kim: string }[] = []
  for (const k of kayitlar) {
    if (k.arac !== gunlukAraci || !k.sonuc?.tamam || !k.girdiler) continue
    const g = k.girdiler
    const aciklama = metin(g.aciklama)
    if (!aciklama) continue
    liste.push({
      gun: typeof g.gun === 'string' ? g.gun : k.gun,
      ogun: metin(g.ogun) || 'diger',
      aciklama,
      kim: metin(g.kim) || 'diyetisyen',
    })
    if (liste.length >= enCok) break
  }
  return liste
}

/**
 * Person-centred goals the dietitian ticked with the client (newest completed result).
 * Labels come from the pack (`etiket.hedefAdi`); unknown keys are omitted.
 */
export function portalBeslenmeHedefleri(
  kayitlar: readonly AracKaydi[],
  hedefAraci: string,
  hedefAdi: Readonly<Record<string, string>>,
): NonNullable<PortalIcerigi['beslenme']>['hedefler'] {
  for (const k of kayitlar) {
    if (k.arac !== hedefAraci || !k.sonuc?.tamam || !k.girdiler) continue
    const g = k.girdiler
    const hedefler: { anahtar: string; etiket: string }[] = []
    for (const [anahtar, etiket] of Object.entries(hedefAdi)) {
      if (g[anahtar] === true && etiket.trim()) hedefler.push({ anahtar, etiket })
    }
    // First completed goals record wins (newest-first list). Empty ticks still "settle" so an older
    // record with goals is not mixed in after an intentional clear.
    return hedefler
  }
  return []
}

/**
 * Clinic-recorded weight / waist / BMI points for the patient page (numbers only).
 * Newest first, capped. Built from the pack-named body-size tool via antropometri helpers.
 */
export function portalAgirlikGecmisi(
  kayitlar: readonly AracKaydi[],
  agirlikAraci: string,
  enCok = 8,
): NonNullable<PortalIcerigi['beslenme']>['agirlik'] {
  const kilo = new Map(antropometriNoktalari(kayitlar, agirlikAraci, 'agirlik').map((n) => [n.tarih, n.deger]))
  const bel = new Map(antropometriNoktalari(kayitlar, agirlikAraci, 'bel').map((n) => [n.tarih, n.deger]))
  const bmi = new Map(antropometriNoktalari(kayitlar, agirlikAraci, 'bmi').map((n) => [n.tarih, n.deger]))
  const gunler = [...new Set([...kilo.keys(), ...bel.keys(), ...bmi.keys()])].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
  return gunler.slice(0, enCok).map((gun) => ({
    gun,
    kiloKg: kilo.get(gun) ?? null,
    belCm: bel.get(gun) ?? null,
    bmi: bmi.get(gun) ?? null,
  }))
}

/** How many diary lines the patient wrote (for the dietitian's file badge). */
export function portalHastaGunlukSayisi(
  kayitlar: readonly AracKaydi[],
  gunlukAraci: string,
): number {
  return portalYemekGunlugu(kayitlar, gunlukAraci, 100).filter((x) => x.kim === 'hasta').length
}

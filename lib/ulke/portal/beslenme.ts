/**
 * AU-DIETETICS-MEAL-01 — meal plan + food diary for the patient portal.
 *
 * Pure shaping over kept tool results. Which tools, IF ANY, come from the pack
 * (`uygulama.portal.beslenme`). No note text; no nutrient analysis.
 */
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
  const liste: NonNullable<PortalIcerigi['beslenme']>['gunluk'] = []
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

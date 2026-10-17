/**
 * NOTYA-ULKE-ARACLAR-AU-07 — growth percentile: weight, height or head circumference, by age and sex, against the
 * WHO Child Growth Standards (2006, 0–60 months) and WHO Growth Reference (2007, 61+ months). WHO's standard is
 * international — not a national authority's reference range — and is the one every source the Australian pack's
 * own growth-chart link-out tile read agrees applies without dispute under 2 years (./araclar/baglantilar.ts →
 * AU_GROWTH_CHART_REFERENCE, citing ANZSPED, read 2026-10-13: "Infants and children less than 2 years of age – use
 * the WHO growth standards"). For 2 to 18 years, Australian practice may instead follow ANZSPED's own endorsed
 * charts or the CDC 2000 charts — that choice is the clinician's and is why the link-out tile still exists beside
 * this calculator: this tool gives the WHO percentile and z-score as decision support, consistently, at every age;
 * it does not assert that WHO is the only chart Australian practice uses from 2 to 18.
 *
 * THE DATA IS NOT COPIED HERE A SECOND TIME. `lib/clinical/whoBuyumeLms.ts` and `lib/clinical/buyumeEgrisi.ts` are
 * shared, byte-identical files already present in this checkout; this tool imports their WHO table and LMS function
 * directly, so there is exactly one copy of the WHO numbers in the whole product and no risk of the two drifting
 * apart. Neyzi (lib/clinical/buyumeEgrisi.ts's Turkish reference) is NOT used here: it is a Turkish national
 * reference, out of scope for a country kit tool by the same rule that keeps a national authority's reference
 * range out of the kit.
 *
 * Stands beside specialties/pediatri/engines/buyume.ts → degerlendir('who', …) (the WHO branch only; the Neyzi
 * branch is Turkey-specific and has no counterpart here).
 */
import { lmsDegerlendir } from '@/lib/clinical/buyumeEgrisi'
import { WHO_LMS, WHO_UST_AY } from '@/lib/clinical/whoBuyumeLms'
import type { AracTanimi } from '../tipler'
import { BOS_SONUC, gunFarki, gunMu, sayi, sayiMi, secim, tarih } from '../yardimci'

/** Average days per calendar month (30.4375), the same constant specialties/pediatri/engines/girdi.ts → ondalikAy uses. */
const GUN_PER_AY = 30.4375

export const BUYUME_PARAMETRELERI = ['kilo', 'boy', 'basCevresi'] as const
export type BuyumeParametresi = (typeof BUYUME_PARAMETRELERI)[number]

export const BUYUME_PERSENTILI: AracTanimi = {
  anahtar: 'buyume-persentili',
  tur: 'hesap',
  alanlar: [
    secim('cinsiyet', ['male', 'female']),
    secim('parametre', [...BUYUME_PARAMETRELERI]),
    tarih('dogum_tarihi'),
    tarih('olcum_tarihi'),
    // one of the three — only the one whose kosul matches `parametre` is ever handed to hesapla (kosullariUygula)
    sayi('deger_kilo', 1, 40, { olcu: 'agirlik', kosul: { alan: 'parametre', degerler: ['kilo'] } }),
    sayi('deger_boy', 30, 150, { olcu: 'boy', kosul: { alan: 'parametre', degerler: ['boy'] } }),
    sayi('deger_bas', 25, 60, { kosul: { alan: 'parametre', degerler: ['basCevresi'] } }),
  ],
  cikti: { sayilar: ['persentil', 'z', 'ay'], bantlar: [], uyarilar: ['yas_disi'], tarihler: [] },
  sonucOlculeri: [],
  kaynak: 'WHO Child Growth Standards (2006), 0-60 months; WHO Growth Reference (2007), 61+ months (cdn.who.int; the same tables as lib/clinical/whoBuyumeLms.ts, fetched 2026-09-18).',
  hesapla: (g) => {
    if ((g.cinsiyet !== 'male' && g.cinsiyet !== 'female') || typeof g.parametre !== 'string') return BOS_SONUC
    const param = g.parametre as BuyumeParametresi
    const deger = param === 'kilo' ? g.deger_kilo : param === 'boy' ? g.deger_boy : g.deger_bas
    if (!gunMu(g.dogum_tarihi) || !gunMu(g.olcum_tarihi) || !sayiMi(deger)) return BOS_SONUC
    const gun = gunFarki(g.dogum_tarihi, g.olcum_tarihi)
    if (gun < 0) return BOS_SONUC
    const ay = gun / GUN_PER_AY
    if (ay > WHO_UST_AY[param]) return { tamam: false, sayilar: [], bant: null, uyarilar: ['yas_disi'], tarihler: [] }
    const tablo = WHO_LMS[param][g.cinsiyet as 'male' | 'female']
    const sonuc = lmsDegerlendir([...tablo].map(([noktaAy, L, M, S]) => ({ ay: noktaAy, L, M, S })), ay, deger as number)
    if (!sonuc) return BOS_SONUC
    return {
      tamam: true,
      sayilar: [
        { anahtar: 'persentil', deger: Math.round(sonuc.persentil * 10) / 10, ondalik: 1 },
        { anahtar: 'z', deger: Math.round(sonuc.zSkor * 100) / 100, ondalik: 2 },
        { anahtar: 'ay', deger: Math.round(ay * 100) / 100, ondalik: 2 },
      ],
      bant: null,
      uyarilar: [],
      tarihler: [],
    }
  },
}

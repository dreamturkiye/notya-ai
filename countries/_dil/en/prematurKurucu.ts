/**
 * PREMATUR-ULKE-01 — THE ENGLISH LANGUAGE SET: the pieces a country builds its prematurity table from (countries/<code>/prematur.ts).
 * Written once in en-GB spelling and put into the country's own form of English. What the set holds is only the NAME of each follow-up
 * item and what a "follow your local protocol" item says; every criterion, date and source is the country's own, beside its citation.
 * MACHINE-WRITTEN. AWAITS CLINICAL REVIEW IN EACH COUNTRY.
 */
import type { ErkenDogumProtokolu } from '@/lib/ulke/prematur/erkenDogum'
import type { Kaynak, KaynakDurumu, KriterKosulu, KuralKategori, Metin, PrematurKural, PrematurProtokol, Zamanlama } from '@/lib/ulke/prematur/tipler'
import { URUN_PARAMETRELERI } from '@/lib/ulke/prematur/tipler'
import { enYaz, type EnBicim } from './varyant'

/** The follow-up items every country's table names, in the order the plan shows them. */
export const PREMATUR_KALEMLERI: Readonly<Record<string, { kategori: KuralKategori; baslik: string; aciklama: string }>> = {
  rop: { kategori: 'goz', baslik: 'Retinopathy of prematurity (ROP) eye screening', aciklama: 'Examinations of the retina by an ophthalmologist, for babies who meet the criterion of this country\'s source.' },
  'cranial-us': { kategori: 'beyin', baslik: 'Cranial ultrasound', aciklama: 'Routine head ultrasound scans of a preterm baby, for babies who meet the criterion of this country\'s source.' },
  'hearing-9m': { kategori: 'isitme', baslik: 'Hearing: follow-up for risk factors', aciklama: 'Diagnostic hearing assessment for a baby with a risk factor for hearing loss, even where the newborn screen was passed.' },
  'hearing-ecmo': { kategori: 'isitme', baslik: 'Hearing after ECMO', aciklama: 'Hearing assessment after extracorporeal membrane oxygenation.' },
  bpd: { kategori: 'akciger', baslik: 'Chronic lung disease (bronchopulmonary dysplasia)', aciklama: 'Follow-up of a baby with chronic lung disease of prematurity.' },
  rsv: { kategori: 'enfeksiyon', baslik: 'RSV (respiratory syncytial virus) protection', aciklama: 'Whether the baby is among the infants this country\'s source names for protection against RSV.' },
  iron: { kategori: 'kan', baslik: 'Iron supplementation', aciklama: 'When this country\'s source says iron supplementation starts for a preterm baby. The medicine and its dose are yours.' },
  bone: { kategori: 'kemik', baslik: 'Bone health (metabolic bone disease of prematurity)', aciklama: 'Checks of bone health in a preterm baby.' },
}

export const PREMATUR_KALEM_SIRASI = ['rop', 'cranial-us', 'hearing-9m', 'hearing-ecmo', 'bpd', 'rsv', 'iron', 'bone'] as const

const YEREL_ACIKLAMA = 'This product states no criterion and no date for this item in this country: its source could not be read and cited here. Follow your local protocol.'

export type KuralGovdesi = Pick<PrematurKural, 'kriter' | 'zamanlamalar' | 'kaynaklar'> & { aciklama?: string; hekimNotu?: string }

/** The tools of one country's table, in its form of English. */
export function prematurKurucu(bicim: EnBicim) {
  const m = (s: string): Metin => ({ [bicim]: enYaz(s, bicim) })
  /** A source: its short name, the citation as published, how it was read, and — unless the document itself was read — what was read. */
  const kaynak = (kisa: string, tam: string, durum: KaynakDurumu, not?: string): Kaynak => ({ kisa, tam, durum, ...(not ? { not: m(not) } : {}) })
  const kosul = (alan: KriterKosulu['alan'], op: KriterKosulu['op'], deger: number | undefined, etiket: string): KriterKosulu => ({ alan, op, ...(deger === undefined ? {} : { deger }), etiket: m(etiket) })
  const zaman = (z: Omit<Zamanlama, 'etiket' | 'kosul'> & { etiket: string; kosul?: KriterKosulu[] }): Zamanlama => ({ ...z, etiket: m(z.etiket) })
  /** A dated rule: the name of the item, the country's criterion, dates and sources. */
  const kural = (kod: string, g: KuralGovdesi): PrematurKural => {
    const k = PREMATUR_KALEMLERI[kod]
    return { kod, kategori: k.kategori, baslik: m(k.baslik), aciklama: m(g.aciklama ?? k.aciklama), kriter: g.kriter, zamanlamalar: g.zamanlamalar, kaynaklar: g.kaynaklar, ...(g.hekimNotu ? { hekimNotu: m(g.hekimNotu) } : {}) }
  }
  /** FOLLOW YOUR LOCAL PROTOCOL: no criterion and no date. `kaynaklar` = what was read about it (shown to the doctor), `neden` = why that is not enough. */
  const yerel = (kod: string, kaynaklar: Kaynak[] = [], neden?: string): PrematurKural => {
    const k = PREMATUR_KALEMLERI[kod]
    return { kod, kategori: k.kategori, baslik: m(k.baslik), aciklama: m(neden ? `${YEREL_ACIKLAMA} ${neden}` : YEREL_ACIKLAMA), yerel: true, kriter: null, zamanlamalar: [], kaynaklar }
  }
  /** The whole follow-up table: the country's rules by code, in the plan's order; an item it does not state is "follow your local protocol". */
  const protokol = (g: { ulke: string; kapsamKaynagi: string; duzeltmeKaynagi: string; kurallar: Readonly<Record<string, PrematurKural>> }): PrematurProtokol => ({
    ulke: g.ulke, ad: m(g.ulke), surum: '2026-11-13',
    duzeltme: { baslangicHafta: 37, buyumeUstAy: 24, gelisimUstAy: 24, kaynak: g.duzeltmeKaynagi },
    kapsam: { gestasyonHaftaKucuk: 37, dogumKiloGrEnFazla: 1500, kaynak: m(g.kapsamKaynagi) },
    urun: { ...URUN_PARAMETRELERI },
    kurallar: PREMATUR_KALEM_SIRASI.map((kod) => g.kurallar[kod] ?? yerel(kod)),
  })
  /** The early-birth block: thresholds the country's source states, `null` = follow your local protocol. */
  const erkenDogum = (g: Omit<ErkenDogumProtokolu, 'surum' | 'kapsam'> & { kapsam: string }): ErkenDogumProtokolu => ({ ...g, surum: '2026-11-13', kapsam: m(g.kapsam) })
  return { m, kaynak, kosul, zaman, kural, yerel, protokol, erkenDogum }
}

/** The corrected-age rule of every English-speaking pack: the product's own, the same as the Turkish module's, not taken from a national source. */
export const DUZELTME_KAYNAGI = 'Corrected age: born before 37 weeks, corrected up to 24 months of age. The product\'s own definition, the one its existing module for another country uses (AAP Committee on Fetus and Newborn, Engle 2004; CDC growth-chart guidance, MMWR 2010;59 RR-9), as cited there; not re-read for this country and not taken from a national source.'

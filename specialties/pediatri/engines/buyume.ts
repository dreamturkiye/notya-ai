/**
 * PEDI-ARACLAR-01 — Araçlar › Büyüme & persentil stüdyosu. Pure.
 * Referanslar: Neyzi 2015 (lib/clinical/buyumeEgrisi.ts — Türk çocukları, varsayılan) ve WHO (lib/clinical/whoBuyumeLms.ts —
 * 0–60 ay Child Growth Standards 2006, 61+ ay Growth Reference 2007). Aynı LMS matematiği (lmsDegerlendir) — kopya yok.
 * Çıktılar ölçümün istatistiksel konumudur; tanı değildir, hekim yorumlar.
 */
import {
  persentilHesapla, persentilEgrileri, lmsDegerlendir, lmsEgrileri, vkiSiniflandir, vkiSinifEtiket,
  type BuyumeParametre, type Cinsiyet, type EgriSerisi, type LMSNokta,
} from '@/lib/clinical/buyumeEgrisi'
import { WHO_LMS, WHO_UST_AY } from '@/lib/clinical/whoBuyumeLms'
import { gunFarki, ondalikAy } from './girdi'

export type Referans = 'neyzi' | 'who'
export const REFERANS_AD: Record<Referans, string> = { neyzi: 'Neyzi (Türk çocukları, 2015)', who: 'WHO (2006 standart · 2007 referans)' }
export const REFERANS_UST_AY: Record<Referans, Record<BuyumeParametre, number>> = {
  neyzi: { kilo: 216, boy: 216, basCevresi: 216, vki: 216 },
  who: WHO_UST_AY,
}
export const PARAM_AD: Record<BuyumeParametre, string> = { kilo: 'Kilo', boy: 'Boy', basCevresi: 'Baş çevresi', vki: 'VKİ' }
export const PARAM_BIRIM: Record<BuyumeParametre, string> = { kilo: 'kg', boy: 'cm', basCevresi: 'cm', vki: 'kg/m²' }

/** Eğri çizgileri = kayma sayımında "majör çizgi" (stüdyo ve hasta dosyası grafiğinde çizilen 7 çizgi). */
export const MAJOR_PERSENTILLER = [3, 10, 25, 50, 75, 90, 97] as const

const whoTablo = (param: BuyumeParametre, cinsiyet: Cinsiyet): LMSNokta[] =>
  WHO_LMS[param][cinsiyet].map(([ay, L, M, S]) => ({ ay, L, M, S }))

export interface Degerlendirme { persentil: number; z: number }

/** null → yaş referans kapsamı dışında (ör. WHO baş çevresi 60 ay sonrası yok). */
export function degerlendir(ref: Referans, param: BuyumeParametre, cinsiyet: Cinsiyet, ay: number, deger: number): Degerlendirme | null {
  if (!(ay >= 0) || ay > REFERANS_UST_AY[ref][param] || !(deger > 0)) return null
  const r = ref === 'neyzi' ? persentilHesapla(param, cinsiyet, ay, deger) : lmsDegerlendir(whoTablo(param, cinsiyet), ay, deger)
  return r ? { persentil: r.persentil, z: r.zSkor } : null
}

export function egriler(ref: Referans, param: BuyumeParametre, cinsiyet: Cinsiyet, maxAy: number): EgriSerisi[] {
  const ust = Math.min(REFERANS_UST_AY[ref][param], Math.max(6, Math.ceil(maxAy)))
  if (ref === 'neyzi') return persentilEgrileri(param, cinsiyet, ust)
  return lmsEgrileri(whoTablo(param, cinsiyet), ust, [...MAJOR_PERSENTILLER], ust > 60 ? 2 : 1)
}

export function vki(kiloKg: number, boyCm: number): number {
  return Math.round((kiloKg / Math.pow(boyCm / 100, 2)) * 100) / 100
}

/** Neyzi VKİ sınıflaması (Kaan 2026-09-13: yalnız ≥24 ay). WHO seçiliyken sınıf verilmez — yalnız z-skor. */
export function vkiSinifi(ref: Referans, ay: number, persentil: number): string | null {
  if (ref !== 'neyzi' || ay < 24) return null
  return vkiSinifEtiket(vkiSiniflandir(persentil))
}

export interface Olcum { tarih: string; kilo?: number | null; boy?: number | null; basCevresi?: number | null }

export interface OlcumSatiri {
  tarih: string
  ay: number
  deger: Partial<Record<BuyumeParametre, number>>
  sonuc: Partial<Record<BuyumeParametre, Degerlendirme | null>>
}

export function olcumSatirlari(ref: Referans, cinsiyet: Cinsiyet, dogumIso: string, olcumler: Olcum[]): OlcumSatiri[] {
  return olcumler
    .filter((o) => o.tarih && gunFarki(dogumIso, o.tarih) >= 0)
    .sort((a, b) => a.tarih.localeCompare(b.tarih))
    .map((o) => {
      const ay = ondalikAy(dogumIso, o.tarih)
      const deger: Partial<Record<BuyumeParametre, number>> = {}
      if (o.kilo) deger.kilo = o.kilo
      if (o.boy) deger.boy = o.boy
      if (o.basCevresi) deger.basCevresi = o.basCevresi
      if (o.kilo && o.boy) deger.vki = vki(o.kilo, o.boy)
      const sonuc: OlcumSatiri['sonuc'] = {}
      for (const p of Object.keys(deger) as BuyumeParametre[]) sonuc[p] = degerlendir(ref, p, cinsiyet, ay, deger[p]!)
      return { tarih: o.tarih.slice(0, 10), ay, deger, sonuc }
    })
}

/** a ile b persentilleri arasında kalan majör çizgi sayısı (işaretli: + yukarı, − aşağı). */
export function cizgiGecisi(pOnce: number, pSonra: number): number {
  const alt = Math.min(pOnce, pSonra), ust = Math.max(pOnce, pSonra)
  const n = MAJOR_PERSENTILLER.filter((c) => c > alt && c < ust).length
  return pSonra >= pOnce ? n : -n
}

export interface Kayma { param: BuyumeParametre; oncekiTarih: string; sonTarih: string; pOnce: number; pSon: number; cizgi: number }

/**
 * Persentil kayması: son ölçüm, daha önceki herhangi bir ölçüme göre ≥ 2 majör çizgi geçmişse (yukarı veya aşağı).
 * En büyük geçişi döndürür. Tanı değil, dikkat bayrağı — ilk aylardaki kanal değişimi fizyolojik olabilir, hekim yorumlar.
 * `baslangicAy`: yalnız bu yaştan (ay) sonraki ölçümler karşılaştırılır (stüdyo ve kohort 0 ile çağırır — değişmedi;
 * Ayşe'nin dosya cevabı KAYMA_BASLANGIC_AY ile çağırır — NOTYA-KADEMELI-01d).
 */
export function persentilKaymalari(satirlar: OlcumSatiri[], esik = 2, baslangicAy = 0): Kayma[] {
  const out: Kayma[] = []
  for (const p of ['kilo', 'boy', 'basCevresi', 'vki'] as BuyumeParametre[]) {
    const s = satirlar.filter((x) => x.sonuc[p] && x.ay >= baslangicAy)
    if (s.length < 2) continue
    const son = s[s.length - 1]
    let en: Kayma | null = null
    for (const o of s.slice(0, -1)) {
      const c = cizgiGecisi(o.sonuc[p]!.persentil, son.sonuc[p]!.persentil)
      if (Math.abs(c) >= esik && (!en || Math.abs(c) > Math.abs(en.cizgi))) {
        en = { param: p, oncekiTarih: o.tarih, sonTarih: son.tarih, pOnce: o.sonuc[p]!.persentil, pSon: son.sonuc[p]!.persentil, cizgi: c }
      }
    }
    if (en) out.push(en)
  }
  return out
}

/**
 * NOTYA-KADEMELI-01d (Dr. Gökhan via Kaan, 2026-10-02) — the percentile-crossing assessment of a chart answer starts
 * here: a large newborn settling toward the middle in the first months is physiological catch-down, so a birth value
 * is history, never the start of a drift. Months of age (decimal, as OlcumSatiri.ay).
 */
export const KAYMA_BASLANGIC_AY = 6

export type OlcumParametresi = 'kilo' | 'boy' | 'basCevresi'
export interface TutarsizOlcum {
  param: OlcumParametresi
  tarih: string
  deger: number
  persentil: number
  /** The validated measurement before it and the measurements after it that it does not fit. */
  onceki: { tarih: string; deger: number; persentil: number }
  sonrakiler: { tarih: string; deger: number; persentil: number }[]
}

/**
 * NOTYA-KADEMELI-01d — a measurement that does not fit its own series (live: 16,5 kg between 10,8 kg and 12,8 /
 * 13,3 kg). Rule, per parameter, among the measurements from KAYMA_BASLANGIC_AY on: a measurement that lies `esik`
 * (2) or more major percentile lines away from the validated measurement before it AND from the measurement after it,
 * in opposite directions, while those two neighbours are less than `esik` lines apart from each other. Such a value
 * is a recording or measuring error until verified; which of the three is wrong cannot be read from the record, the
 * odd one out is the one two others contradict. The first and the last measurement of the window have one neighbour
 * only and are never flagged by this rule. Not a diagnosis: the doctor verifies.
 */
export function tutarsizOlcumler(satirlar: OlcumSatiri[], esik = 2, baslangicAy = KAYMA_BASLANGIC_AY): TutarsizOlcum[] {
  const out: TutarsizOlcum[] = []
  for (const p of ['kilo', 'boy', 'basCevresi'] as const) {
    const s = satirlar.filter((x) => x.sonuc[p] && x.ay >= baslangicAy)
    const nokta = (x: OlcumSatiri) => ({ tarih: x.tarih, deger: x.deger[p]!, persentil: x.sonuc[p]!.persentil })
    let onceki = s[0]
    for (let i = 1; i < s.length - 1; i++) {
      const bu = s[i], sonraki = s[i + 1]
      const giris = cizgiGecisi(onceki.sonuc[p]!.persentil, bu.sonuc[p]!.persentil)
      const cikis = cizgiGecisi(bu.sonuc[p]!.persentil, sonraki.sonuc[p]!.persentil)
      const komsular = Math.abs(cizgiGecisi(onceki.sonuc[p]!.persentil, sonraki.sonuc[p]!.persentil))
      if (Math.abs(giris) >= esik && Math.abs(cikis) >= esik && Math.sign(giris) !== Math.sign(cikis) && komsular < esik) {
        out.push({ param: p, ...nokta(bu), onceki: nokta(onceki), sonrakiler: s.slice(i + 1).map(nokta) })
      } else {
        onceki = bu
      }
    }
  }
  return out.sort((a, b) => a.tarih.localeCompare(b.tarih))
}

/**
 * The series without the flagged values: the flagged parameter of that day is dropped, and the VKİ of that day with
 * it when it was computed from a flagged weight or height. Trend, drift, velocity and VKİ comparisons read this.
 */
export function dogrulanmisSatirlar(satirlar: OlcumSatiri[], tutarsiz: TutarsizOlcum[]): OlcumSatiri[] {
  if (!tutarsiz.length) return satirlar
  return satirlar.map((x) => {
    const atilan = tutarsiz.filter((t) => t.tarih === x.tarih).map((t) => t.param)
    if (!atilan.length) return x
    const deger = { ...x.deger }, sonuc = { ...x.sonuc }
    for (const p of atilan) { delete deger[p]; delete sonuc[p] }
    if (atilan.includes('kilo') || atilan.includes('boy')) { delete deger.vki; delete sonuc.vki }
    return { ...x, deger, sonuc }
  })
}

export interface BuyumeHizi { param: 'boy' | 'basCevresi' | 'kilo'; oncekiTarih: string; sonTarih: string; fark: number; aralikAy: number; yillik: number; kisaAralik: boolean }

/**
 * Büyüme hızı: son ölçüm ile ondan en az `minAy` önceki en yakın ölçüm arası farkın yıllığa çevrilmesi (cm/yıl, kg/yıl).
 * Hiç öyle bir ölçüm yoksa bir öncekiyle hesaplanır ve kisaAralik işaretlenir (kısa aralıkta ölçüm hatası büyür).
 * Normatif hız eşiği uygulanmaz — değer hekime gösterilir.
 */
export function buyumeHizlari(satirlar: OlcumSatiri[], minAy = 6): BuyumeHizi[] {
  const out: BuyumeHizi[] = []
  for (const p of ['boy', 'basCevresi', 'kilo'] as const) {
    const s = satirlar.filter((x) => x.deger[p] != null)
    if (s.length < 2) continue
    const son = s[s.length - 1]
    const oncekiler = s.slice(0, -1).filter((x) => son.ay - x.ay > 0.25)
    if (!oncekiler.length) continue
    const uzun = oncekiler.filter((x) => son.ay - x.ay >= minAy)
    const ref = uzun.length ? uzun[uzun.length - 1] : oncekiler[oncekiler.length - 1]
    const aralikAy = son.ay - ref.ay
    const fark = son.deger[p]! - ref.deger[p]!
    out.push({ param: p, oncekiTarih: ref.tarih, sonTarih: son.tarih, fark, aralikAy, yillik: (fark / aralikAy) * 12, kisaAralik: aralikAy < minAy })
  }
  return out
}

/** Z-skoru "+1,24" biçiminde. */
export function zMetni(z: number): string {
  const y = Math.round(z * 100) / 100
  return `${y > 0 ? '+' : y < 0 ? '−' : '±'}${Math.abs(y).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function persentilKisa(p: number): string {
  if (p < 1) return '<1.'
  if (p > 99) return '>99.'
  return `${Math.round(p)}.`
}

/** Hekimin panoya kopyalayacağı özet (nota otomatik yazılmaz). */
export function buyumeOzetMetni(ref: Referans, satirlar: OlcumSatiri[], kaymalar: Kayma[], hizlar: BuyumeHizi[]): string {
  const son = satirlar[satirlar.length - 1]
  if (!son) return ''
  const parca = (Object.keys(son.deger) as BuyumeParametre[]).map((p) => {
    const r = son.sonuc[p]
    const d = son.deger[p]!
    return r ? `${PARAM_AD[p]} ${d.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ${PARAM_BIRIM[p]} (${persentilKisa(r.persentil)} p, z ${zMetni(r.z)})` : `${PARAM_AD[p]} ${d} ${PARAM_BIRIM[p]} (referans kapsamı dışında)`
  })
  const ek: string[] = []
  for (const h of hizlar.filter((x) => x.param === 'boy')) ek.push(`boy hızı ${h.yillik.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} cm/yıl (${h.oncekiTarih} → ${h.sonTarih})`)
  for (const k of kaymalar) ek.push(`${PARAM_AD[k.param]} persentil kayması ${persentilKisa(k.pOnce)} → ${persentilKisa(k.pSon)} p (${Math.abs(k.cizgi)} çizgi ${k.cizgi < 0 ? 'aşağı' : 'yukarı'})`)
  return `Büyüme (${REFERANS_AD[ref]}, ${son.tarih}): ${parca.join('; ')}${ek.length ? `. ${ek.join('; ')}` : ''}. Taslak — hekim değerlendirir.`
}

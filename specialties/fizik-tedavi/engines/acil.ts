/**
 * FIZIK-TEDAVI-EXCEPTIONAL-01 — FTR kırmızı bayrak triyaj kapısı. SAF fonksiyon.
 * Cauda equina / kırık / enfeksiyon / ilerleyici nörolojik kayıp → "gecikme yok" bandı.
 * Portal mesajı ile yönetilmez. Tanı dili yoktur; yalnız eylem yönlendirmesi vardır.
 */
import type { Dipnot } from './fizik-tedavi'

export type AcilKod =
  | 'cauda_equina'
  | 'ilerleyici_guc'
  | 'kirik_suphe'
  | 'enfeksiyon'
  | 'malignite_bayrak'
  | 'travma_siddetli'

export interface AcilBayrak {
  kod: AcilKod
  ad: string
  eylem: string
  oncelik: 'hemen' | 'ayni_gun'
  dipnot: Dipnot
}

const KURALLAR: Array<{
  kod: AcilKod
  re: RegExp
  ad: string
  eylem: string
  oncelik: 'hemen' | 'ayni_gun'
  dipnot: Dipnot
}> = [
  {
    kod: 'cauda_equina',
    re: /eyer|eyer b[öo]lge|oturak b[öo]lge|idrar ka[çc][ıi]r|gaita ka[çc][ıi]r|idrar tutam|mesane|sfinkter|perine.*uyu[şs]|uyu[şs].*oturak/i,
    ad: 'Eyer bölgesi uyuşukluğu / idrar-gaita kaçırma (cauda şüphesi)',
    eylem: 'Hemen 112’yi arayın veya en yakın acile başvurun. Ayaktan FTR seansı beklenmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TFTRD', not: 'Cauda equina şüphesi — acil görüntüleme / cerrahi değerlendirme hekim/acil kararı' },
  },
  {
    kod: 'ilerleyici_guc',
    re: /ilerleyici.*(g[üu][çc]|kuvvet)|g[üu][çc] kayb[ıi].*ilerli|fel[çc].*ilerli|ayak d[üu][şs][üu]rme|foot.?drop|tek taraf.*(g[üu][çc]|kuvvet).*artan/i,
    ad: 'İlerleyici güç kaybı / ayak düşürme',
    eylem: 'Aynı gün acil değerlendirme. Ayaktan rutin seans ertelenir; hekim yönlendirir.',
    oncelik: 'hemen',
    dipnot: { ref: 'TFTRD', not: 'İlerleyici nörolojik kayıp — acil; tanı hekimindir' },
  },
  {
    kod: 'kirik_suphe',
    re: /k[ıi]r[ıi]k|fracture|y[üu]k bindiremi|basarak y[üu]r[üu]yem|kemik a[ğg]r[ıi].*travma|d[üu][şs]me.*[şs]iddetli a[ğg]r/i,
    ad: 'Kırık şüphesi / yük bindirememe',
    eylem: 'Aynı gün görüntüleme / acil değerlendirme. Mobilizasyon seansı kırık dışlanana kadar uygun olmayabilir.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_REHAB', not: 'Travma sonrası kırık şüphesi — görüntüleme kararı hekimindir' },
  },
  {
    kod: 'enfeksiyon',
    re: /ate[şs].*(bel|s[ıi]rt|eklem)|enfeksiyon|apse|k[ıi]zarıklık.*[şs]i[şs]lik.*ate[şs]|gece terleme.*bel a[ğg]r/i,
    ad: 'Ateş ile birlikte bel/sırt/eklem ağrısı (enfeksiyon şüphesi)',
    eylem: 'Aynı gün tıbbi değerlendirme. Enfeksiyon şüphesinde ısı/elektroterapi seansı uygun olmayabilir.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_REHAB', not: 'Spinal enfeksiyon şüphesi — acil; tanı hekimindir' },
  },
  {
    kod: 'malignite_bayrak',
    re: /a[çc][ıi]klanamayan kilo kayb|gece a[ğg]r[ıi]s[ıi].*uyan|kanser [öo]yk[üu]|bilinen kanser.*bel|gece.*istirahat.*a[ğg]r[ıi]/i,
    ad: 'Gece ağrısı / açıklanamayan kilo kaybı / bilinen kanser + bel ağrısı',
    eylem: 'Aynı gün hekim değerlendirmesi. Ayaktan seans planı hekim onayı olmadan ilerletilmez.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'TFTRD', not: 'Malignite kırmızı bayrakları — ileri tetkik hekim kararı' },
  },
  {
    kod: 'travma_siddetli',
    re: /y[üu]ksek enerjili travma|trafik kazas[ıi]|y[üu]ksekten d[üu][şs]|ciddi darbe.*(bel|boyun|sırt)/i,
    ad: 'Yüksek enerjili travma sonrası şiddetli ağrı',
    eylem: 'Hemen 112 veya en yakın acil. Stabilizasyon ve görüntüleme ayaktan seansın önündedir.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_REHAB', not: 'Yüksek enerjili travma — acil stabilizasyon' },
  },
]

function trKucuk(metin: string): string {
  return metin.replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr-TR')
}

export function acilTara(metinler: Array<string | null | undefined>, hekimIsaretleri: AcilKod[] = []): AcilBayrak[] {
  const metin = trKucuk(metinler.filter(Boolean).join(' \n '))
  const bulunan = new Map<AcilKod, AcilBayrak>()
  for (const k of KURALLAR) {
    if (k.re.test(metin) || hekimIsaretleri.includes(k.kod)) {
      bulunan.set(k.kod, { kod: k.kod, ad: k.ad, eylem: k.eylem, oncelik: k.oncelik, dipnot: k.dipnot })
    }
  }
  return [...bulunan.values()].sort((a, b) => (a.oncelik === b.oncelik ? 0 : a.oncelik === 'hemen' ? -1 : 1))
}

export const ACIL_KODLARI: Array<{ kod: AcilKod; ad: string }> = KURALLAR.map((k) => ({ kod: k.kod, ad: k.ad }))

export const HASTA_ACIL_METNI =
  'Ani idrar veya gaita kaçırma, oturak bölgesinde uyuşukluk, ilerleyici güç kaybı, ateşle birlikte bel ağrısı veya ciddi travma sonrası şiddetli ağrı varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts acilBelirtilerFtr ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Eyer / oturak bölgesinde uyuşukluk veya idrar-gaita kaçırma', kod: 'cauda_equina' },
  { etiket: 'İlerleyici güç kaybı veya ayak düşürme', kod: 'ilerleyici_guc' },
  { etiket: 'Travma sonrası yük bindirememe / kırık şüphesi', kod: 'kirik_suphe' },
  { etiket: 'Ateş ile birlikte bel, sırt veya eklem ağrısı', kod: 'enfeksiyon' },
  { etiket: 'Gece ağrısı, açıklanamayan kilo kaybı veya bilinen kanser ile bel ağrısı', kod: 'malignite_bayrak' },
  { etiket: 'Yüksek enerjili travma (trafik, yüksekten düşme) sonrası şiddetli ağrı', kod: 'travma_siddetli' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Belirtilerin başlangıç zamanı kaydedildi',
  'İdrar / gaita / eyer duyusu sorgulandı',
  'Güç / duyu / refleks ayrıştırıldı',
  'Travma / ateş / kanser öyküsü sorgulandı',
  'Hastaya / yakına 112 yolu anlatıldı',
  'Ayaktan seans yerine acil yönlendirme kararı hekim tarafından kilitlemdi',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen' || b.oncelik === 'ayni_gun')
}

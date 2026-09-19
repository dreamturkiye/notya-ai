/**
 * BEYIN-CERRAHISI-EXCEPTIONAL-01 — Nöroşirürji acil kırmızı bayrak. SAF fonksiyon.
 * Ani bilinç kaybı · fokal defisit · yara sızıntısı → 112. Tanı dili yok.
 */
import type { Dipnot } from './beyin'

export type AcilKod =
  | 'bilinc_kaybi'
  | 'yeni_fokal_defisit'
  | 'siddetli_bas_agrisi_kusma'
  | 'yara_sizinti_ates'
  | 'konusma_bozuklugu_ani'
  | 'idrara_gaita_tutamama'

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
    kod: 'bilinc_kaybi',
    re: /bilin[çc].{0,20}(kayb|k[öo]t[üu]|bozul)|ani bay[ıi]l|glasgow.{0,10}d[üu][şs]|stupor|koma/i,
    ad: 'Ani bilinç kaybı / kötüleşme',
    eylem: 'Hemen 112’yi arayın veya en yakın acile başvurun. Portal mesajı ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_KAFA', not: 'Bilinç acili — tanı hekim/acil' },
  },
  {
    kod: 'yeni_fokal_defisit',
    re: /yeni.{0,20}(g[üu][çc]s[üu]z|fel[çc]|hemiparezi)|ani.{0,20}(kol|bacak).{0,20}g[üu][çc]|fokal defisit/i,
    ad: 'Yeni fokal nörolojik defisit',
    eylem: 'Hemen 112 veya en yakın acil. Ayaktan randevu ile beklenmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TND_NOROS', not: 'Yeni fokal bulgu — acil değerlendirme' },
  },
  {
    kod: 'siddetli_bas_agrisi_kusma',
    re: /[şs]iddetli ba[şs] a[ğg]r[ıi]|ba[şs] a[ğg]r[ıi].{0,30}kusma|thunderclap|ani.{0,15}ba[şs] a[ğg]r/i,
    ad: 'Şiddetli baş ağrısı ± kusma',
    eylem: 'Hemen 112 veya en yakın acil. Tanı Notya yazmaz.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_KAFA', not: 'Ciddi baş ağrısı — acil' },
  },
  {
    kod: 'yara_sizinti_ates',
    re: /yara.{0,20}(s[ıi]z[ıi]nt[ıi]|ak[ıi]nt[ıi]|enfeksiyon)|cerrahi.{0,20}ate[şs]|dren.{0,15}bol|yara a[çc][ıi]lm/i,
    ad: 'Cerrahi yara sızıntısı / ateş',
    eylem: 'Aynı gün acil değerlendirme veya 112. Antibiyotik / doz hekim kararıdır.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'TND_NOROS', not: 'Post-op yara — acil değerlendirme; doz hekimin' },
  },
  {
    kod: 'konusma_bozuklugu_ani',
    re: /ani.{0,20}konu[şs]ma|afazi|kelime bulamama|dizartri.{0,15}ani/i,
    ad: 'Ani konuşma bozukluğu',
    eylem: 'Hemen 112. Portal mesajı yeterli değildir.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_KAFA', not: 'Ani konuşma — acil' },
  },
  {
    kod: 'idrara_gaita_tutamama',
    re: /idrar tutamama|gaita tutamama|cauda|ani.{0,20}(idrar|gaita).{0,20}(ka[çc]|tutam)/i,
    ad: 'Ani idrar / gaita tutamama',
    eylem: 'Hemen 112 veya en yakın acil (spinal acil şüphesi).',
    oncelik: 'hemen',
    dipnot: { ref: 'TND_NOROS', not: 'Spinal acil — yönlendirme hekim/acil' },
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
  'Ani bilinç kaybı, yeni güçsüzlük, şiddetli baş ağrısı ve kusma, yara sızıntısı / ateş veya ani konuşma bozukluğunda portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts acilBelirtilerBeyin ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Ani bilinç kaybı veya belirgin bilinç kötüleşmesi', kod: 'bilinc_kaybi' },
  { etiket: 'Yeni kol/bacak güçsüzlüğü veya felç hissi', kod: 'yeni_fokal_defisit' },
  { etiket: 'Şiddetli baş ağrısı ve kusma', kod: 'siddetli_bas_agrisi_kusma' },
  { etiket: 'Cerrahi yara sızıntısı veya ateş', kod: 'yara_sizinti_ates' },
  { etiket: 'Ani konuşma bozukluğu', kod: 'konusma_bozuklugu_ani' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Belirtilerin başlangıç saati kaydedildi',
  'Bilinç / pupil / fokal bulgu değerlendirildi (mümkünse)',
  'Son ameliyat / işlem tarihi sorgulandı (OR HIS yok)',
  'Hastaya / yakına 112 yolu anlatıldı',
  'Ayaktan randevu yerine acil yönlendirme kararı hekim tarafından kilitlendi',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}

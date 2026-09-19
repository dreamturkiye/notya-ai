/**
 * ANESTEZI-EXCEPTIONAL-01 — Anestezi acil kırmızı bayrak. SAF fonksiyon.
 * Zor hava yolu · anafilaksi · MH · aspirasyon → 112. Tanı / doz dili yok.
 */
import type { Dipnot } from './anestezi'

export type AcilKod =
  | 'zor_hava_yolu_acil'
  | 'anafilaksi_alerji'
  | 'malign_hipertermi'
  | 'aspirasyon_riski'
  | 'ani_solunum_yetmezligi'
  | 'peri_kardiyak_olay'

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
    kod: 'zor_hava_yolu_acil',
    re: /zor havayolu|zor hava yolu|can.?t.?intubat|failed airway|cannot.?ventilat/i,
    ad: 'Zor hava yolu / ventilasyon şüphesi',
    eylem: 'Hemen 112’yi arayın veya en yakın acile başvurun. Portal mesajı ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TARD', not: 'Zor hava yolu acili — tanı hekim/acil' },
  },
  {
    kod: 'anafilaksi_alerji',
    re: /anafilaksi|anafilaktik|ciddi alerji|anestezi.{0,20}alerji|ila[çc].{0,15}alerji.{0,15}(ciddi|[şs]ok)/i,
    ad: 'Anafilaksi / ciddi ilaç alerjisi',
    eylem: 'Hemen 112 veya en yakın acil. Doz / adrenalin şeması hekim/acil kararıdır.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_ANESTEZI', not: 'Anafilaksi — acil; doz hekimin' },
  },
  {
    kod: 'malign_hipertermi',
    re: /malign hipertermi|\bmh\b|hipertermi.{0,20}anestezi|aile.{0,20}malign/i,
    ad: 'Malign hipertermi şüphesi / aile öyküsü',
    eylem: 'Hemen 112 veya en yakın acil. Tetikleyici ajan / doz Notya yazmaz.',
    oncelik: 'hemen',
    dipnot: { ref: 'TARD', not: 'MH şüphesi — acil; doz hekimin' },
  },
  {
    kod: 'aspirasyon_riski',
    re: /aspirasyon|kusma.{0,20}(hava|akci[ğg]er)|a[çc]l[ıi]k.{0,15}ihlal|dolu mide/i,
    ad: 'Aspirasyon riski / açlık ihlali',
    eylem: 'Aynı gün acil değerlendirme veya 112. İşlem planı hekimdedir.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'SB_ANESTEZI', not: 'Aspirasyon riski — değerlendirme hekimde' },
  },
  {
    kod: 'ani_solunum_yetmezligi',
    re: /ani.{0,20}solunum|nefes.{0,15}alam[ıi]|hipoksi|desat[üu]rasyon|solunum yetmez/i,
    ad: 'Ani solunum yetmezliği / hipoksi',
    eylem: 'Hemen 112. Portal mesajı yeterli değildir.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_ANESTEZI', not: 'Solunum acili' },
  },
  {
    kod: 'peri_kardiyak_olay',
    re: /g[öo][ğg][üu]s a[ğg]r[ıi].{0,20}(anestezi|sedasyon)|ani.{0,15}bay[ıi]l|kardiyak arrest|aritmi.{0,15}ciddi/i,
    ad: 'Perioperatif kardiyak olay şüphesi',
    eylem: 'Hemen 112 veya en yakın acil.',
    oncelik: 'hemen',
    dipnot: { ref: 'TARD', not: 'Kardiyak acil — yönlendirme hekim/acil' },
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
  'Zor nefes alma, ciddi alerji / şişlik, yüksek ateş ve kas sertliği, kusma sonrası nefes darlığı veya ani göğüs ağrısında portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts acilBelirtilerAnestezi ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Zor nefes alma veya boğulma hissi', kod: 'zor_hava_yolu_acil' },
  { etiket: 'Ciddi ilaç alerjisi / şişlik / döküntü (şu an)', kod: 'anafilaksi_alerji' },
  { etiket: 'Yüksek ateş ve kas sertliği (anestezi sonrası şüphe)', kod: 'malign_hipertermi' },
  { etiket: 'Kusma sonrası nefes darlığı / aspirasyon şüphesi', kod: 'aspirasyon_riski' },
  { etiket: 'Ani göğüs ağrısı veya bayılma', kod: 'peri_kardiyak_olay' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Belirtilerin başlangıç saati kaydedildi',
  'Hava yolu / solunum / dolaşım değerlendirildi (mümkünse)',
  'Alerji ve ilaç listesi sorgulandı (doz yazılmaz)',
  'Hastaya / yakına 112 yolu anlatıldı',
  'Ayaktan randevu yerine acil yönlendirme kararı hekim tarafından kilitlendi',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}

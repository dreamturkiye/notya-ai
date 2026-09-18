/**
 * DAH-EXCEPTIONAL-01 — Intake / şikâyet kırmızı bayrak kapısı. Pure.
 * Göğüs ağrısı, nefes darlığı, nöro, hipoglisemi, kanama — "gecikme yok" bandı.
 * Portal mesajı ile yönetilmez. Tanı dili yok; eylem yönlendirmesi var.
 */
import type { Dipnot } from './dahiliye'

export type AcilKod =
  | 'gogus_agrisi'
  | 'nefes_darligi'
  | 'norolojik'
  | 'hipoglisemi'
  | 'ciddi_kanama'
  | 'bayilma'

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
    kod: 'gogus_agrisi',
    re: /göğüs ağr|gogus agr|göğüste baskı|goguste baski|göğüs sıkış|kalp ağrısı|angina/i,
    ad: 'Göğüs ağrısı / baskı',
    eylem: 'Beklemeden 112 veya en yakın acile başvurun. Portal mesajı beklemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'TIHUD2023', not: 'Akut koroner sendrom şüphesi — ofiste gecikme yok' },
  },
  {
    kod: 'nefes_darligi',
    re: /nefes darlığı|nefes darligi|dispne|nefes alam|solunum sıkınt|solunum sikint/i,
    ad: 'Ani / şiddetli nefes darlığı',
    eylem: 'Şiddetliyse 112; aksi halde aynı gün değerlendirme. Portal mesajı yeterli değildir.',
    oncelik: 'hemen',
    dipnot: { ref: 'TIHUD2023', not: 'Akut dispne — PE / KY / pnömoni ayırıcı tanısı hekimde' },
  },
  {
    kod: 'norolojik',
    re: /yüz kayması|yüz düş|konuşma bozuk|kol.*güçsüz|bacak.*güçsüz|ani felç|inme|stroke|çift görme ani/i,
    ad: 'Ani nörolojik bulgu (inme şüphesi)',
    eylem: 'HEMEN 112 — zaman kritiktir. Portal veya randevu beklemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'HARRISON', not: 'İnme / TIA — acil değerlendirme' },
  },
  {
    kod: 'hipoglisemi',
    re: /hipoglisemi|kan şekeri düşük|şeker düştü|hipo atak|bilinç bulanık.*şeker/i,
    ad: 'Ciddi hipoglisemi şüphesi',
    eylem: 'Bilinç bozukluğu varsa 112; aksi halde hemen şeker ölçümü ve hekim protokolü.',
    oncelik: 'hemen',
    dipnot: { ref: 'TEMD_DM2026', not: 'Ciddi hipoglisemi — acil müdahale' },
  },
  {
    kod: 'ciddi_kanama',
    re: /ciddi kanama|bol kanama|kan kusma|siyah dışkı|melena|hematemez|idrarda bol kan/i,
    ad: 'Ciddi kanama',
    eylem: 'Beklemeden 112 veya acil. Antikoagülan kullanıyorsanız bunu söyleyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'HARRISON', not: 'Majör kanama — acil değerlendirme' },
  },
  {
    kod: 'bayilma',
    re: /bayılma|bayilma|senkop|bilinç kaybı|bilinc kaybi|birden yere yığıl/i,
    ad: 'Bayılma / senkop',
    eylem: 'Tekrarlayan veya göğüs ağrısı / nefes darlığı ile birlikteyse 112; aksi halde aynı gün değerlendirme.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'TIHUD2023', not: 'Senkop — kardiyak neden ayırıcı tanısı' },
  },
]

export function acilTara(metinler: Array<string | null | undefined>, hekimIsaretleri: AcilKod[] = []): AcilBayrak[] {
  const metin = metinler.filter(Boolean).join(' \n ')
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
  'Göğüs ağrısı, ani nefes darlığı, yüz kayması / konuşma bozukluğu, bayılma, ciddi kanama veya şiddetli hipoglisemi olursa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — bransSorulari `acilBelirtilerDahiliye` ile birebir aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Göğüs ağrısı veya baskı', kod: 'gogus_agrisi' },
  { etiket: 'Ani / şiddetli nefes darlığı', kod: 'nefes_darligi' },
  { etiket: 'Yüz kayması, konuşma bozukluğu veya ani güçsüzlük', kod: 'norolojik' },
  { etiket: 'Bayılma / bilinç kaybı', kod: 'bayilma' },
  { etiket: 'Ciddi kanama (kusma, siyah dışkı, bol idrar kanı)', kod: 'ciddi_kanama' },
  { etiket: 'Şiddetli hipoglisemi (şeker düşmesi) şüphesi', kod: 'hipoglisemi' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

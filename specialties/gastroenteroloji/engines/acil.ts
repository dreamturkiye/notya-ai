/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — GI acil kırmızı bayrak. SAF fonksiyon.
 * GI kanama · akut karın · pankreatit · ensefalopati → 112. Tanı dili yok; eylem yönlendirmesi var.
 */
import type { Dipnot } from './gastroenteroloji'

export type AcilKod =
  | 'gi_kanama'
  | 'akut_karin'
  | 'akut_pankreatit'
  | 'hepatik_ensefalopati'
  | 'yutma_tikama'

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
    kod: 'gi_kanama',
    re: /hematemez|melena|hematokezya|kanl[ıi] kusma|siyah d[ıi][sş]k[ıi]|kanama[^.]{0,20}(mide|bağırsak|bagirsak|rektum)|varis kanama/i,
    ad: 'Aktif GI kanama şüphesi',
    eylem: 'Hemen 112’yi arayın veya en yakın acile başvurun. Aktif GI kanama ayaktan randevu ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_GI', not: 'GI kanama — acil; tanı hekim/acil' },
  },
  {
    kod: 'akut_karin',
    re: /akut kar[ıi]n|peritonit|sert kar[ıi]n|ani [şs]iddetli kar[ıi]n a[ğg]r[ıi]|defans[^.]{0,20}kar[ıi]n|rebound/i,
    ad: 'Akut karın şüphesi',
    eylem: 'Hemen 112’yi arayın. Akut karın portal mesajı ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_GI', not: 'Akut karın — acil cerrahi/acil değerlendirme' },
  },
  {
    kod: 'akut_pankreatit',
    re: /pankreatit|epigastrik[^.]{0,20}(kusma|kemer|belt)|[şs]iddetli epigastrik|lipaz[^.]{0,15}y[üu]ksek/i,
    ad: 'Akut pankreatit şüphesi',
    eylem: 'Aynı gün acil değerlendirme veya 112. Ayaktan randevu yeterli olmayabilir.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'TGD_ENDO', not: 'Akut pankreatit — acil değerlendirme kararı hekimin' },
  },
  {
    kod: 'hepatik_ensefalopati',
    re: /ensefalopati|flapping|asteriksis|siroz[^.]{0,30}(bilin[çc]|konf[üu]zyon)|karaci[ğg]er[^.]{0,20}bilin[çc]/i,
    ad: 'Hepatik ensefalopati şüphesi',
    eylem: 'Hemen 112’yi arayın. Hepatik ensefalopati ayaktan izlem ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TKAD_HBV', not: 'Hepatik ensefalopati — acil; tanı hekim/acil' },
  },
  {
    kod: 'yutma_tikama',
    re: /yutma t[ıi]kan|bolus[^.]{0,15}tak[ıi]l|yemek[^.]{0,15}tak[ıi]ld[ıi]|yutam[ıi]yor|yutma g[üu][çc]l[üu][ğg][üu][^.]{0,20}acil/i,
    ad: 'Akut yutma tıkanması / bolus',
    eylem: 'Aynı gün acil değerlendirme. Endoskopik müdahale kararı hekim/acilindir; Notya işlem planı yazmaz.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'TGD_ENDO', not: 'Akut yutma tıkanması — acil değerlendirme' },
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
  'Kanlı kusma, siyah dışkı, ani şiddetli karın ağrısı, bilinç bulanıklığı veya yutamama varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts acilBelirtilerGastro ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Kanlı kusma veya siyah / kanlı dışkı', kod: 'gi_kanama' },
  { etiket: 'Ani şiddetli karın ağrısı / sert karın', kod: 'akut_karin' },
  { etiket: 'Şiddetli epigastrik ağrı ve kusma (pankreatit şüphesi)', kod: 'akut_pankreatit' },
  { etiket: 'Bilinç bulanıklığı / konfüzyon (karaciğer hastasında)', kod: 'hepatik_ensefalopati' },
  { etiket: 'Yemek takıldı / yutamıyorum', kod: 'yutma_tikama' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Belirtilerin başlangıç saati kaydedildi',
  'Hemodinamik stabilite / bilinç düzeyi değerlendirildi (mümkünse)',
  'Antikoagülan / NSAID / alkol kullanımı sorgulandı (doz Notya yazmaz)',
  'Hastaya / yakına 112 yolu anlatıldı',
  'Ayaktan randevu yerine acil yönlendirme kararı hekim tarafından kilitlendi',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}

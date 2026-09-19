/**
 * ENDOKRINOLOJI-EXCEPTIONAL-01 — Endokrin acil kırmızı bayrak. SAF fonksiyon.
 * Ciddi hipoglisemi · DKA şüphesi · tiroid fırtınası → 112. Tanı dili yok; eylem yönlendirmesi var.
 */
import type { Dipnot } from './endokrinoloji'

export type AcilKod =
  | 'ciddi_hipoglisemi'
  | 'dka_suphesi'
  | 'tiroid_firtinasi'
  | 'adrenal_kriz'
  | 'siddetli_hiperglisemi'

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
    kod: 'ciddi_hipoglisemi',
    re: /hipoglisemi|kan [şs]eker[^.]{0,20}(d[üu][şs][üu]k|40|50)|bilin[çc][^.]{0,20}(bulan|kayb)|[şs]eker[^.]{0,15}n[öo]bet|glukagon/i,
    ad: 'Ciddi hipoglisemi / bilinç değişikliği',
    eylem: 'Hemen 112’yi arayın. Ciddi hipoglisemide ayaktan randevu beklenmez; glukagon / acil müdahale hekim/acil kararıdır.',
    oncelik: 'hemen',
    dipnot: { ref: 'TEMD_DM', not: 'Ciddi hipoglisemi — acil; doz ve tedavi hekim/acil' },
  },
  {
    kod: 'dka_suphesi',
    re: /ketoasid|dka\b|keton|kusma[^.]{0,30}(nefes|bilin[çc])|derin nefes|fruity|aseton/i,
    ad: 'Diyabetik ketoasidoz şüphesi',
    eylem: 'Hemen 112’yi arayın veya en yakın acile başvurun. DKA şüphesi portal mesajı ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TEMD_DM', not: 'DKA — acil değerlendirme; tanı hekim/acil' },
  },
  {
    kod: 'tiroid_firtinasi',
    re: /tiroid f[ıi]rt[ıi]n|tiroksik kriz|ate[şs][^.]{0,20}(titreme|ta[şs]ikardi|ajitasyon).{0,40}tiroid|ajitasyon[^.]{0,30}tiroid/i,
    ad: 'Tiroid fırtınası şüphesi',
    eylem: 'Hemen 112’yi arayın. Tiroid fırtınası ayaktan izlem ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TEMD_TIROID', not: 'Tiroid fırtınası — acil; tanı hekim/acil' },
  },
  {
    kod: 'adrenal_kriz',
    re: /adrenal kriz|akut adrenal|addison[^.]{0,20}kriz|kortizol[^.]{0,20}acil|hipotansiyon[^.]{0,30}adrenal/i,
    ad: 'Adrenal kriz şüphesi',
    eylem: 'Hemen 112’yi arayın. Adrenal kriz şüphesinde stres dozu ve acil müdahale hekim/acil kararıdır; Notya doz yazmaz.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_ENDO', not: 'Adrenal kriz — acil; doz hekim/acil' },
  },
  {
    kod: 'siddetli_hiperglisemi',
    re: /kan [şs]eker[^.]{0,20}(400|500|600)|[şs]iddetli hiperglisemi|hiperosmolar|hhs\b/i,
    ad: 'Şiddetli hiperglisemi / hiperosmolar şüphe',
    eylem: 'Aynı gün acil değerlendirme veya 112. Ayaktan randevu yeterli olmayabilir.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'TEMD_DM', not: 'Şiddetli hiperglisemi — acil değerlendirme kararı hekimin' },
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
  'Ciddi hipoglisemi (bilinç bulanıklığı, nöbet), kusma ile birlikte derin nefes veya bilinç değişikliği, tiroid fırtınası belirtileri veya ani aşırı halsizlik / tansiyon düşüklüğü varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts acilBelirtilerEndo ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Ciddi hipoglisemi veya bilinç bulanıklığı', kod: 'ciddi_hipoglisemi' },
  { etiket: 'Kusma, derin nefes veya bilinç değişikliği (ketoasidoz şüphesi)', kod: 'dka_suphesi' },
  { etiket: 'Ateş, çarpıntı ve aşırı ajitasyon (tiroid fırtınası şüphesi)', kod: 'tiroid_firtinasi' },
  { etiket: 'Ani halsizlik / tansiyon düşüklüğü (adrenal kriz şüphesi)', kod: 'adrenal_kriz' },
  { etiket: 'Çok yüksek kan şekeri ile aşırı susama / bilinç bulanıklığı', kod: 'siddetli_hiperglisemi' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Belirtilerin başlangıç saati kaydedildi',
  'Kan şekeri / bilinç düzeyi değerlendirildi (mümkünse)',
  'İnsülin / oral antidiyabetik / levotiroksin kullanımı sorgulandı (doz Notya yazmaz)',
  'Hastaya / yakına 112 yolu anlatıldı',
  'Ayaktan randevu yerine acil yönlendirme kararı hekim tarafından kilitlendi',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}

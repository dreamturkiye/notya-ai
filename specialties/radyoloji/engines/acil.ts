/**
 * RADYOLOJI-EXCEPTIONAL-01 — Radyoloji acil kırmızı bayrak. SAF fonksiyon.
 * Kontrast reaksiyon · gebelik+iyonizan · kritik bulgu iletişimi → 112 / klinisyen.
 * Tanı dili yok; AI bulgu yok.
 */
import type { Dipnot } from './radyoloji'

export type AcilKod =
  | 'kontrast_reaksiyon'
  | 'gebelik_iyonizan'
  | 'kritik_bulgu_ileti'
  | 'solunum_sikinti_cekimi'
  | 'ani_norolojik_bulgu'

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
    kod: 'kontrast_reaksiyon',
    re: /kontrast.{0,25}(alerji|reaksiyon|anafilaksi|[şs]ok)|iyot.{0,15}alerji|gadolinyum.{0,15}reaksiyon/i,
    ad: 'Ciddi kontrast reaksiyonu',
    eylem: 'Hemen 112 veya acil. Kontrast protokolü hekim/acil; doz Notya yazmaz.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_RAD', not: 'Kontrast acili — tanı/doz hekim' },
  },
  {
    kod: 'gebelik_iyonizan',
    re: /gebe.{0,20}(bt|grafi|x-?ray|iyonizan|radyasyon)|hamile.{0,20}(bt|grafi)|gebelik.{0,15}[çc]ekim/i,
    ad: 'Gebelik + iyonizan çekim şüphesi',
    eylem: 'Çekimi durdurun / hekim onayına bağlayın. Portal mesajı yeterli değildir.',
    oncelik: 'hemen',
    dipnot: { ref: 'TAEK', not: 'Gebelik radyasyon güvenliği — hekim' },
  },
  {
    kod: 'kritik_bulgu_ileti',
    re: /kritik bulgu|acil bildirim|pn[öo]motoraks|intrakranial kanama|disseksiyon|pulmoner embol/i,
    ad: 'Kritik bulgu — klinisyen bildirimi',
    eylem: 'İsteyen klinisyeni hemen bilgilendirin; bildirim kontrol listesini kilitleyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'TRD', not: 'Kritik bulgu iletişimi — tanı AI değil' },
  },
  {
    kod: 'solunum_sikinti_cekimi',
    re: /[çc]ekim.{0,20}(nefes darl|solunum s[ıi]k|hipoksi)|kontrast.{0,15}nefes/i,
    ad: 'Çekim sırasında solunum sıkıntısı',
    eylem: 'Çekimi durdurun; 112 / acil değerlendirme.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_RAD', not: 'Çekim güvenliği — acil' },
  },
  {
    kod: 'ani_norolojik_bulgu',
    re: /ani.{0,15}(bilin[çc]|fel[çc]|konu[şs]ma)|[çc]ekim.{0,20}n[öo]ro/i,
    ad: 'Çekim sırasında ani nörolojik değişiklik',
    eylem: 'Hemen 112. Portal mesajı ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_RAD', not: 'Nöro acil — yönlendirme hekim/acil' },
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
  'Ciddi kontrast reaksiyonu, gebelikte iyonizan çekim şüphesi veya çekim sırasında ani solunum / bilinç değişikliğinde portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts acilBelirtilerRadyo ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Daha önce ciddi kontrast reaksiyonu / anafilaksi', kod: 'kontrast_reaksiyon' },
  { etiket: 'Gebelik olasılığı var ve iyonizan çekim planlanıyor', kod: 'gebelik_iyonizan' },
  { etiket: 'Çekim sırasında nefes darlığı veya bilinç değişikliği', kod: 'solunum_sikinti_cekimi' },
  { etiket: 'Doktorunuz kritik bulgu için acil iletişim istedi', kod: 'kritik_bulgu_ileti' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Belirtilerin başlangıç saati kaydedildi',
  'Kontrast / gebelik / metal sorgusu yapıldı',
  'Kritik bulgu varsa klinisyen bildirimi başlatıldı',
  'Hastaya / yakına 112 yolu anlatıldı',
  'Ayaktan randevu yerine acil yönlendirme kararı hekim tarafından kilitlendi',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}

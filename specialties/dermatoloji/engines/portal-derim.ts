/**
 * DERM-EXCEPTIONAL-01 — Sağlığım › Derim hatırlatmaları. Pure.
 *
 * Her satır bir HEKİM eyleminden doğar (işlem kaydı, izotretinoin başlangıcı, yama serisi, fototerapi seansı,
 * TBSE tarihi) ve hasta yüzüne çevrilir. Hasta yüzünde tanı, morfoloji, skor (PASI/EASI/DLQI/SALT) ve doz
 * (mg, mg/kg, J/cm²) YOKTUR — .cursor/skills/specialty-hasta-portali › Dermatoloji.
 *
 * Doktor tarafındaki görev metni klinik dildedir ("MELANOM ŞÜPHESİ: eksizyonel biyopsi planı…",
 * "İzotretinoin: aylık β-hCG (Lab)"). Bu motor o metni hastaya TAŞIMAZ: görev kodundan hasta-güvenli
 * sabit bir başlık seçer. Kod tanınmazsa satır nötr "Kontrol randevusu" olur — asla ham metin.
 */
import { addDays, diffDays } from './dates'
import { annualTbseDue } from './phototherapy-log'
import { patchStatus } from './patch-calendar'
import type { PatchCourse } from '../schema'

export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'
export type DerimHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

/** "yaklaşıyor" penceresi — bundan yakın bir tarih hastaya öne çıkarılır. */
export const YAKLASIYOR_GUN = 7

/** Yıllık TBSE (tüm vücut deri muayenesi) hatırlatmasının hasta-güvenli başlığı. */
export const TBSE_BASLIK = 'Tüm vücut deri kontrolü randevusu'

/** Görev kodu → hasta yüzü başlığı. Klinik gerekçe (tanı, şüphe, ilaç adı) hastaya yazılmaz. */
const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^izo_bhcg/, 'Aylık kan testi (gebelik testi) — tedavi güvenliği için'],
  [/^sutur_/, 'Dikiş alma randevusu'],
  [/^yara_/, 'Yara bakımı kontrolü'],
  [/^pat_/, 'Biyopsi sonucu görüşmesi'],
  [/^melanom_/, 'Öncelikli kontrol randevusu — muayenehane sizi arayacak'],
  [/^ped_/, 'Kontrol randevusu'],
  [/^tbse/, TBSE_BASLIK],
  [/^ft_|fototerapi/, 'Fototerapi seansı'],
  [/^yama/, 'Yama testi okuması'],
  [/^biyolojik|^sistemik/, 'Tedavi güvenlik kan kontrolü'],
  [/^kontrol|^foto/, 'Kontrol randevusu'],
]

/** Hastaya gidecek her başlık bu listeden gelir; serbest metin kullanılmaz. */
export function gorevBasligi(kod: string | null | undefined): string {
  const k = String(kod || '').toLocaleLowerCase('tr-TR')
  for (const [re, ad] of GOREV_BASLIK) if (re.test(k)) return ad
  return 'Kontrol randevusu'
}

const ISO = /^\d{4}-\d{2}-\d{2}$/

export function hatirlatmaDurumu(due: string | null, bugun: string): HatirlatmaDurum {
  if (!due || !ISO.test(due) || !ISO.test(bugun)) return 'planli'
  const fark = diffDays(due, bugun)
  if (fark < 0) return 'gecikti'
  return fark <= YAKLASIYOR_GUN ? 'yaklasiyor' : 'planli'
}

/**
 * Seans aralığı hastanın KENDİ kayıtlı seanslarından okunur — takvim uydurulmaz.
 * En az iki seans gerekir; makul olmayan aralıklar (1 günden kısa / 14 günden uzun) hatırlatma doğurmaz.
 */
export const SEANS_ARALIK_MIN = 1
export const SEANS_ARALIK_MAX = 14

export function seansAraligi(tarihlerYeniDenEskiye: string[]): number | null {
  const t = tarihlerYeniDenEskiye.filter((x) => ISO.test(String(x || '').slice(0, 10))).map((x) => x.slice(0, 10)).slice(0, 6)
  if (t.length < 2) return null
  const farklar: number[] = []
  for (let i = 0; i < t.length - 1; i++) {
    const d = diffDays(t[i], t[i + 1])
    if (d >= SEANS_ARALIK_MIN && d <= SEANS_ARALIK_MAX) farklar.push(d)
  }
  if (!farklar.length) return null
  farklar.sort((a, b) => a - b)
  return farklar[Math.floor(farklar.length / 2)]
}

export interface DerimGirdi {
  bugun: string
  /** derm_gorevleri (durum='acik') — yalnız kod + due kullanılır, doktor metni değil. */
  gorevler: Array<{ kod: string; due: string | null }>
  /** derm_ilac_guvenlik (aktif) — aylık β-hCG vadesi hekim izotretinoin başlattığında doğar. */
  ilacGuvenlik: Array<{ ilac: string; aylikDue: string | null }>
  /** derm_yama_kurslari — D2/D4 okuma takvimi hekimin uygulama tarihinden deterministik. */
  yamaKurslari: PatchCourse[]
  /** derm_fototerapi_seanslari — en son seans tarihi ve kliniğin kendi kayıtlı aralığı (seansAraligi). */
  sonFototerapiSeansi: string | null
  fototerapiAralikGun: number | null
  /** hasta_derm.last_tbse_iso */
  sonTbse: string | null
  /** hasta_derm.next_photo_iso — hekimin planladığı kontrol fotoğrafı günü. */
  sonrakiFoto: string | null
}

const sirala = (a: DerimHatirlatma, b: DerimHatirlatma) => {
  if (!a.due) return b.due ? 1 : 0
  if (!b.due) return -1
  return a.due.localeCompare(b.due)
}

/**
 * Hasta-güvenli hatırlatma listesi: β-hCG vadesi, fototerapi seansı, yama D2/D4, yara/dikiş/biyopsi kontrolü,
 * TBSE ve kontrol fotoğrafı. Aynı başlık iki kez yazılmaz (en erken tarih kazanır).
 */
export function derimHatirlatmalari(g: DerimGirdi): DerimHatirlatma[] {
  const cikti = new Map<string, DerimHatirlatma>()
  const ekle = (ad: string, ham: string | null) => {
    const due = ham && ISO.test(ham.slice(0, 10)) ? ham.slice(0, 10) : null
    const onceki = cikti.get(ad)
    if (onceki && (!due || (onceki.due && onceki.due <= due))) return
    cikti.set(ad, { ad, due, durum: hatirlatmaDurumu(due, g.bugun) })
  }

  for (const gorev of g.gorevler) ekle(gorevBasligi(gorev.kod), gorev.due || null)

  for (const ilac of g.ilacGuvenlik) {
    if (!ilac.aylikDue) continue
    // İlaç adı hasta yüzüne yazılmaz; β-hCG vadesi yalnız izotretinoin paketinde doğar.
    const izotretinoin = /izotret/i.test(ilac.ilac)
    ekle(izotretinoin ? 'Aylık kan testi (gebelik testi) — tedavi güvenliği için' : 'Tedavi güvenlik kan kontrolü', ilac.aylikDue)
  }

  for (const kurs of g.yamaKurslari) {
    if (!ISO.test(kurs.appliedAt || '')) continue
    const durum = patchStatus(kurs, g.bugun)
    if (durum === 'done' || durum === 'not_yet') continue
    const gun = durum === 'overdue_d2' || durum === 'open_d2' ? 2 : 4
    ekle(`Yama testi okuması (${gun}. gün)`, addDays(kurs.appliedAt, gun))
  }

  if (g.sonFototerapiSeansi && ISO.test(g.sonFototerapiSeansi) && g.fototerapiAralikGun && g.fototerapiAralikGun > 0) {
    ekle('Fototerapi seansı', addDays(g.sonFototerapiSeansi, g.fototerapiAralikGun))
  }

  const tbseIso = g.sonTbse && ISO.test(g.sonTbse) ? g.sonTbse : null
  if (annualTbseDue(tbseIso, g.bugun)) ekle(TBSE_BASLIK, tbseIso ? addDays(tbseIso, 365) : null)

  if (g.sonrakiFoto) ekle('Kontrol fotoğrafı randevusu', g.sonrakiFoto)

  return [...cikti.values()].sort(sirala).slice(0, 12)
}

/** Yaklaşan kontrol kartı: geciken varsa o, yoksa en yakın planlı tarih. */
export function sonrakiKontrol(liste: DerimHatirlatma[]): { tarih: string; neden: string } | null {
  const tarihli = liste.filter((h): h is DerimHatirlatma & { due: string } => !!h.due)
  const secim = tarihli.find((h) => h.durum === 'gecikti') || tarihli[0]
  return secim ? { tarih: secim.due, neden: secim.ad } : null
}

/** Hasta yüzünde asla görünmemesi gereken kalıplar — API ve testler aynı listeyi kullanır. */
export const YASAK_HASTA_DILI: RegExp[] = [
  /PASI|EASI|DLQI|UAS7|SALT|PDAI|SCORAD/i,
  /melanom|karsinom|psorias|nevüs|nevus|büllöz|pemfig|Behçet/i,
  /\d+([.,]\d+)?\s*(mg\/kg|J\/cm|mg|mcg|µg|IU|ünite)(?![\p{L}])/iu,
  /izotretinoin|metotreksat|asitretin|siklosporin|biyolojik/i,
  /ABCDE|dermoskop|morfoloji|eksizyon|patoloji sonucu:/i,
]

export function hastaDiliTemizMi(metin: string): boolean {
  return !YASAK_HASTA_DILI.some((re) => re.test(metin))
}

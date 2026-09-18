/**
 * DAH-EXCEPTIONAL-01 — Sağlığım › Takibim hatırlatmaları. Pure.
 * Her satır hekim görevinden / hedef kartından / ev ölçüm ihtiyacından doğar.
 * Hasta yüzünde tanı, ICD, doz, skor YOKTUR — specialty-hasta-portali.
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type TakibimHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7

/** Görev kodu → hasta-güvenli başlık. Klinik metin taşınmaz. */
const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^hba1c|^dm_lab|^glukoz/, 'Şeker kontrol kan testi'],
  [/^kb_|^ht_izlem|^ofis_kb/, 'Kan basıncı kontrol randevusu'],
  [/^ldl|^lipid/, 'Kolesterol kontrol kan testi'],
  [/^egfr|^uacr|^ckd|^kre/, 'Böbrek fonksiyon kan testi'],
  [/^inr|^doak|^antikoag/, 'Kan sulandırıcı güvenlik kontrolü'],
  [/^tsh|^tiroid/, 'Tiroid kan testi'],
  [/^asi|^as[iı]_/, 'Aşı randevusu'],
  [/^tarama|^ketem|^mamografi|^kolonoskopi/, 'Tarama randevusu'],
  [/^vit_?d|^b12/, 'Vitamin kontrol kan testi'],
  [/^kontrol|^izlem|^vizit/, 'Kontrol randevusu'],
]

export function gorevBasligi(kod: string | null | undefined): string {
  const k = String(kod || '').toLocaleLowerCase('tr-TR')
  for (const [re, ad] of GOREV_BASLIK) if (re.test(k)) return ad
  return 'Kontrol randevusu'
}

const ISO = /^\d{4}-\d{2}-\d{2}$/

export function hatirlatmaDurumu(due: string | null, bugun: string): HatirlatmaDurum {
  if (!due || !ISO.test(due) || !ISO.test(bugun)) return 'planli'
  const a = Date.parse(due + 'T12:00:00Z')
  const b = Date.parse(bugun + 'T12:00:00Z')
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 'planli'
  const fark = Math.round((a - b) / 86400000)
  if (fark < 0) return 'gecikti'
  return fark <= YAKLASIYOR_GUN ? 'yaklasiyor' : 'planli'
}

/** Hasta-güvenli hedef özeti — tanı / sayısal skor yok; hekim kilidi varsa göster. */
export type HedefOzet = { ad: string; ozet: string }

const HEDEF_AD: Record<string, string> = {
  kb: 'Kan basıncı hedefi',
  hba1c: 'Şeker (HbA1c) hedefi',
  ldl: 'Kolesterol (LDL) hedefi',
  egfr: 'Böbrek izlemi',
  kilo: 'Kilo / yaşam tarzı hedefi',
}

export function hedefOzetleri(
  kilitli: Array<{ kod: string; metin: string | null }>,
): HedefOzet[] {
  const out: HedefOzet[] = []
  for (const k of kilitli) {
    const ad = HEDEF_AD[k.kod] || null
    if (!ad) continue
    // Strip diagnosis-like tokens; keep short neutral summary
    const ham = String(k.metin || '').trim()
    const ozet = ham
      ? ham
          .replace(/\b(I\d{2}(\.\d+)?|E\d{2}(\.\d+)?)\b/gi, '')
          .replace(/\b(tanı|tani|diyabet|hipertansiyon|KBH)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 80) || 'Doktorunuzun belirlediği hedef'
      : 'Doktorunuzun belirlediği hedef'
    out.push({ ad, ozet })
  }
  return out
}

export interface TakibimGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  hedefler: Array<{ kod: string; metin: string | null }>
  /** Son ev KB / glukoz kayıt özeti (sayılar OK — hasta kendi ölçümü). */
  evKbOzet: string | null
  evGlukozOzet: string | null
  sonrakiKontrolIso: string | null
}

export function takibimHatirlatmalari(g: TakibimGirdi): TakibimHatirlatma[] {
  const map = new Map<string, TakibimHatirlatma>()
  for (const gorev of g.gorevler) {
    const ad = gorevBasligi(gorev.kod)
    const due = gorev.due && ISO.test(gorev.due.slice(0, 10)) ? gorev.due.slice(0, 10) : null
    const key = `${ad}|${due || ''}`
    if (map.has(key)) continue
    map.set(key, { ad, due, durum: hatirlatmaDurumu(due, g.bugun) })
  }
  if (g.sonrakiKontrolIso && ISO.test(g.sonrakiKontrolIso.slice(0, 10))) {
    const due = g.sonrakiKontrolIso.slice(0, 10)
    const ad = 'Kontrol randevusu'
    const key = `${ad}|${due}`
    if (!map.has(key)) map.set(key, { ad, due, durum: hatirlatmaDurumu(due, g.bugun) })
  }
  return [...map.values()].sort((a, b) => {
    if (!a.due) return b.due ? 1 : 0
    if (!b.due) return -1
    return a.due.localeCompare(b.due)
  })
}

export function sonrakiKontrol(liste: TakibimHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

/** Hasta dilinde yasak kelimeler — test kilidi. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|PASI|EASI|SCORE2|KDIGO|mg\/kg|J\/cm)/i.test(metin)
}

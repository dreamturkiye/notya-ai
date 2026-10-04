/**
 * NOTYA-TAKIP-01 — parse a follow-up window from the doctor's plan sentence.
 *
 * Unifies two earlier parsers:
 *   • kontrolTarihi (lib/randevu/v2/kontrolOnerisi) — "2 hafta sonra kontrol" / word numbers
 *   • kontrolVadesi (lib/doktor/acikIsler) — "1-2 gün içinde", "48-72 saat içinde"
 *
 * Pure. For ranges the UPPER bound is the due date (doctor said "1-2 days" → day 2).
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'

const SAYI: Record<string, number> = {
  bir: 1, iki: 2, uc: 3, üç: 3, dort: 4, dört: 4, bes: 5, beş: 5,
  alti: 6, altı: 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10,
}

/** "düzelmezse", "ateş devam ederse", "gerekirse" — kontrol tied to a condition. */
export const KOSULLU_KONTROL = /(mezse|mazsa|olursa|ederse|gerekirse|gerektiğinde|gerektiginde)\b/

export function gunEkleIso(gunIso: string, n: number): string {
  return new Date(Date.parse(`${gunIso}T12:00:00Z`) + n * 86400e3).toISOString().slice(0, 10)
}

export function kosulluMu(metin: string): boolean {
  return KOSULLU_KONTROL.test(trAramaNormalize(metin))
}

function birimGun(birim: string, n: number): number {
  if (birim === 'saat') return Math.ceil(n / 24)
  if (birim === 'hafta') return n * 7
  if (birim === 'ay') return n * 30
  return n // gün / gun
}

function sayiCoz(ham: string): number | null {
  if (/^\d+$/.test(ham)) {
    const n = Number(ham)
    return n >= 1 && n <= 400 ? n : null
  }
  return SAYI[ham] ?? null
}

export type KontrolVadeSonuc = {
  /** YYYY-MM-DD due date (upper bound of a range). */
  vade: string
  /** The matching clause / sentence fragment. */
  cumle: string
  kosullu: boolean
  /** Days from `bugun` (or note date) to vade. */
  gun: number
}

/**
 * Find a kontrol follow-up window in free text.
 * `baslangicIso` is the note/visit day the window counts from (YYYY-MM-DD).
 */
export function kontrolVadesiBul(metin: string | null | undefined, baslangicIso: string): KontrolVadeSonuc | null {
  if (!metin || !/^\d{4}-\d{2}-\d{2}$/.test(baslangicIso)) return null
  const norm = trAramaNormalize(metin)
  // Prefer the kontrol-bearing clause when the plan has several sentences.
  const cumleler = metin.split(/(?<=[.!?…])\s+|\n+/).map((c) => c.trim()).filter(Boolean)
  const adaylar = cumleler.length ? cumleler : [metin]

  /** Visit follow-up intent — not lab/tetkik scheduling alone. */
  const ziyaretNiyeti = (s: string) =>
    /\bkontrol/.test(s) || /\bkontrole\b/.test(s) || /\bgelsin\b/.test(s)
    || /\bgormek\b/.test(s) || /\bgorusmek\b/.test(s) || /\bmuayene\b/.test(s)
    || /\btekrar\s+gor/.test(s)

  for (const cumle of adaylar) {
    const nC = trAramaNormalize(cumle)
    if (!ziyaretNiyeti(nC)) continue

    // "2 hafta sonra" / "bir ay sonra" (word or digit)
    const sonra = nC.match(/\b(\d{1,3}|bir|iki|uc|dort|bes|alti|yedi|sekiz|dokuz|on)\s+(gun|hafta|ay)\s+sonra\b/)
    if (sonra) {
      const n = sayiCoz(sonra[1])
      if (!n) continue
      const gun = birimGun(sonra[2], n)
      return { vade: gunEkleIso(baslangicIso, gun), cumle, kosullu: kosulluMu(cumle), gun }
    }

    // "1-2 gün içinde" / "48-72 saat içinde" / "3 gün içerisinde"
    const icinde = nC.match(/\b(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?\s*(saat|gun|hafta|ay)\s+(?:icinde|icerisinde)\b/)
    if (icinde) {
      const n = Number(icinde[2] || icinde[1])
      if (!n || n > 400) continue
      const gun = birimGun(icinde[3], n)
      return { vade: gunEkleIso(baslangicIso, gun), cumle, kosullu: kosulluMu(cumle), gun }
    }
  }

  // Whole-text fallback when the window and the visit word sit in different clauses.
  if (ziyaretNiyeti(norm)) {
    const m = norm.match(/\b(\d{1,3}|bir|iki|uc|dort|bes|alti|yedi|sekiz|dokuz|on)\s+(gun|hafta|ay)\s+sonra\b/)
      || norm.match(/\b(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?\s*(saat|gun|hafta|ay)\s+(?:icinde|icerisinde)\b/)
    if (m) {
      const n = m[2] && /^\d+$/.test(m[2]) ? Number(m[2]) : sayiCoz(m[1])
      const birim = (m[3] || m[2] || '') as string
      if (n && /^(saat|gun|hafta|ay)$/.test(birim)) {
        const gun = birimGun(birim, n)
        return { vade: gunEkleIso(baslangicIso, gun), cumle: metin.trim().slice(0, 200), kosullu: kosulluMu(metin), gun }
      }
      if (n && /^(gun|hafta|ay)$/.test(String(m[2]))) {
        const gun = birimGun(String(m[2]), n)
        return { vade: gunEkleIso(baslangicIso, gun), cumle: metin.trim().slice(0, 200), kosullu: kosulluMu(metin), gun }
      }
    }
  }
  return null
}

/** Patient-safe portal label for a due date (no diagnosis). */
export function portalKontrolEtiketi(vadeIso: string, bugunIso: string): string {
  if (vadeIso === bugunIso) return 'Bugün · kontrol'
  const yarin = gunEkleIso(bugunIso, 1)
  if (vadeIso === yarin) return 'Yarın · kontrol'
  const tar = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(`${vadeIso}T12:00:00+03:00`))
  return `${tar} · kontrol`
}

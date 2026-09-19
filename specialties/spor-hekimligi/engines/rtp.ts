/**
 * SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Return-to-play (RTP) basamakları. SAF fonksiyon.
 * Basamak 0–5 KARAR DESTEĞİDİR; spora dönüş kararı ve tanı hekimindir.
 */
import type { Dipnot } from './spor'

export type RtpBasamak = 0 | 1 | 2 | 3 | 4 | 5

export const RTP_BASAMAKLAR: Array<{ basamak: RtpBasamak; ad: string; ozet: string }> = [
  { basamak: 0, ad: 'Dinlenme / semptom kontrolü', ozet: 'Aktivite durduruldu; semptom yokluğu hekim onayıyla ilerlenir' },
  { basamak: 1, ad: 'Hafif aerobik', ozet: 'Düşük yoğunluklu aerobik; spor-spesifik yük yok' },
  { basamak: 2, ad: 'Spor-spesifik egzersiz', ozet: 'Spor hareketleri; temas / maç yükü yok' },
  { basamak: 3, ad: 'Temassız antrenman', ozet: 'Takım antrenmanı temas olmadan; yük artışı kademeli' },
  { basamak: 4, ad: 'Temaslı antrenman', ozet: 'Kontrollü temas; yarışma / maç yok' },
  { basamak: 5, ad: 'Tam antrenman / yarışma uygunluğu', ozet: 'Hekim onayıyla tam yük — dönüş kararı hekimindir' },
]

export const RTP_BASAMAK_AD: Record<RtpBasamak, string> = Object.fromEntries(
  RTP_BASAMAKLAR.map((b) => [b.basamak, b.ad]),
) as Record<RtpBasamak, string>

export interface RtpSonuc {
  basamak: RtpBasamak
  basamakAd: string
  ozet: string
  sonrakiKontrolGun: number
  dipnot: Dipnot
}

const KONTROL_GUN: Record<RtpBasamak, number> = {
  0: 3,
  1: 5,
  2: 7,
  3: 7,
  4: 10,
  5: 14,
}

export function basamakGecerliMi(n: unknown): n is RtpBasamak {
  const x = Number(n)
  return Number.isInteger(x) && x >= 0 && x <= 5
}

export function rtpDegerlendir(basamakHam: unknown, not?: string | null): RtpSonuc | { hata: string } {
  if (!basamakGecerliMi(basamakHam)) {
    return { hata: 'RTP basamağı 0–5 aralığında olmalı' }
  }
  const meta = RTP_BASAMAKLAR[basamakHam]!
  const notParca = not && String(not).trim() ? ` Hekim notu: ${String(not).trim().slice(0, 200)}.` : ''
  return {
    basamak: basamakHam,
    basamakAd: meta.ad,
    ozet: `RTP basamak ${basamakHam} — ${meta.ad} (karar desteği; dönüş ve tanı hekimindir).${notParca}`,
    sonrakiKontrolGun: KONTROL_GUN[basamakHam],
    dipnot: { ref: 'RTP_BASAMAK', not: meta.ozet },
  }
}

export function sonrakiRtpGun(basamak: RtpBasamak): number {
  return KONTROL_GUN[basamak]
}

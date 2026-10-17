/**
 * PEDIATRI-SINAV-01 — muayene (yeni seans) ekranındaki hasta bilgi satırı: ad, cinsiyet, yaş (+ pediatride anne/baba).
 *
 * Sınıflandırma (Kaan, 2026-10-16: PEDİATRİYE ÖZEL — brans-alan-sizmasi): TÜM blok (ad, cinsiyet, yaş, anne/baba)
 * yalnız kuralı 'her-zaman' olan branşlarda (pediatri, çocuk cerrahisi) ve hasta yetişkin DEĞİLKEN çizilir. Aile
 * hekimliği / branşsız ('cocuk-hastada') ve diğer tüm branşlar bu bloğu görmez. "veli" hitabı ayrı kuraldır
 * (veliDiliMi → yaşa bağlı) ve bu bloğun görünürlüğünü değiştirmez.
 * Yaş biçimi TEK yerde: yasGosterim().
 */
import { etkinBrans, pediatrikBaglamKurali, eriskinHastaMi, veliDiliMi } from '@/lib/specialties/kapsam'

const GUN_MS = 86_400_000

function parcala(iso: string | null | undefined): { y: number; a: number; g: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? '').trim())
  if (!m) return null
  const y = Number(m[1]), a = Number(m[2]), g = Number(m[3])
  if (a < 1 || a > 12 || g < 1 || g > 31) return null
  return { y, a, g }
}

/** Takvim günü (UTC gece yarısı) — saat dilimi kaymasından bağımsız gün farkı için. */
const gunDamgasi = (p: { y: number; a: number; g: number }) => Date.UTC(p.y, p.a - 1, p.g)

/** Doğumdan bu yana TAM takvim ayı. Doğum günü ayda yoksa (29 Şubat) ayın son gününde dolmuş sayılır. */
function tamAy(d: { y: number; a: number; g: number }, b: { y: number; a: number; g: number }): number {
  let ay = (b.y - d.y) * 12 + (b.a - d.a)
  const ayinSonGunu = new Date(Date.UTC(b.y, b.a, 0)).getUTCDate()
  const hedefGun = Math.min(d.g, ayinSonGunu)
  if (b.g < hedefGun) ay -= 1
  return ay
}

/**
 * Hasta yaşı, pediatri hassasiyetiyle:
 *  < 1 ay  → "12 günlük" (yenidoğan; 0 gün → "0 günlük")
 *  1–11 ay → "11 aylık"
 *  ≥ 12 ay → "1 yaş 6 ay", "2 yaş 3 ay"; tam yıl ise "2 yaş" (24 ay = "2 yaş")
 * Doğum tarihi yok / çözülemiyor / gelecekte → '' (ekranda yaş yazılmaz; uydurulmaz).
 */
export function yasGosterim(dogumIso: string | null | undefined, nowMs: number = Date.now()): string {
  const d = parcala(dogumIso)
  if (!d) return ''
  const bugun = new Date(nowMs + 3 * 3_600_000) // TRT takvim günü
  const b = { y: bugun.getUTCFullYear(), a: bugun.getUTCMonth() + 1, g: bugun.getUTCDate() }
  const gun = Math.round((gunDamgasi(b) - gunDamgasi(d)) / GUN_MS)
  if (gun < 0) return ''
  const ay = tamAy(d, b)
  if (ay < 1) return `${gun} günlük`
  if (ay < 12) return `${ay} aylık`
  const yil = Math.floor(ay / 12)
  const kalan = ay % 12
  return kalan === 0 ? `${yil} yaş` : `${yil} yaş ${kalan} ay`
}

export interface SinavHastaGirdisi {
  adSoyad?: string | null
  /** patients.dob çözülmüş ISO (YYYY-MM-DD…) */
  dogumIso?: string | null
  /** Türkçe etiket ("Erkek" / "Kız"/ "Kadın" …) — /api/doktor/hastalar/[id] cinsiyet alanı */
  cinsiyet?: string | null
  anneAdi?: string | null
  babaAdi?: string | null
  seansBransi?: string | null
  doktorBransi?: string | null
  nowMs?: number
}

export interface SinavHastaBilgisi {
  adSoyad: string
  cinsiyet: string
  yas: string
  /** Blok pediatriye özel mi görünür (false → hiçbir şey çizilmez). */
  goster: boolean
  /** Anne/baba adı (en az biri doluysa), yalnız blok görünürken. */
  ebeveyn: { anne: string; baba: string } | null
  /** Bilgi: veliDiliMi (yaşa bağlı hukuki kural) — bloğun ebeveyn satırını AÇMAZ, yalnız hitap kararını taşır. */
  veliDili: boolean
}

const temiz = (v: string | null | undefined) => String(v ?? '').trim()

export function sinavHastaBilgisi(g: SinavHastaGirdisi): SinavHastaBilgisi {
  const nowMs = g.nowMs ?? Date.now()
  const kapsam = { seansBransi: g.seansBransi, doktorBransi: g.doktorBransi, hastaDogumIso: g.dogumIso, nowMs }
  const anne = temiz(g.anneAdi)
  const baba = temiz(g.babaAdi)
  const goster = pediatrikBaglamKurali(etkinBrans(kapsam)) === 'her-zaman' && !eriskinHastaMi(g.dogumIso, nowMs)
  return {
    goster,
    adSoyad: goster ? temiz(g.adSoyad) : '',
    cinsiyet: goster ? temiz(g.cinsiyet) : '',
    yas: goster ? yasGosterim(g.dogumIso, nowMs) : '',
    ebeveyn: goster && (anne !== '' || baba !== '') ? { anne, baba } : null,
    veliDili: veliDiliMi(kapsam),
  }
}

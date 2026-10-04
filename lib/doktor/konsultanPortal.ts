/**
 * KONSULTASYONLAR-01 — konsültan portalı dilimi ve dönüş yardımcıları.
 * Konsültana giden dilim: kısa özgeçmiş, soru, onaylı not cümleleri.
 * Fısıltı, ham transkript, model adı GİTMEZ.
 */
import { istemOzu, hedefEtiketi, trGun, type KonsultasyonSatiri } from '@/lib/doktor/konsultasyon'
import { VAULT_ALLOWED_MIME, VAULT_MAX_BYTES } from '@/lib/vault/types'

export const KONSULTAN_NOT_SINIRI = 2000
export const KONSULTAN_DAVET_SATIRI =
  'Notya — muayenehane hekimleri için klinik asistan. İsterseniz notya.io adresinden inceleyebilirsiniz.'

/** Uzantı → MIME (portal yükleme; çekirdek vault listesi). */
const UZANTI_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  gif: 'image/gif',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  dcm: 'application/dicom',
}

export function uzantidanMime(ad: string, hamMime?: string | null): string | null {
  const mime = String(hamMime || '').toLowerCase().split(';')[0].trim()
  if (mime && (VAULT_ALLOWED_MIME as readonly string[]).includes(mime)) return mime
  const u = String(ad || '').toLowerCase().match(/\.([a-z0-9]{1,5})$/)?.[1] || ''
  const tahmin = UZANTI_MIME[u]
  if (tahmin && (VAULT_ALLOWED_MIME as readonly string[]).includes(tahmin)) return tahmin
  return null
}

/** Reddedilen uzantı — Türkçe tek cümle. */
export const BELGE_TURU_REDDEDILDI =
  'Bu dosya türü kabul edilmiyor — JPEG, PNG, WebP, HEIC, GIF, TIFF, PDF, MP3, M4A, WAV, kısa MP4/MOV/WebM veya DICOM yükleyin.'

export function portalBelgeDogrula(ad: string, mime: string | null, boyut: number): { hata: string } | { mime: string } {
  const m = uzantidanMime(ad, mime)
  if (!m) return { hata: BELGE_TURU_REDDEDILDI }
  if (!Number.isFinite(boyut) || boyut <= 0) return { hata: 'Dosya boş olamaz.' }
  if (boyut > VAULT_MAX_BYTES) return { hata: 'Dosya 4 MB sınırını aşıyor — kısa video veya sıkıştırılmış görüntü yükleyin.' }
  return { mime: m }
}

/** Konsültana gösterilen dilim — klinik öz, fısıltı/transkript/model yok. */
export interface KonsultanDilim {
  brans: string
  hekimAdi: string
  hastaAdi: string
  soru: string
  ozgecmis: string | null
  onayliCumleler: string[]
  istemTarihi: string
  beklenenGun: string | null
}

export function konsultanDilimi(g: {
  satir: Pick<KonsultasyonSatiri, 'hedef_brans' | 'hedef' | 'klinik_soru' | 'not_metni' | 'tanilar' | 'mevcut_durum' | 'istem_tarihi' | 'created_at' | 'beklenen_gun'>
  hekimAdi: string
  hastaAdi: string
  /** Onaylı muayene notundan kısa cümleler (transkript değil). */
  onayliCumleler?: string[]
}): KonsultanDilim {
  const s = g.satir
  const oz = [s.tanilar, s.mevcut_durum].filter(Boolean).join(' · ').trim() || null
  return {
    brans: hedefEtiketi(s),
    hekimAdi: g.hekimAdi || 'İsteyen hekim',
    hastaAdi: g.hastaAdi || 'Hasta',
    soru: istemOzu(s.klinik_soru) || String(s.not_metni || '').trim() || '—',
    ozgecmis: oz,
    onayliCumleler: (g.onayliCumleler || []).map((c) => String(c || '').trim()).filter(Boolean).slice(0, 8),
    istemTarihi: trGun(s.istem_tarihi || s.created_at),
    beklenenGun: s.beklenen_gun ? trGun(s.beklenen_gun) : null,
  }
}

/** Asistan ön değerlendirme — hekim onayı olmadan hastaya gitmez. */
export function asistanOnNotYaz(g: {
  konsultanNotu: string
  belgeAdlari: string[]
  brans: string
}): string {
  const not = String(g.konsultanNotu || '').replace(/\s+/g, ' ').trim().slice(0, KONSULTAN_NOT_SINIRI)
  const belgeler = g.belgeAdlari.filter(Boolean).slice(0, 5)
  const satirlar = [
    `[Asistan ön değerlendirme — hekim onayı bekliyor]`,
    `Konsültasyon yanıtı (${g.brans || 'branş'}).`,
    not ? `Konsültan notu: ${not}` : null,
    belgeler.length ? `Eklenen belgeler: ${belgeler.join(', ')}` : null,
    `Bu metin hekim onaylamadan hasta portalına konulmaz.`,
  ]
  return satirlar.filter(Boolean).join('\n')
}

export function konsultanNotDogrula(not: unknown): { hata: string } | { not: string } {
  const s = String(not ?? '').replace(/\r\n?/g, '\n').trim().slice(0, KONSULTAN_NOT_SINIRI)
  if (s.length < 3) return { hata: 'Kısa bir klinik not yazın — ör. "İşitme kaybı saptanmadı."' }
  return { not: s }
}

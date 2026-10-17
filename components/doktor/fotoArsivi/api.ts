/**
 * FOTO-ARSIV-01 — browser-side client of app/api/doktor/hasta-foto/**. Every call carries the doctor's bearer token
 * (ensureDoctorAccessToken, NOTYA-AUTH-01); there are no signed URLs, so images always travel as authenticated blobs.
 */
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import type { ArsivListesi } from '@/lib/doktor/fotoArsiv/sunucu'
import type { FotoMeta, MetaYamasi } from '@/lib/doktor/fotoArsiv/meta'
import type { KarsilastirmaYaniti, TekDegerlendirmeYaniti, KaliteYaniti, GeriBildirimYaniti } from '@/lib/doktor/muayeneEk/foto/fotoServis'

export class ApiHatasi extends Error {
  constructor(public durum: number, mesaj: string, public govde?: unknown) { super(mesaj) }
}

export type ArsivYaniti = ArsivListesi & { rol?: string }
export interface FotoDetayi { meta: FotoMeta; belge: { id: string; ad: string; tur: string; olusturuldu: string; muayeneId: string | null } }
export type { KarsilastirmaYaniti, TekDegerlendirmeYaniti, KaliteYaniti, GeriBildirimYaniti }

const kok = (patientId: string): string => `/api/doktor/hasta-foto/${encodeURIComponent(patientId)}`

async function istek(yol: string, init: RequestInit = {}): Promise<Response> {
  const t = await ensureDoctorAccessToken()
  if (!t) throw new ApiHatasi(401, 'Oturum bulunamadı. Lütfen yeniden giriş yapın.')
  return fetch(yol, { cache: 'no-store', ...init, headers: { Authorization: `Bearer ${t}`, ...(init.headers || {}) } })
}

export function hataMesaji(durum: number, govde: unknown): string {
  const g = (govde && typeof govde === 'object' ? govde : {}) as { error?: unknown; mesaj?: unknown }
  if (typeof g.error === 'string' && g.error) return g.error
  if (typeof g.mesaj === 'string' && g.mesaj) return g.mesaj
  if (durum === 403) return 'Bu işlem için yetkiniz yok.'
  if (durum === 404) return 'Bulunamadı.'
  if (durum === 429) return 'Günlük kullanım sınırına ulaşıldı.'
  return 'İşlem tamamlanamadı.'
}

async function json<T>(yol: string, init?: RequestInit): Promise<T> {
  const r = await istek(yol, init)
  const g = await r.json().catch(() => ({}))
  if (!r.ok) {
    // the AI routes answer 429/502 with a structured body ({durum:'kota'|'hata', mesaj}) that the panel renders itself
    if (g && typeof g === 'object' && 'durum' in g && (r.status === 429 || r.status === 502)) return g as T
    throw new ApiHatasi(r.status, hataMesaji(r.status, g), g)
  }
  return g as T
}

const govdeli = (yontem: string, govde: unknown): RequestInit => ({ method: yontem, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde) })

export const listeGetir = (p: string) => json<ArsivYaniti>(kok(p))
export const detayGetir = (p: string, b: string) => json<FotoDetayi>(`${kok(p)}/${b}`)
export const metaYama = (p: string, b: string, yama: MetaYamasi) => json<{ meta: FotoMeta }>(`${kok(p)}/${b}`, govdeli('PATCH', yama))
export type TopluIslem =
  | { islem: 'etiket-ekle' | 'etiket-cikar'; belgeIds: string[]; etiket: string }
  | { islem: 'favori' | 'anahtar' | 'gizle'; belgeIds: string[]; deger: boolean }
  | { islem: 'yildiz'; belgeIds: string[]; deger: number }
  | { islem: 'bolge'; belgeIds: string[]; deger: string | null }
export const topluYap = (p: string, i: TopluIslem) => json<{ guncellenen: string[] }>(`${kok(p)}/toplu`, govdeli('POST', i))

export async function dosyaBlob(p: string, b: string): Promise<Blob> {
  const r = await istek(`${kok(p)}/${b}/dosya`)
  if (!r.ok) throw new ApiHatasi(r.status, hataMesaji(r.status, null))
  return r.blob()
}
/** null = no stored thumbnail yet (the device makes one from the original and uploads it). */
export async function kucukGetir(p: string, b: string): Promise<Blob | null> {
  const r = await istek(`${kok(p)}/${b}/kucuk`)
  if (r.status === 404) return null
  if (!r.ok) throw new ApiHatasi(r.status, hataMesaji(r.status, null))
  return r.blob()
}
export async function kucukYaz(p: string, b: string, blob: Blob, w: number, h: number): Promise<void> {
  const r = await istek(`${kok(p)}/${b}/kucuk?w=${w}&h=${h}`, { method: 'PUT', headers: { 'Content-Type': blob.type || 'image/jpeg' }, body: blob })
  if (!r.ok) throw new ApiHatasi(r.status, hataMesaji(r.status, null))
}

export const aiOku = (p: string, b: string) => json<TekDegerlendirmeYaniti>(`${kok(p)}/${b}/ai`)
export const aiCalistir = (p: string, b: string, gorsel: string, yenile = false, bolgeIpucu?: string | null) =>
  json<TekDegerlendirmeYaniti>(`${kok(p)}/${b}/ai`, govdeli('POST', { gorsel, yenile, ...(bolgeIpucu ? { bolgeIpucu } : {}) }))
export const karsilastirOku = (p: string, b: string, onceki: string) => json<KarsilastirmaYaniti>(`${kok(p)}/${b}/ai/karsilastir?onceki=${encodeURIComponent(onceki)}`)
export const karsilastirCalistir = (p: string, b: string, onceki: string, gorsel: string, oncekiGorsel: string, yenile = false) =>
  json<KarsilastirmaYaniti>(`${kok(p)}/${b}/ai/karsilastir`, govdeli('POST', { onceki, gorsel, oncekiGorsel, yenile }))
export const geriBildirimGonder = (p: string, b: string, gozlemAnahtari: string, karar: 'kabul' | 'duzelt' | 'reddet', duzeltme?: string) =>
  json<GeriBildirimYaniti>(`${kok(p)}/${b}/ai/geri-bildirim`, govdeli('POST', { gozlemAnahtari, karar, ...(duzeltme ? { duzeltme } : {}) }))
export const kaliteKontrolEt = (p: string, gorsel: string) => json<KaliteYaniti>(`${kok(p)}/kalite`, govdeli('POST', { gorsel }))

export interface RaporIstegi { baslik?: string; duzen: 'kolaj' | 'tek' | 'karsilastirma'; ogeler: { belgeId: string; gorsel: string }[] }
export async function raporUret(p: string, i: RaporIstegi): Promise<Blob> {
  const r = await istek(`${kok(p)}/rapor`, govdeli('POST', i))
  if (!r.ok) throw new ApiHatasi(r.status, hataMesaji(r.status, await r.json().catch(() => null)))
  return r.blob()
}

/** Adds a photo to the patient file (category "Klinik fotoğraf" makes it a clinical photo). Returns the new document id. */
export async function fotoYukle(patientId: string, dosya: Blob, ad: string): Promise<string> {
  const fd = new FormData()
  fd.append('file', new File([dosya], ad, { type: dosya.type || 'image/jpeg' }))
  fd.append('patientId', patientId)
  fd.append('category', 'Klinik fotoğraf')
  const r = await istek('/api/doktor/documents', { method: 'POST', body: fd })
  const g = await r.json().catch(() => ({}))
  const id = (g as { document?: { id?: unknown } }).document?.id
  if (!r.ok || typeof id !== 'string') throw new ApiHatasi(r.status, hataMesaji(r.status, g))
  return id
}

// ─── decoded originals (kept few: a phone photo decodes to tens of MB) ───────────────────────────────────
const BITMAP_ONBELLEK_AZAMI = 6
const bitmapler = new Map<string, Promise<ImageBitmap>>()
export function bitmapAl(patientId: string, belgeId: string): Promise<ImageBitmap> {
  const anahtar = `${patientId}/${belgeId}`
  const var_ = bitmapler.get(anahtar)
  if (var_) { bitmapler.delete(anahtar); bitmapler.set(anahtar, var_); return var_ }
  const s = dosyaBlob(patientId, belgeId).then(async (blob) => {
    try { return await createImageBitmap(blob, { imageOrientation: 'from-image' }) } catch { throw new ApiHatasi(415, 'Bu görüntü biçimi tarayıcıda açılamadı.') }
  })
  bitmapler.set(anahtar, s)
  s.catch(() => bitmapler.delete(anahtar))
  while (bitmapler.size > BITMAP_ONBELLEK_AZAMI) { const eski = bitmapler.keys().next().value; if (eski === undefined) break; bitmapler.delete(eski) }
  return s
}

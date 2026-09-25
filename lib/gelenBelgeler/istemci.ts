'use client'
/**
 * NOTYA-GELEN-BELGELER — browser half: send a file / pasted text to the inbox, with the same checks the server makes
 * so the doctor hears "too big" or "not a document" at once instead of after an upload.
 *
 *   • DICOM (.dcm) is turned into a plain image HERE with the existing reader (core/belgeler/dicom.ts): only pixels
 *     are kept, the patient tags never leave the device.
 *   • A phone photo over the size limit is re-encoded smaller (canvas → JPEG) — a photo of a lab sheet stays readable.
 *   • After every change a window event lets the inbox page, the Ana Sayfa card and the sidebar badge refresh.
 */
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { bicimBelirle } from './bicim'
import { EN_BUYUK_BAYT, type GelenKaynak } from './tipler'

export const GELEN_OLAY = 'notya:gelen-belge'
export const gelenDegisti = () => { try { window.dispatchEvent(new Event(GELEN_OLAY)) } catch { /* SSR */ } }

/** How many files are being read right now (any page) — the inbox shows "Notya okuyor…" while > 0. */
export const GELEN_BEKLEYEN_OLAY = 'notya:gelen-bekleyen'
let bekleyen = 0
export const bekleyenSayisi = () => bekleyen
async function izle<T>(is: () => Promise<T>): Promise<T> {
  bekleyen++
  try { window.dispatchEvent(new Event(GELEN_BEKLEYEN_OLAY)) } catch { /* SSR */ }
  try { return await is() } finally {
    bekleyen--
    try { window.dispatchEvent(new Event(GELEN_BEKLEYEN_OLAY)) } catch { /* SSR */ }
  }
}

export class GelenHatasi extends Error {
  constructor(message: string, public durum: number) { super(message) }
}

export async function gelenIstek<T>(yol: string, init?: { method?: string; govde?: unknown; form?: FormData }): Promise<T> {
  const token = await ensureDoctorAccessToken()
  if (!token) throw new GelenHatasi('Oturum süresi doldu. Lütfen yeniden giriş yapın.', 401)
  const r = await fetch(yol, {
    method: init?.method || 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(init?.govde !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: init?.form ?? (init?.govde !== undefined ? JSON.stringify(init.govde) : undefined),
    cache: 'no-store',
  })
  const j = (await r.json().catch(() => ({}))) as T & { error?: string }
  if (!r.ok) throw new GelenHatasi(j.error || 'Bir sorun oldu. Lütfen yeniden deneyin.', r.status)
  return j
}

function canvasJpeg(c: HTMLCanvasElement, kalite: number): Promise<Blob> {
  return new Promise((coz, red) => c.toBlob((b) => (b ? coz(b) : red(new Error('jpeg'))), 'image/jpeg', kalite))
}

async function kucult(dosya: Blob, maxKenar = 2400): Promise<Blob> {
  const bmp = await createImageBitmap(dosya)
  const olcek = Math.min(1, maxKenar / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(bmp.width * olcek)); c.height = Math.max(1, Math.round(bmp.height * olcek))
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  return canvasJpeg(c, 0.85)
}

export type GonderSonucu = { durum: 'eklendi' | 'zaten_var'; id: string; dosyalandi?: boolean }

/** One file → inbox. Throws GelenHatasi with a plain sentence. */
export async function dosyaGonder(dosya: File, kaynak: GelenKaynak): Promise<GonderSonucu> {
  let blob: Blob = dosya
  let ad = dosya.name || (dosya.type.startsWith('audio/') ? 'sesli-not' : 'belge')

  const { dicomMi, dicomCoz } = await import('@/core/belgeler/dicom')
  if (dicomMi(dosya, ad)) {
    try {
      const d = await dicomCoz(dosya)
      blob = await canvasJpeg(d.canvas, 0.92)
      ad = ad.replace(/\.dcm$/i, '') + '.jpg'
    } catch (e) {
      throw new GelenHatasi(e instanceof Error ? e.message : 'Bu DICOM dosyası açılamadı.', 400)
    }
  }

  const b = bicimBelirle(ad, blob.type)
  if (!b) throw new GelenHatasi('Bu dosya türü eklenemiyor. PDF, Word, Excel, fotoğraf ya da ses dosyası gönderin.', 400)
  if (blob.size > EN_BUYUK_BAYT && b.bicim === 'gorsel') {
    try { blob = await kucult(blob); ad = ad.replace(/\.(png|webp|jpe?g)$/i, '') + '.jpg' } catch { /* size check below */ }
  }
  if (blob.size > EN_BUYUK_BAYT) throw new GelenHatasi('Bu dosya çok büyük (en fazla 4 MB).', 400)

  const form = new FormData()
  form.set('dosya', blob, ad)
  form.set('kaynak', kaynak)
  const j = await izle(() => gelenIstek<GonderSonucu>('/api/doktor/gelen-belgeler', { method: 'POST', form }))
  gelenDegisti()
  return j
}

export async function metinGonder(metin: string): Promise<GonderSonucu> {
  const j = await izle(() => gelenIstek<GonderSonucu>('/api/doktor/gelen-belgeler', { method: 'POST', govde: { metin, kaynak: 'yapistir' } }))
  gelenDegisti()
  return j
}

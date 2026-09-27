/**
 * NOTYA-MESLEKTAS-V2 Faz 2 — sayfa/eylem telemetrisi.
 * Hasta kimliği, ad, metin yok. Yalnız sayfa tipi + eylem.
 */

export const SAYFA_TIPLERI = [
  'ana', 'hastalar', 'hasta', 'randevular', 'inceleme', 'not', 'recete',
  'ayarlar', 'asistan', 'araclar', 'mesajlar', 'belgeler', 'diger',
] as const

export type SayfaTipi = (typeof SAYFA_TIPLERI)[number]

export const EYLEMLER = [
  'sayfa_ac', 'not_onayla', 'hasta_ac', 'randevu_bitir', 'recete_ac', 'reddet',
] as const

export type KullanimEylem = (typeof EYLEMLER)[number]

export interface KullanimOlayi {
  sayfa: SayfaTipi
  eylem: KullanimEylem
  onceki?: SayfaTipi | null
  sureMs?: number
  cihaz?: string
  saatTRT?: string
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
const YASAK = /patient|hastaid|hasta_id|adsoyad|tcno|kimlik/i

export function sayfaTipi(yol: string): SayfaTipi {
  const p = String(yol || '').split('?')[0].replace(/\/+$/, '')
  if (/\/dashboard\/doktor\/hastalar\/[^/]+/.test(p)) return 'hasta'
  if (p.endsWith('/dashboard/doktor/hastalar') || p.endsWith('/hastalar')) return 'hastalar'
  if (p.includes('/randevular')) return 'randevular'
  if (p.includes('/inceleme')) return 'inceleme'
  if (/\/notlar\/[^/]+\/recete/.test(p)) return 'recete'
  if (/\/notlar\/[^/]+/.test(p)) return 'not'
  if (p.includes('/ayarlar')) return 'ayarlar'
  if (p.includes('/asistan') || p === '/asistan') return 'asistan'
  if (p.includes('/doktor-tools') || p.includes('/araclar')) return 'araclar'
  if (p.includes('/mesajlar')) return 'mesajlar'
  if (p.includes('/belge')) return 'belgeler'
  if (p === '/dashboard/doktor' || p.endsWith('/dashboard/doktor')) return 'ana'
  return 'diger'
}

export function cihazKovasi(genislik?: number): string {
  const w = Number(genislik || 0)
  if (w > 0 && w < 768) return 'telefon'
  if (w >= 768 && w < 1100) return 'tablet'
  if (w >= 1100) return 'masaustu'
  return 'bilinmiyor'
}

/** Birim test burayı tarar — PII / UUID / serbest metin yok. */
export function kullanimOlayiKur(g: {
  yol: string
  eylem?: KullanimEylem
  oncekiYol?: string | null
  sureMs?: number
  genislik?: number
  saat?: Date
}): KullanimOlayi {
  const olay: KullanimOlayi = {
    sayfa: sayfaTipi(g.yol),
    eylem: g.eylem || 'sayfa_ac',
    onceki: g.oncekiYol ? sayfaTipi(g.oncekiYol) : null,
    sureMs: Math.max(0, Math.round(g.sureMs || 0)) || undefined,
    cihaz: cihazKovasi(g.genislik),
    saatTRT: (g.saat || new Date()).toLocaleTimeString('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' }),
  }
  return olay
}

export function olayPiiIcerirMi(o: unknown): boolean {
  const t = JSON.stringify(o)
  if (UUID.test(t)) return true
  if (YASAK.test(t)) return true
  return false
}

const BATCH_MS = 10_000
let kuyruk: KullanimOlayi[] = []
let zaman: ReturnType<typeof setTimeout> | null = null
let sonYol = ''
let sonZaman = 0

export function kullanimSifirla(): void {
  kuyruk = []
  if (zaman) clearTimeout(zaman)
  zaman = null
  sonYol = ''
  sonZaman = 0
}

function kuyruga(o: KullanimOlayi): void {
  if (olayPiiIcerirMi(o)) return
  kuyruk.push(o)
  if (!zaman) zaman = setTimeout(() => { void bosalt() }, BATCH_MS)
}

async function bosalt(): Promise<void> {
  zaman = null
  if (!kuyruk.length) return
  const olaylar = kuyruk.splice(0, 40)
  try {
    const { ensureDoctorAccessToken } = await import('@/lib/doktor/clientAuth')
    const token = await ensureDoctorAccessToken()
    if (!token) return
    const govde = JSON.stringify({ olaylar, erisim: token })
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const ok = navigator.sendBeacon('/api/doktor/kullanim', new Blob([govde], { type: 'application/json' }))
      if (ok) return
    }
    void fetch('/api/doktor/kullanim', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ olaylar }),
      keepalive: true,
    })
  } catch { /* telemetri sessiz */ }
}

export function kullanimSayfa(yol: string): void {
  const simdi = Date.now()
  const sure = sonZaman ? simdi - sonZaman : undefined
  const genislik = typeof window !== 'undefined' ? window.innerWidth : undefined
  kuyruga(kullanimOlayiKur({ yol, eylem: 'sayfa_ac', oncekiYol: sonYol || null, sureMs: sure, genislik }))
  sonYol = yol
  sonZaman = simdi
}

export function kullanimEylem(eylem: KullanimEylem, yol?: string): void {
  const genislik = typeof window !== 'undefined' ? window.innerWidth : undefined
  kuyruga(kullanimOlayiKur({ yol: yol || sonYol || '/dashboard/doktor', eylem, oncekiYol: sonYol || null, genislik }))
}

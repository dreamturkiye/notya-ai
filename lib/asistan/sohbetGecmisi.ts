/**
 * NOTYA-ASISTAN-GECMIS-01 (Dr. Gökhan, 2026-10-03) — asistan söyleşisinin son 50 sırası.
 *
 * Yeniden /asistan'a girince (veya mikrofona yeniden dokununca) sohbet sıfırlanıyordu.
 * WhatsApp gibi: son 50 balon kalır; 51. gelince en eski (FIFO) düşer. Persona başına ayrı
 * depo (Ayşe / Fatma karışmaz). Yalnız istemci localStorage — sunucuya PHI yazılmaz.
 */

export const SOHBET_AZAMI = 50
export const SOHBET_ANAHTAR_ONEKI = 'notya_asistan_sohbet_v1_'

export type SakliSesMesaj = {
  id: string
  role: 'user' | 'ai'
  text: string
  sira: number
  olay?: number
}

export type SakliYaziliMesaj = {
  rol: 'doktor' | 'asistan'
  icerik: string
  sira: number
}

export type SakliSohbet = { ses: SakliSesMesaj[]; yazili: SakliYaziliMesaj[] }

const BOS: SakliSohbet = { ses: [], yazili: [] }

export function sohbetAnahtar(personaId: string): string {
  const id = String(personaId || 'aysekaya').replace(/[^\w.-]+/g, '_').slice(0, 64)
  return `${SOHBET_ANAHTAR_ONEKI}${id}`
}

/** First-in first-out: keep the last `azami` items. */
export function fifoKirp<T>(arr: T[], azami = SOHBET_AZAMI): T[] {
  if (!Array.isArray(arr) || arr.length === 0) return []
  if (arr.length <= azami) return arr.slice()
  return arr.slice(arr.length - azami)
}

/**
 * Ses + yazılı tek zaman çizgisinde (sira); toplam azami balon — en eskiler düşer.
 * Sira yoksa dizi sırası kullanılır.
 */
export function sohbetFifoKirp(
  ses: SakliSesMesaj[],
  yazili: SakliYaziliMesaj[],
  azami = SOHBET_AZAMI,
): SakliSohbet {
  type Birlesik =
    | { tur: 'ses'; sira: number; i: number; m: SakliSesMesaj }
    | { tur: 'yazili'; sira: number; i: number; m: SakliYaziliMesaj }
  const birlesik: Birlesik[] = [
    ...ses.map((m, i) => ({ tur: 'ses' as const, sira: Number(m.sira) || 0, i, m })),
    ...yazili.map((m, i) => ({ tur: 'yazili' as const, sira: Number(m.sira) || 0, i, m })),
  ]
  birlesik.sort((a, b) => a.sira - b.sira || a.i - b.i)
  const kalan = birlesik.length <= azami ? birlesik : birlesik.slice(birlesik.length - azami)
  return {
    ses: kalan.filter((x): x is Extract<Birlesik, { tur: 'ses' }> => x.tur === 'ses').map((x) => x.m),
    yazili: kalan.filter((x): x is Extract<Birlesik, { tur: 'yazili' }> => x.tur === 'yazili').map((x) => x.m),
  }
}

function sesTemizle(m: unknown): SakliSesMesaj | null {
  if (!m || typeof m !== 'object') return null
  const o = m as Record<string, unknown>
  const role = o.role === 'user' || o.role === 'ai' ? o.role : null
  const text = typeof o.text === 'string' ? o.text.trim() : ''
  if (!role || !text) return null
  const sira = Number(o.sira)
  const id = typeof o.id === 'string' && o.id ? o.id : `g-${sira || 0}-${Math.random().toString(36).slice(2, 8)}`
  const out: SakliSesMesaj = { id, role, text: text.slice(0, 8000), sira: Number.isFinite(sira) ? sira : 0 }
  if (typeof o.olay === 'number' && Number.isFinite(o.olay)) out.olay = o.olay
  return out
}

function yaziliTemizle(m: unknown): SakliYaziliMesaj | null {
  if (!m || typeof m !== 'object') return null
  const o = m as Record<string, unknown>
  const rol = o.rol === 'doktor' || o.rol === 'asistan' ? o.rol : null
  const icerik = typeof o.icerik === 'string' ? o.icerik.trim() : ''
  if (!rol || !icerik) return null
  const sira = Number(o.sira)
  return { rol, icerik: icerik.slice(0, 8000), sira: Number.isFinite(sira) ? sira : 0 }
}

export function sohbetCoz(ham: unknown): SakliSohbet {
  if (!ham || typeof ham !== 'object') return { ...BOS }
  const o = ham as Record<string, unknown>
  const ses = (Array.isArray(o.ses) ? o.ses : []).map(sesTemizle).filter((x): x is SakliSesMesaj => !!x)
  const yazili = (Array.isArray(o.yazili) ? o.yazili : []).map(yaziliTemizle).filter((x): x is SakliYaziliMesaj => !!x)
  return sohbetFifoKirp(ses, yazili)
}

export function sohbetOku(personaId: string, depo: Storage | null = typeof localStorage !== 'undefined' ? localStorage : null): SakliSohbet {
  if (!depo) return { ...BOS }
  try {
    const raw = depo.getItem(sohbetAnahtar(personaId))
    if (!raw) return { ...BOS }
    return sohbetCoz(JSON.parse(raw) as unknown)
  } catch {
    return { ...BOS }
  }
}

export function sohbetYaz(
  personaId: string,
  ses: SakliSesMesaj[],
  yazili: SakliYaziliMesaj[],
  depo: Storage | null = typeof localStorage !== 'undefined' ? localStorage : null,
): SakliSohbet {
  const kirpilmis = sohbetFifoKirp(ses, yazili)
  if (!depo) return kirpilmis
  try {
    depo.setItem(sohbetAnahtar(personaId), JSON.stringify(kirpilmis))
  } catch { /* kota / gizli mod */ }
  return kirpilmis
}

export function sohbetMaxSira(g: SakliSohbet): number {
  let m = 0
  for (const x of g.ses) if (x.sira > m) m = x.sira
  for (const x of g.yazili) if (x.sira > m) m = x.sira
  return m
}

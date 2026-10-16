/**
 * MBYS-BILDIR-01 (2026-10-16) — "Muayeneyi Bildir": one click on an approved muayene, with a mandatory doctor
 * confirmation and an append-only audit trail.
 *
 * WHAT IS REAL AND WHAT IS NOT
 *   - Real: the payload (lib/enabiz/mbys/kayit.ts), the pre-send checks (kontrol.ts), the confirmation gate and the
 *     audit log below, and the hand-over to the doctor's browser helper (extension) or the clipboard.
 *   - NOT real: any submission to MBYS from a Notya server. No Ministry API, credential flow or contract exists in
 *     this repo (docs/MBYS-YARDIMCI.md: "Notya does not integrate with the Ministry"; `live_write=false` in
 *     lib/enabiz/paket.ts). The only server-side adapter is therefore {@link taslakAdaptoru}, a stub that says so and
 *     never reports a submission. The browser helper fills MBYS fields; the doctor still presses every MBYS button.
 *
 * Pure module (no I/O) so the gate and the adapter contract are testable without a database.
 */
import { createHash } from 'node:crypto'
import type { MbysEksik, MbysKayit } from './kontrol'

/** Audit events, in the order a bildirim goes through them. */
export type BildirimOlay = 'onaylandi' | 'devredildi' | 'devir_basarisiz'
export const BILDIRIM_OLAYLARI: readonly BildirimOlay[] = ['onaylandi', 'devredildi', 'devir_basarisiz']

/** How the record left Notya: `yardimci` = browser helper, `pano` = clipboard text. There is no server channel. */
export type BildirimKanal = 'yardimci' | 'pano'
export const BILDIRIM_KANALLARI: readonly BildirimKanal[] = ['yardimci', 'pano']

/** What the browser reports back after the hand-over attempt. */
export type DevirSonucu = 'yardimci' | 'panoya' | 'basarisiz'
export function devirSonucuCoz(ham: unknown): DevirSonucu | null {
  return ham === 'yardimci' || ham === 'panoya' || ham === 'basarisiz' ? ham : null
}

// ── Payload fingerprint ────────────────────────────────────────────────────────────────────────────────────────

function kararli(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(kararli)
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    return Object.fromEntries(Object.keys(o).sort().map((k) => [k, kararli(o[k])]))
  }
  return v
}

/**
 * SHA-256 of the record the doctor is shown. `hazirlandi` (a build timestamp) is excluded, so the same content
 * hashes the same; anything else changing (a note edit, an identity fix, a diagnosis) changes the hash. The doctor
 * confirms THIS hash; a different payload at confirm time is refused.
 */
export function kayitOzeti(kayit: MbysKayit): string {
  const { hazirlandi: _atla, ...icerik } = kayit
  return createHash('sha256').update(JSON.stringify(kararli(icerik))).digest('hex')
}

// ── Confirmation gate ──────────────────────────────────────────────────────────────────────────────────────────

export type KapiGirdi = {
  rol: 'doktor' | 'sekreter'
  notOnayli: boolean
  /** The patient refused e-Nabız sharing. */
  kilit: boolean
  eksikler: MbysEksik[]
  /** The doctor explicitly confirmed in the dialog (`onay: true` in the request body). */
  onayVerildi: boolean
  /** The hash the doctor saw and confirmed. */
  gonderilenOzet: string
  /** The hash of the record as it is right now. */
  guncelOzet: string
}

export type KapiSonucu =
  | { izin: true }
  | { izin: false; kod: 'rol' | 'not_onaysiz' | 'hasta_izni_yok' | 'eksik' | 'onay_yok' | 'ozet_uyusmuyor'; mesaj: string; durum: number }

/** Order matters: who is asking, then what the record is, then whether the doctor confirmed exactly this record. */
export function bildirimKapisi(g: KapiGirdi): KapiSonucu {
  if (g.rol !== 'doktor') return { izin: false, kod: 'rol', durum: 403, mesaj: 'Muayeneyi yalnız hekim bildirebilir.' }
  if (!g.notOnayli) return { izin: false, kod: 'not_onaysiz', durum: 409, mesaj: 'Muayene notu henüz onaylanmadı. Önce notu onaylayın.' }
  if (g.kilit) return { izin: false, kod: 'hasta_izni_yok', durum: 409, mesaj: 'Hasta e-Nabız’a gönderilmesini istemiyor.' }
  if (g.eksikler.length) return { izin: false, kod: 'eksik', durum: 422, mesaj: `Bildirim için eksik bilgi var: ${g.eksikler.map((e) => e.mesaj).join('; ')}` }
  if (!g.onayVerildi) return { izin: false, kod: 'onay_yok', durum: 400, mesaj: 'Bildirim için hekim onayı gerekli.' }
  if (!g.gonderilenOzet || g.gonderilenOzet !== g.guncelOzet) {
    return { izin: false, kod: 'ozet_uyusmuyor', durum: 409, mesaj: 'Onayladığınız kayıt değişti. Lütfen güncel kaydı gözden geçirip yeniden onaylayın.' }
  }
  return { izin: true }
}

// ── Adapter interface (server-side submission) ─────────────────────────────────────────────────────────────────

export type AdaptorSonucu = {
  /** true ONLY when a Ministry system confirmed receipt. Never true for a stub or a hand-over to the browser. */
  gonderildi: boolean
  mod: 'stub' | 'gercek'
  /** Doctor-facing Turkish text; shown as is. */
  mesaj: string
  /** Receipt reference from the Ministry, only with gonderildi = true. */
  referans?: string
}

export interface MbysBildirimAdaptoru {
  readonly ad: string
  /** true only for an adapter that really calls MBYS. */
  readonly gercek: boolean
  gonder(kayit: MbysKayit): Promise<AdaptorSonucu>
}

/**
 * The only adapter that exists today: an honest stub. MBYS accepts no submission from a server we can call (no API,
 * no credential flow in the repo), so it sends nothing and says so. A real adapter must implement the same interface,
 * return `gonderildi: true` only on a confirmed receipt, and ship with a test against the real endpoint.
 */
export const taslakAdaptoru: MbysBildirimAdaptoru = {
  ad: 'taslak',
  gercek: false,
  async gonder() {
    return {
      gonderildi: false,
      mod: 'stub',
      mesaj: 'Notya MBYS’ye doğrudan gönderim yapmaz. Kayıt tarayıcınıza devredilir; MBYS’deki her düğmeye siz basarsınız.',
    }
  },
}

export function adaptorSec(): MbysBildirimAdaptoru {
  return taslakAdaptoru
}

// ── Audit rows ─────────────────────────────────────────────────────────────────────────────────────────────────

export type GunlukSatiri = {
  doctor_id: string
  patient_id: string
  note_id: string
  olay: BildirimOlay
  /** null on 'onaylandi' (no channel chosen yet). */
  kanal: BildirimKanal | null
  payload_hash: string
  /** The 'onaylandi' row this event belongs to. */
  onay_id: string | null
  /** Field names that were missing; never values. */
  eksik_alanlar: string[]
  gonderildi: false
}

/** No clinical text, identity or diagnosis ever goes into the log: ids, the fingerprint and the outcome only. */
export function gunlukSatiri(g: Omit<GunlukSatiri, 'gonderildi' | 'eksik_alanlar'> & { eksik_alanlar?: string[] }): GunlukSatiri {
  return { ...g, eksik_alanlar: g.eksik_alanlar ?? [], gonderildi: false }
}

export function devirOlayi(s: DevirSonucu): { olay: BildirimOlay; kanal: BildirimKanal | null } {
  if (s === 'yardimci') return { olay: 'devredildi', kanal: 'yardimci' }
  if (s === 'panoya') return { olay: 'devredildi', kanal: 'pano' }
  return { olay: 'devir_basarisiz', kanal: null }
}

/**
 * NOTYA-SES-PROFILI-01 — browser side of the voice-profile engine.
 *
 * - `sesProfiliMotoru()`: the Web Worker (isci.ts), created lazily — only for a doctor who has a profile or is
 *   enrolling, so nobody else pays the model download. Any failure rejects; callers then behave as without a profile.
 * - `sesProfiliGetir()` / `sesProfiliKaydet()` / `sesProfiliSil()`: the owner-only API (/api/doktor/ses-profili).
 * - `ProfilDogrulayici`: per voice session, turns 16 kHz detector frames into a verdict for the current speech
 *   segment (rules: eslesme.ts) and keeps the anonymous counters.
 */
import { SES_PROFILI_AYAR, SES_PROFILI_BOYUT, SES_PROFILI_MODEL_SURUMU, SES_PROFILI_MODEL_YOLU, type ProfilKarari } from '@/lib/asistan/sesProfili/ayar'
import { bolumSesi, dogrulamaAdimi, dogrulamaBaslat, puanGeldi, sayacBaslat, sayacEkle, tamponBaslat, tamponEkle, type DogrulamaDurumu, type ProfilSayac } from '@/lib/asistan/sesProfili/eslesme'

const PUAN_ZAMAN_ASIMI_MS = 2500
const GOMME_ZAMAN_ASIMI_MS = 30_000
const YUKLEME_ZAMAN_ASIMI_MS = 20_000

export type SesProfiliMotoru = {
  hazir: () => Promise<void>
  gomme: (pcm: Float32Array, hz: number) => Promise<Float32Array>
  puan: (pcm16: Float32Array, profil: Float32Array) => Promise<number>
}

let motor: SesProfiliMotoru | null = null

export function sesProfiliMotoru(): SesProfiliMotoru {
  if (motor) return motor
  const isci = new Worker(new URL('./isci.ts', import.meta.url), { type: 'module' })
  let sira = 0
  const bekleyen = new Map<number, { coz: (v: { gomme?: Float32Array; skor?: number }) => void; red: (e: Error) => void }>()
  const bozuldu = (e: Error) => {
    for (const b of bekleyen.values()) b.red(e)
    bekleyen.clear()
    motor = null
    try { isci.terminate() } catch { /* */ }
  }
  isci.onmessage = (e: MessageEvent<{ id: number; ok: boolean; gomme?: Float32Array; skor?: number; hata?: string }>) => {
    const b = bekleyen.get(e.data.id)
    if (!b) return
    bekleyen.delete(e.data.id)
    if (e.data.ok) b.coz(e.data)
    else b.red(new Error(e.data.hata || 'ses_profili_hata'))
  }
  isci.onerror = () => bozuldu(new Error('ses_profili_isci'))
  const iste = (m: Record<string, unknown>, sure: number, aktar: Transferable[] = []) => new Promise<{ gomme?: Float32Array; skor?: number }>((coz, red) => {
    const id = ++sira
    const z = setTimeout(() => { bekleyen.delete(id); red(new Error('ses_profili_zaman')) }, sure)
    bekleyen.set(id, { coz: (v) => { clearTimeout(z); coz(v) }, red: (err) => { clearTimeout(z); red(err) } })
    isci.postMessage({ ...m, id }, aktar)
  })
  let yuklendi: Promise<void> | null = null
  const hazir = () => {
    if (!yuklendi) {
      yuklendi = iste({ t: 'yukle', url: SES_PROFILI_MODEL_YOLU }, YUKLEME_ZAMAN_ASIMI_MS).then(() => undefined)
      yuklendi.catch(() => { yuklendi = null })
    }
    return yuklendi
  }
  motor = {
    hazir,
    gomme: async (pcm, hz) => {
      await hazir()
      const r = await iste({ t: 'gomme', pcm, hz }, GOMME_ZAMAN_ASIMI_MS)
      if (!(r.gomme instanceof Float32Array) || r.gomme.length !== SES_PROFILI_BOYUT) throw new Error('ses_profili_gomme')
      return r.gomme
    },
    puan: async (pcm16, profil) => {
      await hazir()
      const r = await iste({ t: 'puan', pcm: pcm16, profil }, PUAN_ZAMAN_ASIMI_MS)
      if (typeof r.skor !== 'number' || !Number.isFinite(r.skor)) throw new Error('ses_profili_puan')
      return r.skor
    },
  }
  return motor
}

/* ---- API (owner only) ---- */

export type SesProfiliKaydi = { var: boolean; profil: Float32Array | null; modelSurumu: string | null; rizaZamani: string | null; olusturma: string | null; guncelleme: string | null }

export async function sesProfiliGetir(jeton: string): Promise<SesProfiliKaydi | null> {
  try {
    const r = await fetch('/api/doktor/ses-profili', { headers: { Authorization: `Bearer ${jeton}` }, cache: 'no-store' })
    if (!r.ok) return null
    const j = (await r.json()) as { var?: boolean; profil?: number[]; model_surumu?: string; riza_zamani?: string; created_at?: string; updated_at?: string }
    const profil = Array.isArray(j.profil) && j.profil.length === SES_PROFILI_BOYUT ? Float32Array.from(j.profil) : null
    return { var: Boolean(j.var), profil, modelSurumu: j.model_surumu ?? null, rizaZamani: j.riza_zamani ?? null, olusturma: j.created_at ?? null, guncelleme: j.updated_at ?? null }
  } catch {
    return null
  }
}

export async function sesProfiliKaydet(jeton: string, profil: Float32Array): Promise<boolean> {
  try {
    const r = await fetch('/api/doktor/ses-profili', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jeton}` },
      body: JSON.stringify({ profil: Array.from(profil), model_surumu: SES_PROFILI_MODEL_SURUMU, riza: true }),
    })
    return r.ok
  } catch {
    return false
  }
}

export async function sesProfiliSil(jeton: string): Promise<boolean> {
  try {
    const r = await fetch('/api/doktor/ses-profili', { method: 'DELETE', headers: { Authorization: `Bearer ${jeton}` } })
    return r.ok
  } catch {
    return false
  }
}

/** Anonymous counters at the end of a voice session (verdict counts only). Best effort. */
export function sayaclariGonder(jeton: string | null, s: ProfilSayac): void {
  if (!jeton || !(s.kabul || s.red || s.belirsiz || s.kisa)) return
  try {
    void fetch('/api/asistan/ses-profili-sayac', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jeton}` },
      body: JSON.stringify({ ...s, model_surumu: SES_PROFILI_MODEL_SURUMU }),
      keepalive: true,
    }).catch(() => undefined)
  } catch { /* sayaç kritik değil */ }
}

/* ---- Runtime verifier ---- */

export class ProfilDogrulayici {
  private durum: DogrulamaDurumu = dogrulamaBaslat()
  private tampon = tamponBaslat()
  private sayaclar: ProfilSayac = sayacBaslat()
  private sonRedT = 0
  private bozuk = false

  constructor(private readonly profil: Float32Array, private readonly motor: SesProfiliMotoru) {}

  /** One detector frame: `sesli` = the gate's speech decision, `pcm` = the 16 kHz frame, `puanla` = Ayşe is speaking. */
  kare(t: number, sesli: boolean, pcm: Float32Array | null, puanla: boolean): void {
    if (this.bozuk) return
    if (pcm && pcm.length) tamponEkle(this.tampon, t, new Float32Array(pcm))
    const r = dogrulamaAdimi(this.durum, { t, sesli })
    this.durum = r.durum
    this.sayaclar = sayacEkle(this.sayaclar, r.bitti)
    if (!r.puanla) return
    const bolum = this.durum.bolum
    if (!puanla) { this.durum = puanGeldi(this.durum, { bolum, skor: null }); return }
    const ses = bolumSesi(this.tampon, this.durum.bolumBas)
    this.motor.puan(ses, this.profil).then((skor) => {
      const onceki = this.durum.karar
      this.durum = puanGeldi(this.durum, { bolum, skor })
      if (this.durum.karar === 'red' && onceki !== 'red') this.sonRedT = Date.now()
    }).catch(() => {
      // Engine gone: from now on this session behaves exactly as without a profile.
      this.bozuk = true
      this.durum = dogrulamaBaslat()
    })
  }

  /** Verdict of the current segment; null when there is none yet. */
  karar(): ProfilKarari | null {
    return this.bozuk ? null : this.durum.karar
  }

  /** Usable at all (false after an engine failure → callers drop the profile input entirely). */
  calisiyor(): boolean {
    return !this.bozuk
  }

  /** A rejection happened recently (a new segment waits for its verdict before cutting her off). */
  redYeni(t: number): boolean {
    return this.sonRedT > 0 && t - this.sonRedT < SES_PROFILI_AYAR.redSonrasiMs
  }

  sayac(): ProfilSayac {
    return this.sayaclar
  }
}

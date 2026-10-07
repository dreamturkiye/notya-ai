/**
 * NOTYA-AYSE-GURULTU-01 — browser glue for the ElevenLabs speech gate (rules: lib/asistan/konusmaKapisi.ts).
 *
 * - Microphone: the SAME stream the ElevenLabs SDK opened (no second getUserMedia, no second permission prompt).
 *   The SDK (1.17) does not expose it publicly; `sdkMikrofonAkisi` reads it defensively and anything unexpected
 *   means "no gate". We never stop its tracks — the SDK owns them.
 * - Detector: Silero (lib/asistan/fishSilero.ts) on that stream plus an RMS analyser on our own AudioContext.
 * - Mute: only the SDK's own API, `setMicMuted` (the SDK keeps streaming silence while muted).
 * - Fail open: no flag, no stream, no Silero, or any throw → the microphone is unmuted and the gate is gone.
 *   A watchdog unmutes whenever Ayşe is not speaking, whatever the state machine says.
 */
import { kapiAdimi, kapiBaslat, kapiTarayicidaAcikMi, type KapiDurumu } from '@/lib/asistan/konusmaKapisi'
import { FISH_SILERO_TAZELIK_MS, rmsHesapla } from '@/lib/asistan/fishVad'
import { sileroAc, type SileroKapi } from '@/lib/asistan/fishSilero'

export const KAPI_BEKCI_MS = 100

type SusturulabilirKonusma = { setMicMuted: (sessiz: boolean) => void }

export type ElevenKapi = {
  /** Mirror of the SDK mode: true while Ayşe speaks. false unmutes at once. */
  ajanModu: (konusuyor: boolean) => void
  /** Local speech evidence right now (Silero + RMS floor) — the resume window listens to this. */
  konusmaVarMi: () => boolean
  kapat: () => void
}

/** The SDK's own microphone stream, or null. Duck-typed so it is testable and survives a changed SDK shape. */
export function sdkMikrofonAkisi(konusma: unknown): MediaStream | null {
  try {
    const girdi = (konusma as { input?: unknown } | null)?.input as { inputStream?: unknown } | undefined
    const akis = girdi?.inputStream as MediaStream | undefined
    if (!akis || typeof akis.getAudioTracks !== 'function') return null
    const izler = akis.getAudioTracks()
    if (!izler.some((t) => t && t.readyState === 'live')) return null
    return akis
  } catch {
    return null
  }
}

function sessizlestir(konusma: SusturulabilirKonusma, sessiz: boolean): void {
  try { konusma.setMicMuted(sessiz) } catch { /* session already closed */ }
}

export async function elevenKapiKur(konusma: SusturulabilirKonusma, g: { onKonusma?: (sesli: boolean, t: number) => void } = {}): Promise<ElevenKapi | null> {
  if (typeof window === 'undefined') return null
  if (!kapiTarayicidaAcikMi()) {
    console.info('[ses-kapi]', { kapi: 'kapali', neden: 'anahtar' })
    return null
  }
  const akis = sdkMikrofonAkisi(konusma)
  if (!akis) {
    console.info('[ses-kapi]', { kapi: 'kapali', neden: 'akis_yok' })
    return null
  }
  let baglam: AudioContext | null = null
  let silero: SileroKapi | null = null
  let bekci: ReturnType<typeof setInterval> | null = null
  let kapali = false
  let durum: KapiDurumu = kapiBaslat()
  let ajan = false
  let sessiz = false
  const ornek = new Float32Array(1024)
  let olcer: AnalyserNode | null = null
  const dugumler: AudioNode[] = []

  const birak = () => {
    if (kapali) return
    kapali = true
    if (bekci) { clearInterval(bekci); bekci = null }
    sessiz = false
    sessizlestir(konusma, false)
    for (const d of dugumler) { try { d.disconnect() } catch { /* */ } }
    const s = silero
    silero = null
    if (s) void s.kapat()
    const b = baglam
    baglam = null
    if (b && b.state !== 'closed') void b.close().catch(() => undefined)
  }

  const adim = (t: number, p: number | null) => {
    if (kapali) return
    try {
      let rms = 0
      if (olcer) { olcer.getFloatTimeDomainData(ornek); rms = rmsHesapla(ornek) }
      durum = kapiAdimi(durum, { t, ajanKonusuyor: ajan, p, rms })
      const istenen = ajan && !durum.acik
      if (istenen !== sessiz) {
        sessiz = istenen
        sessizlestir(konusma, sessiz)
      }
      g.onKonusma?.(durum.konusuyor, t)
    } catch (e) {
      console.info('[ses-kapi]', { kapi: 'kapali', neden: 'hata', hata: e instanceof Error ? e.message : 'hata' })
      birak()
    }
  }

  try {
    const Pencere = window as Window & { webkitAudioContext?: typeof AudioContext }
    const Kur = window.AudioContext || Pencere.webkitAudioContext
    if (!Kur) throw new Error('ses_baglami_yok')
    baglam = new Kur()
    if (baglam.state === 'suspended') await baglam.resume().catch(() => undefined)
    const kaynak = baglam.createMediaStreamSource(akis)
    olcer = baglam.createAnalyser()
    olcer.fftSize = 1024
    // Safari only feeds an analyser that reaches the destination; at ~0 gain nothing is heard.
    const kis = baglam.createGain()
    kis.gain.value = 0.0001
    kaynak.connect(olcer)
    olcer.connect(kis)
    kis.connect(baglam.destination)
    dugumler.push(kaynak, olcer, kis)
    silero = await sileroAc(akis, baglam, { zorla: true, etiket: '[ses-kapi]', onKare: (p, t) => adim(t, p) })
    if (!silero) throw new Error('silero_yok')
    if (kapali) { birak(); return null }
  } catch (e) {
    console.info('[ses-kapi]', { kapi: 'kapali', neden: e instanceof Error ? e.message : 'hata' })
    birak()
    return null
  }

  // Watchdog: steps the machine between Silero frames (stale → unknown → open) and guarantees the microphone is
  // never left muted while Ayşe is not speaking.
  bekci = setInterval(() => {
    if (kapali) return
    if (!ajan && sessiz) { sessiz = false; sessizlestir(konusma, false) }
    const s = silero?.olasilik() ?? null
    const t = Date.now()
    adim(t, s && t - s.zaman <= FISH_SILERO_TAZELIK_MS ? s.p : null)
  }, KAPI_BEKCI_MS)
  console.info('[ses-kapi]', { kapi: 'acik' })

  return {
    ajanModu: (konusuyor: boolean) => {
      if (kapali) return
      ajan = konusuyor
      if (!konusuyor && sessiz) { sessiz = false; sessizlestir(konusma, false) }
      const s = silero?.olasilik() ?? null
      const t = Date.now()
      adim(t, s && t - s.zaman <= FISH_SILERO_TAZELIK_MS ? s.p : null)
    },
    konusmaVarMi: () => !kapali && durum.konusuyor,
    kapat: birak,
  }
}

/**
 * Browser mic for Ayşe — PCM WAV to Fish ASR (docs: wav / opus / mp3).
 * Capture AudioContext is separate from Haberci playback. Analyser / ScriptProcessor
 * must reach destination (muted) or Safari reports silence and the turn never starts.
 */
import { FISH_AZAMI_TUR_MS, FISH_BARGE_ESIK, FISH_MIN_KONUSMA_MS, bargeSayaci, kareKonusmasi, klipGonderilirMi, onTamponuKirp, rmsHesapla, sessizlikKuyrugu, type SileroOlasilik } from '@/lib/asistan/fishVad'
import { fishAsrDosyaAdi } from '@/lib/asistan/fishSes'

export { fishAsrDosyaAdi }

export async function fishAkisAc(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
    },
  })
}

export function fishDinleBaglamAc(): AudioContext {
  const Pencere = window as Window & { webkitAudioContext?: typeof AudioContext }
  const Kur = window.AudioContext || Pencere.webkitAudioContext
  if (!Kur) throw new Error('ses yok')
  const ctx = new Kur()
  void ctx.resume()
  return ctx
}

export function fishAkisKapat(s: MediaStream | null | undefined): void {
  for (const t of s?.getTracks() || []) {
    try { t.stop() } catch { /* already stopped */ }
  }
}

/** Mono 16-bit PCM WAV — Fish's documented ASR example format. */
export function pcmdenWav(parcalar: Float32Array[], hz: number): Blob {
  let n = 0
  for (const p of parcalar) n += p.length
  const buf = new ArrayBuffer(44 + n * 2)
  const v = new DataView(buf)
  const yaz = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  yaz(0, 'RIFF')
  v.setUint32(4, 36 + n * 2, true)
  yaz(8, 'WAVE')
  yaz(12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, 1, true)
  v.setUint32(24, hz, true)
  v.setUint32(28, hz * 2, true)
  v.setUint16(32, 2, true)
  v.setUint16(34, 16, true)
  yaz(36, 'data')
  v.setUint32(40, n * 2, true)
  let o = 44
  for (const p of parcalar) {
    for (let i = 0; i < p.length; i++) {
      const x = Math.max(-1, Math.min(1, p[i]))
      v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true)
      o += 2
    }
  }
  return new Blob([buf], { type: 'audio/wav' })
}

function kayitTuru(): string {
  const aday = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  return aday.find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(t)) || ''
}

type DinleGirdi = {
  iptal: () => boolean
  ajanKonusuyorMu: () => boolean
  bargeIn: () => void
  /** NOTYA-SILERO-01: latest Silero speech probability, or null → RMS gate. */
  silero?: () => SileroOlasilik
}

function dugumleriKopar(...dugum: AudioNode[]): void {
  for (const d of dugum) {
    try { d.disconnect() } catch { /* */ }
  }
}

export async function fishBirTurKaydet(
  akis: MediaStream,
  baglam: AudioContext,
  g: DinleGirdi,
): Promise<Blob | null> {
  if (baglam.state === 'suspended') await baglam.resume().catch(() => undefined)
  const kaynak = baglam.createMediaStreamSource(akis)
  const sessiz = baglam.createGain()
  sessiz.gain.value = 0.0001
  const islemciKur = typeof baglam.createScriptProcessor === 'function'
  if (islemciKur) return pcmTurKaydet(akis, baglam, kaynak, sessiz, g)
  return mediaTurKaydet(akis, baglam, kaynak, sessiz, g)
}

function pcmTurKaydet(
  _akis: MediaStream,
  baglam: AudioContext,
  kaynak: MediaStreamAudioSourceNode,
  sessiz: GainNode,
  g: DinleGirdi,
): Promise<Blob | null> {
  const islem = baglam.createScriptProcessor(2048, 1, 1)
  const parcalar: Float32Array[] = []
  const kareMs = (2048 / baglam.sampleRate) * 1000
  let duydu = false
  let konusmaBas = 0
  let sessizBas = 0
  let bargeMs = 0
  let sesliMs = 0
  let oncekiSes = false
  let kaynakAdi: 'silero' | 'rms' = 'rms'

  return new Promise((coz) => {
    let bitti = false
    const bitir = (blob: Blob | null) => {
      if (bitti) return
      bitti = true
      islem.onaudioprocess = null
      dugumleriKopar(kaynak, islem, sessiz)
      coz(blob && blob.size > 800 ? blob : null)
    }
    /** Turn ended: send only if it carries real speech, otherwise keep listening. */
    const turuBitir = () => {
      let n = 0
      for (const p of parcalar) n += p.length
      const karar = klipGonderilirMi({ toplamMs: (n / baglam.sampleRate) * 1000, sesliMs })
      if (!karar.gonder) {
        console.info('[fish-mic]', { atlandi: karar.neden, vad: kaynakAdi, sesli_ms: Math.round(sesliMs), toplam_ms: Math.round((n / baglam.sampleRate) * 1000) })
        bitir(null)
        return
      }
      bitir(pcmdenWav(parcalar, baglam.sampleRate))
    }
    const bekci = () => {
      if (bitti) return
      if (g.iptal()) { bitir(null); return }
      setTimeout(bekci, 200)
    }
    bekci()

    islem.onaudioprocess = (ev) => {
      if (bitti) return
      if (g.iptal()) { bitir(null); return }
      const ch = ev.inputBuffer.getChannelData(0)
      const rms = rmsHesapla(ch)
      const simdi = Date.now()
      const kare = kareKonusmasi({ rms, silero: g.silero?.() ?? null, onceki: oncekiSes, simdi })
      const ses = kare.ses
      oncekiSes = ses
      kaynakAdi = kare.kaynak
      const ajan = g.ajanKonusuyorMu()

      const barge = bargeSayaci(bargeMs, ajan, rms, (2048 / baglam.sampleRate) * 1000)
      bargeMs = barge.ms
      if (barge.kes) g.bargeIn()

      if (ajan) {
        // Playback only — queued TTS fetch is not "she's talking". Keep doctor-level
        // energy (barge threshold) so a question in the gap between sentences is not wiped.
        if (rms >= FISH_BARGE_ESIK) {
          if (!duydu) {
            duydu = true
            konusmaBas = simdi
          }
          parcalar.push(new Float32Array(ch))
          sesliMs += kareMs
          sessizBas = 0
        } else if (!duydu) {
          parcalar.length = 0
        }
        return
      }

      parcalar.push(new Float32Array(ch))
      if (!duydu) onTamponuKirp(parcalar, baglam.sampleRate)
      if (ses) {
        if (!duydu) {
          duydu = true
          konusmaBas = simdi
        }
        sesliMs += kareMs
        sessizBas = 0
      } else if (duydu) {
        if (!sessizBas) sessizBas = simdi
        const konusmaMs = simdi - konusmaBas
        if (konusmaMs >= FISH_MIN_KONUSMA_MS && simdi - sessizBas >= sessizlikKuyrugu(kaynakAdi)) {
          turuBitir()
          return
        }
      }

      if (duydu && simdi - konusmaBas > FISH_AZAMI_TUR_MS) {
        turuBitir()
      }
    }
    kaynak.connect(islem)
    islem.connect(sessiz)
    sessiz.connect(baglam.destination)
  })
}

function mediaTurKaydet(
  akis: MediaStream,
  baglam: AudioContext,
  kaynak: MediaStreamAudioSourceNode,
  sessiz: GainNode,
  g: DinleGirdi,
): Promise<Blob | null> {
  if (typeof MediaRecorder === 'undefined') {
    dugumleriKopar(kaynak, sessiz)
    return Promise.resolve(null)
  }
  const olcer = baglam.createAnalyser()
  olcer.fftSize = 2048
  kaynak.connect(olcer)
  olcer.connect(sessiz)
  sessiz.connect(baglam.destination)
  const ornek = new Float32Array(olcer.fftSize)

  const tur = kayitTuru()
  const kayit = new MediaRecorder(akis, tur ? { mimeType: tur } : undefined)
  const parcalar: BlobPart[] = []
  kayit.ondataavailable = (e) => { if (e.data?.size) parcalar.push(e.data) }

  let duydu = false
  let konusmaBas = 0
  let sessizBas = 0
  let bargeMs = 0
  let sesliMs = 0
  let kayitBas = 0
  let oncekiSes = false
  let kaynakAdi: 'silero' | 'rms' = 'rms'

  return new Promise((coz) => {
    let bitti = false
    let vazgec = false
    const bitir = (blob: Blob | null) => {
      if (bitti) return
      bitti = true
      dugumleriKopar(kaynak, olcer, sessiz)
      if (kayit.state !== 'inactive') {
        try { kayit.stop() } catch { /* */ }
      }
      coz(blob)
    }
    kayit.onstop = () => {
      if (vazgec) { bitir(null); return }
      const karar = klipGonderilirMi({ toplamMs: kayitBas ? Date.now() - kayitBas : 0, sesliMs })
      if (!karar.gonder) {
        console.info('[fish-mic]', { atlandi: karar.neden, sesli_ms: Math.round(sesliMs) })
        bitir(null)
        return
      }
      const blob = parcalar.length ? new Blob(parcalar, { type: kayit.mimeType || tur || 'audio/webm' }) : null
      bitir(blob && blob.size > 800 ? blob : null)
    }
    kayit.onerror = () => bitir(null)

    try { kayit.start(200); kayitBas = Date.now() } catch { bitir(null); return }

    const tik = () => {
      if (bitti) return
      if (g.iptal()) {
        vazgec = true
        if (kayit.state === 'recording') try { kayit.stop() } catch { bitir(null) }
        else bitir(null)
        return
      }
      olcer.getFloatTimeDomainData(ornek)
      const rms = rmsHesapla(ornek)
      const simdi = Date.now()
      const kare = kareKonusmasi({ rms, silero: g.silero?.() ?? null, onceki: oncekiSes, simdi })
      const ses = kare.ses
      oncekiSes = ses
      kaynakAdi = kare.kaynak
      const ajan = g.ajanKonusuyorMu()

      const barge = bargeSayaci(bargeMs, ajan, rms)
      bargeMs = barge.ms
      if (barge.kes) g.bargeIn()

      if (ajan) {
        if (rms >= FISH_BARGE_ESIK) {
          if (!duydu) {
            duydu = true
            konusmaBas = simdi
          }
          sesliMs += 50
          sessizBas = 0
        } else if (!duydu) {
          duydu = false
          konusmaBas = 0
          sessizBas = 0
          sesliMs = 0
        }
        setTimeout(tik, 50)
        return
      }

      if (ses) {
        if (!duydu) {
          duydu = true
          konusmaBas = simdi
        }
        sesliMs += 50
        sessizBas = 0
      } else if (duydu) {
        if (!sessizBas) sessizBas = simdi
        const konusmaMs = simdi - konusmaBas
        if (konusmaMs >= FISH_MIN_KONUSMA_MS && simdi - sessizBas >= sessizlikKuyrugu(kaynakAdi)) {
          try { kayit.stop() } catch { bitir(null) }
          return
        }
      }

      if (duydu && simdi - konusmaBas > FISH_AZAMI_TUR_MS) {
        if (kayit.state === 'recording') try { kayit.stop() } catch { bitir(null) }
        else bitir(null)
        return
      }
      setTimeout(tik, 50)
    }
    tik()
  })
}

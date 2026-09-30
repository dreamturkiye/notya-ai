/**
 * Browser mic for Ayşe — PCM WAV to Fish ASR (docs: wav / opus / mp3).
 * Capture AudioContext is separate from Haberci playback. Analyser / ScriptProcessor
 * must reach destination (muted) or Safari reports silence and the turn never starts.
 */
import { FISH_BARGE_ESIK, bargeSayaci, kareKonusmasi, klipGonderilirMi, onTamponuKirp, rmsHesapla, turAdimi, turBaslat, type SileroOlasilik, type TurDurumu } from '@/lib/asistan/fishVad'
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

/** One clip that left the junk gate. `konusmaBas` / `bitis` are wall-clock ms (turn sequencing, fishTurSirasi). */
export type FishKlip = { blob: Blob; konusmaBas: number; bitis: number; sesliMs: number; toplamMs: number }

function wavBaslik(v: DataView, hz: number, n: number): void {
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
}

/** Mono 16-bit PCM WAV — Fish's documented ASR example format. */
export function pcmdenWav(parcalar: Float32Array[], hz: number): Blob {
  let n = 0
  for (const p of parcalar) n += p.length
  const buf = new ArrayBuffer(44 + n * 2)
  const v = new DataView(buf)
  wavBaslik(v, hz, n)
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

/**
 * NOTYA-SES-TUR-01: two sentences spoken in one breath become one clip — the PCM of our own WAVs is
 * concatenated under one header (same sample rate, mono 16-bit), so the server ASRs one utterance.
 */
export async function wavBirlestir(klipler: Blob[]): Promise<Blob> {
  if (klipler.length === 1) return klipler[0]
  const govdeler: Uint8Array[] = []
  let hz = 0
  for (const b of klipler) {
    const buf = new Uint8Array(await b.arrayBuffer())
    if (buf.byteLength <= 44) continue
    if (!hz) hz = new DataView(buf.buffer, buf.byteOffset).getUint32(24, true)
    govdeler.push(buf.subarray(44))
  }
  let bayt = 0
  for (const g of govdeler) bayt += g.byteLength
  const out = new Uint8Array(44 + bayt)
  wavBaslik(new DataView(out.buffer), hz || 16000, bayt / 2)
  let o = 44
  for (const g of govdeler) { out.set(g, o); o += g.byteLength }
  return new Blob([out], { type: 'audio/wav' })
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

/** Last engine written to the console — the `[fish-vad]` engine line appears at session start and on every switch, not per turn. */
let sonMotor: 'silero' | 'rms' | null = null

function motoruYaz(kaynak: 'silero' | 'rms'): void {
  if (sonMotor === kaynak) return
  console.info('[fish-vad]', { motor: kaynak, gecis: sonMotor !== null })
  sonMotor = kaynak
}

/** One line per turn — client junk gate decision; never the transcript. */
function turKarariYaz(g: { sesliMs: number; toplamMs: number; bayt: number; kaynak: 'silero' | 'rms'; neden: string | null }): void {
  console.info('[fish-vad]', {
    karar: g.neden ? `atlandi:${g.neden}` : 'gonderildi',
    sesli_ms: Math.round(g.sesliMs), toplam_ms: Math.round(g.toplamMs), bayt: g.bayt, motor: g.kaynak,
  })
}

/** Reset the engine memo when a session starts so the first turn logs the engine again. */
export function fishVadGunlukSifirla(): void { sonMotor = null }

function dugumleriKopar(...dugum: AudioNode[]): void {
  for (const d of dugum) {
    try { d.disconnect() } catch { /* */ }
  }
}

export async function fishBirTurKaydet(
  akis: MediaStream,
  baglam: AudioContext,
  g: DinleGirdi,
): Promise<FishKlip | null> {
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
): Promise<FishKlip | null> {
  const islem = baglam.createScriptProcessor(2048, 1, 1)
  const parcalar: Float32Array[] = []
  const kareMs = (2048 / baglam.sampleRate) * 1000
  let tur: TurDurumu = turBaslat()
  let bargeMs = 0
  let oncekiSes = false

  return new Promise((coz) => {
    let bitti = false
    const bitir = (klip: FishKlip | null) => {
      if (bitti) return
      bitti = true
      islem.onaudioprocess = null
      dugumleriKopar(kaynak, islem, sessiz)
      coz(klip && klip.blob.size > 800 ? klip : null)
    }
    /** Turn ended: send only if it carries real speech, otherwise keep listening. */
    const turuBitir = () => {
      let n = 0
      for (const p of parcalar) n += p.length
      const toplamMs = (n / baglam.sampleRate) * 1000
      const karar = klipGonderilirMi({ toplamMs, sesliMs: tur.sesliMs })
      const blob = karar.gonder ? pcmdenWav(parcalar, baglam.sampleRate) : null
      const neden = karar.neden ?? (blob && blob.size <= 800 ? 'kucuk' : null)
      turKarariYaz({ sesliMs: tur.sesliMs, toplamMs, bayt: blob?.size ?? 0, kaynak: tur.kaynak, neden })
      bitir(neden || !blob ? null : { blob, konusmaBas: tur.konusmaBas, bitis: Date.now(), sesliMs: tur.sesliMs, toplamMs })
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
      motoruYaz(kare.kaynak)
      const ajan = g.ajanKonusuyorMu()

      const barge = bargeSayaci(bargeMs, ajan, rms, (2048 / baglam.sampleRate) * 1000)
      bargeMs = barge.ms
      if (barge.kes) g.bargeIn()

      if (ajan) {
        // Playback only — queued TTS fetch is not "she's talking". Keep doctor-level
        // energy (barge threshold) so a question in the gap between sentences is not wiped.
        if (rms >= FISH_BARGE_ESIK) {
          parcalar.push(new Float32Array(ch))
          tur = turAdimi(tur, { ses: true, kaynak: 'rms', simdi, kareMs }).durum
        } else if (!tur.duydu) {
          // NOTYA-SES-TUR-01: keep a rolling pre-roll instead of wiping — the doctor's first word usually
          // starts while the guard is still on (tail of her playback); it must not be cut from the clip.
          parcalar.push(new Float32Array(ch))
          onTamponuKirp(parcalar, baglam.sampleRate)
        }
        return
      }

      parcalar.push(new Float32Array(ch))
      if (!tur.duydu) onTamponuKirp(parcalar, baglam.sampleRate)
      const adim = turAdimi(tur, { ses, kaynak: kare.kaynak, simdi, kareMs })
      tur = adim.durum
      if (adim.bitir) turuBitir()
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
): Promise<FishKlip | null> {
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

  const kayitTipi = kayitTuru()
  const kayit = new MediaRecorder(akis, kayitTipi ? { mimeType: kayitTipi } : undefined)
  const parcalar: BlobPart[] = []
  kayit.ondataavailable = (e) => { if (e.data?.size) parcalar.push(e.data) }

  let tur: TurDurumu = turBaslat()
  let bargeMs = 0
  let kayitBas = 0
  let oncekiSes = false

  return new Promise((coz) => {
    let bitti = false
    let vazgec = false
    const bitir = (klip: FishKlip | null) => {
      if (bitti) return
      bitti = true
      dugumleriKopar(kaynak, olcer, sessiz)
      if (kayit.state !== 'inactive') {
        try { kayit.stop() } catch { /* */ }
      }
      coz(klip)
    }
    kayit.onstop = () => {
      if (vazgec) { bitir(null); return }
      const toplamMs = kayitBas ? Date.now() - kayitBas : 0
      const karar = klipGonderilirMi({ toplamMs, sesliMs: tur.sesliMs })
      const blob = karar.gonder && parcalar.length ? new Blob(parcalar, { type: kayit.mimeType || kayitTipi || 'audio/webm' }) : null
      const neden = karar.neden ?? (!blob || blob.size <= 800 ? 'kucuk' : null)
      turKarariYaz({ sesliMs: tur.sesliMs, toplamMs, bayt: blob?.size ?? 0, kaynak: tur.kaynak, neden })
      bitir(neden || !blob ? null : { blob, konusmaBas: tur.konusmaBas, bitis: Date.now(), sesliMs: tur.sesliMs, toplamMs })
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
      motoruYaz(kare.kaynak)
      const ajan = g.ajanKonusuyorMu()

      const barge = bargeSayaci(bargeMs, ajan, rms)
      bargeMs = barge.ms
      if (barge.kes) g.bargeIn()

      if (ajan) {
        if (rms >= FISH_BARGE_ESIK) tur = turAdimi(tur, { ses: true, kaynak: 'rms', simdi, kareMs: 50 }).durum
        else if (!tur.duydu) tur = turBaslat()
        setTimeout(tik, 50)
        return
      }

      const adim = turAdimi(tur, { ses, kaynak: kare.kaynak, simdi, kareMs: 50 })
      tur = adim.durum
      if (adim.bitir) {
        if (kayit.state === 'recording') try { kayit.stop() } catch { bitir(null) }
        else bitir(null)
        return
      }
      setTimeout(tik, 50)
    }
    tik()
  })
}

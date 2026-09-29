/**
 * Browser mic for Ayşe — one utterance, then silence. Echo cancellation on;
 * barge-in only while Haberci is speaking.
 */
import { FISH_AZAMI_TUR_MS, FISH_MIN_KONUSMA_MS, FISH_SES_SIZLIGI_MS, bargeSayaci, rmsHesapla, konusuyorMu } from '@/lib/asistan/fishVad'

export async function fishAkisAc(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  })
}

export function fishAkisKapat(s: MediaStream | null | undefined): void {
  for (const t of s?.getTracks() || []) {
    try { t.stop() } catch { /* already stopped */ }
  }
}

function kayitTuru(): string {
  const aday = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  return aday.find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(t)) || ''
}

export async function fishBirTurKaydet(
  akis: MediaStream,
  baglam: AudioContext,
  g: {
    iptal: () => boolean
    ajanKonusuyorMu: () => boolean
    bargeIn: () => void
  },
): Promise<Blob | null> {
  if (typeof MediaRecorder === 'undefined') return null
  if (baglam.state === 'suspended') await baglam.resume().catch(() => undefined)

  const kaynak = baglam.createMediaStreamSource(akis)
  const olcer = baglam.createAnalyser()
  olcer.fftSize = 2048
  kaynak.connect(olcer)
  const ornek = new Float32Array(olcer.fftSize)

  const tur = kayitTuru()
  const kayit = new MediaRecorder(akis, tur ? { mimeType: tur } : undefined)
  const parcalar: BlobPart[] = []
  kayit.ondataavailable = (e) => { if (e.data?.size) parcalar.push(e.data) }

  let basladi = false
  let konusmaBas = 0
  let sessizBas = 0
  let bargeMs = 0

  return new Promise((coz) => {
    let bitti = false
    let vazgec = false
    const bitir = (blob: Blob | null) => {
      if (bitti) return
      bitti = true
      try { kaynak.disconnect() } catch { /* */ }
      try { olcer.disconnect() } catch { /* */ }
      if (kayit.state !== 'inactive') {
        try { kayit.stop() } catch { /* */ }
      }
      coz(blob)
    }
    kayit.onstop = () => {
      if (vazgec) { bitir(null); return }
      const blob = parcalar.length ? new Blob(parcalar, { type: kayit.mimeType || tur || 'audio/webm' }) : null
      bitir(blob && blob.size > 800 ? blob : null)
    }
    kayit.onerror = () => bitir(null)

    const tik = () => {
      if (bitti) return
      if (g.iptal()) {
        vazgec = true
        if (basladi && kayit.state === 'recording') try { kayit.stop() } catch { bitir(null) }
        else bitir(null)
        return
      }
      olcer.getFloatTimeDomainData(ornek)
      const rms = rmsHesapla(ornek)
      const ses = konusuyorMu(rms)
      const simdi = Date.now()

      const barge = bargeSayaci(bargeMs, g.ajanKonusuyorMu(), rms)
      bargeMs = barge.ms
      if (barge.kes) g.bargeIn()

      if (!basladi) {
        if (ses && !g.ajanKonusuyorMu()) {
          basladi = true
          konusmaBas = simdi
          sessizBas = 0
          try { kayit.start(200) } catch { bitir(null); return }
        }
      } else if (!ses) {
        if (!sessizBas) sessizBas = simdi
        const konusmaMs = simdi - konusmaBas
        if (konusmaMs >= FISH_MIN_KONUSMA_MS && simdi - sessizBas >= FISH_SES_SIZLIGI_MS) {
          try { kayit.stop() } catch { bitir(null) }
          return
        }
      } else {
        sessizBas = 0
      }

      if (basladi && simdi - konusmaBas > FISH_AZAMI_TUR_MS) {
        if (kayit.state === 'recording') try { kayit.stop() } catch { bitir(null) }
        else bitir(null)
        return
      }
      setTimeout(tik, 50)
    }
    tik()
  })
}

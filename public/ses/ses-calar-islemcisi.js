/**
 * NOTYA-SES-KILIT-01. Drop-in replacement for the ElevenLabs audioConcatProcessor.
 * Same messages (setFormat / buffer / interrupt / clearInterrupted). PCM is
 * converted to the AudioContext rate with a fixed ratio, so a 16 kHz agent on a
 * 48 kHz device stays at 1× for the whole call. No async resampler, no Int16-as-float.
 *
 * Duration identity (keep in sync with lib/asistan/sesCalar.ts pcmOranla):
 *   outSamples / contextRate === inSamples / sourceRate
 */
const decodeTable = [0, 132, 396, 924, 1980, 4092, 8316, 16764]

function decodeSample(muLawSample) {
  muLawSample = ~muLawSample
  const sign = muLawSample & 0x80
  const exponent = (muLawSample >> 4) & 0x07
  const mantissa = muLawSample & 0x0f
  let sample = decodeTable[exponent] + (mantissa << (exponent + 3))
  if (sign !== 0) sample = -sample
  return sample
}

function oranla(ornekler, kaynakHz, hedefHz) {
  const nGirdi = ornekler.length
  if (nGirdi === 0) return new Float32Array(0)
  const floatAt = (i) => ornekler[i] / 32768
  if (!(kaynakHz > 0) || !(hedefHz > 0) || kaynakHz === hedefHz) {
    const ayni = new Float32Array(nGirdi)
    for (let i = 0; i < nGirdi; i++) ayni[i] = floatAt(i)
    return ayni
  }
  const n = Math.max(1, Math.round(nGirdi * (hedefHz / kaynakHz)))
  const cikti = new Float32Array(n)
  const son = nGirdi - 1
  for (let i = 0; i < n; i++) {
    const p = (i * kaynakHz) / hedefHz
    const i0 = Math.min(son, Math.floor(p))
    const i1 = Math.min(son, i0 + 1)
    const f = p - i0
    cikti[i] = floatAt(i0) + (floatAt(i1) - floatAt(i0)) * f
  }
  return cikti
}

class AudioConcatProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.buffers = []
    this.cursor = 0
    this.currentBuffer = null
    this.wasInterrupted = false
    this.finished = false
    this.format = 'pcm'
    this.sourceRate = sampleRate
    this.port.onmessage = ({ data }) => {
      switch (data.type) {
        case 'setFormat':
          this.format = data.format || 'pcm'
          this.sourceRate = data.sampleRate > 0 ? data.sampleRate : sampleRate
          break
        case 'buffer':
          this.wasInterrupted = false
          this.buffers.push(this.floatYap(data.buffer))
          break
        case 'interrupt':
          this.wasInterrupted = true
          break
        case 'clearInterrupted':
          if (this.wasInterrupted) {
            this.wasInterrupted = false
            this.buffers = []
            this.currentBuffer = null
            this.cursor = 0
          }
          break
        default:
          break
      }
    }
  }

  floatYap(buffer) {
    if (this.format === 'ulaw') {
      const ham = new Uint8Array(buffer)
      const pcm = new Int16Array(ham.length)
      for (let i = 0; i < ham.length; i++) pcm[i] = decodeSample(ham[i])
      return oranla(pcm, this.sourceRate, sampleRate)
    }
    const byteLength = buffer.byteLength - (buffer.byteLength % 2)
    const pcm = new Int16Array(buffer, 0, byteLength / 2)
    return oranla(pcm, this.sourceRate, sampleRate)
  }

  process(_, outputs) {
    let finished = false
    const output = outputs[0][0]
    for (let i = 0; i < output.length; i++) {
      if (!this.currentBuffer || this.cursor >= this.currentBuffer.length) {
        if (this.buffers.length === 0) {
          finished = true
          output[i] = 0
          continue
        }
        this.currentBuffer = this.buffers.shift()
        this.cursor = 0
      }
      output[i] = this.currentBuffer[this.cursor] || 0
      this.cursor++
      if (this.cursor >= this.currentBuffer.length) this.currentBuffer = null
    }
    if (this.finished !== finished) {
      this.finished = finished
      this.port.postMessage({ type: 'process', finished })
    }
    return true
  }
}

registerProcessor('audioConcatProcessor', AudioConcatProcessor)

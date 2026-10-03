/**
 * NOTYA-SES-KILIT-01 — playback that cannot change speed.
 *
 * The ConvAI client plays 16 kHz PCM in an AudioContext that is usually 48 kHz.
 * Its resampler is created asynchronously and is fed Int16 samples as if they were
 * floats. Until it resolves, speech plays about 3× fast; after it resolves, the
 * same buffer is distorted (the "slur") or dragged. Both are this bug.
 *
 * `pcmOranla` keeps duration exact: N samples at the source rate become
 * N * (target/source) samples at the device rate. The worklet in
 * public/ses/ses-calar-islemcisi.js is the same conversion, stateful across
 * chunks. Passed to Conversation.startSession as workletPaths so the SDK's
 * processor is never used.
 *
 * NOTYA-SES-ACILIS-TEMPO-01: the opening greeting was the only turn that rushed.
 * The worklet must not treat greeting PCM as device-rate before setFormat — see
 * public/ses/ses-calar-islemcisi.js (hold until setFormat; default 16 kHz).
 */
export const SES_CALAR = {
  workletPaths: { audioConcatProcessor: '/ses/ses-calar-islemcisi.js' },
  /** Satisfies the SDK's sample-rate module load without the CDN resampler. */
  libsampleratePath: '/ses/ornekleyici-kopru.js',
} as const

/** Linear resample. Output length / hedefHz === input length / kaynakHz (within one sample). */
export function pcmOranla(ornekler: Int16Array, kaynakHz: number, hedefHz: number): Float32Array {
  const nGirdi = ornekler.length
  if (nGirdi === 0) return new Float32Array(0)
  if (!(kaynakHz > 0) || !(hedefHz > 0) || kaynakHz === hedefHz) {
    const ayni = new Float32Array(nGirdi)
    for (let i = 0; i < nGirdi; i++) ayni[i] = ornekler[i] / 32768
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
    const a = ornekler[i0] / 32768
    const b = ornekler[i1] / 32768
    cikti[i] = a + (b - a) * f
  }
  return cikti
}

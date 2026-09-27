/**
 * NOTYA-SES-KILIT-01. The ConvAI SDK loads a resampler module whenever the
 * device rate is not the agent's PCM rate. That module (libsamplerate) was
 * being fed raw Int16 and is what sped speech up and then smeared it.
 * This stub only satisfies the load. Resampling happens in ses-calar-islemcisi.js
 * at a fixed ratio, so the voice cannot change speed mid-sentence.
 */
globalThis.LibSampleRate = {
  create() {
    return Promise.resolve({
      full(buffer) {
        return buffer
      },
    })
  },
}

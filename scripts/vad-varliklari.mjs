// NOTYA-SILERO-01 — copy Silero VAD + onnxruntime WASM assets into public/vad/ (runs as `prebuild`).
// They are not committed: 14 MB of WASM belongs to node_modules, not git.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const kok = join(dirname(fileURLToPath(import.meta.url)), '..')
const hedef = join(kok, 'public', 'vad')
mkdirSync(hedef, { recursive: true })
const kaynaklar = [
  ['@ricky0123/vad-web/dist/vad.worklet.bundle.min.js', 'vad.worklet.bundle.min.js'],
  ['@ricky0123/vad-web/dist/silero_vad_v5.onnx', 'silero_vad_v5.onnx'],
  ['onnxruntime-web/dist/ort-wasm-simd-threaded.wasm', 'ort-wasm-simd-threaded.wasm'],
  ['onnxruntime-web/dist/ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.mjs'],
]
let n = 0
for (const [k, ad] of kaynaklar) {
  const kaynak = join(kok, 'node_modules', k)
  if (!existsSync(kaynak)) { console.warn('[vad-varliklari] yok:', k); continue }
  copyFileSync(kaynak, join(hedef, ad))
  n += 1
}
console.info(`[vad-varliklari] ${n}/${kaynaklar.length} dosya → public/vad/`)

/**
 * NOTYA-BELGE-01 — Tier B: browser engine runner (contract + registry).
 * Engines run in the doctor's browser with ONNX Runtime Web (WebGPU → WASM fallback). Each engine is a small
 * module: { motor, surum, modaliteler, modelUrl (sha256-pinned, cached by sw.js), preprocess, postprocess → MotorCiktisi }.
 * This file ships the contract, capability probe and the registry loader. Engine modules (txrv-densenet121,
 * ptbxl-inception1d, hear-icbhi, hear-circor, grazpedwri-yolo, rsna-boneage, fracatlas-yolo) are added one by one
 * with their ONNX export + golden-set result (README_BELGELER.md). Until an engine module + model URL exists and
 * motor_kayit.aktif=true, the runner returns [] and the analysis is Tier A only — the contract never changes.
 */
import type { Modalite } from './ontoloji'
import type { MotorCiktisi } from './types'

export type TarayiciMotor = {
  motor: string
  surum: string
  modaliteler: Modalite[]
  modelUrl: string
  sha256: string
  /** returns labels on ontology codes; receives the de-identified image bitmap or mono audio */
  calistir: (girdi: { bitmap?: ImageBitmap; ses?: { mono: Float32Array; sr: number } }, session: unknown) => Promise<MotorCiktisi['labels']>
}

export type TarayiciYetenek = { webgpu: boolean; wasm: boolean; not: string }

export function tarayiciYetenek(): TarayiciYetenek {
  const webgpu = typeof navigator !== 'undefined' && 'gpu' in navigator
  const wasm = typeof WebAssembly !== 'undefined'
  return { webgpu, wasm, not: webgpu ? 'WebGPU hazır — motorlar hızlı çalışır.' : wasm ? 'WebGPU yok — motorlar WASM ile daha yavaş çalışır.' : 'Bu tarayıcıda yerel motor çalışmaz; yalnız asistan değerlendirmesi.' }
}

const KAYIT: TarayiciMotor[] = [] // engine modules register themselves here when shipped
export function motorKaydet(m: TarayiciMotor) { if (!KAYIT.some((x) => x.motor === m.motor)) KAYIT.push(m) }
export function kayitliMotorlar(): TarayiciMotor[] { return [...KAYIT] }

/** Run every registered engine listed for this (branş, modality). Never throws; per-engine hata in the output. */
export async function tierBCalistir(istenen: string[], modalite: Modalite, girdi: { bitmap?: ImageBitmap; ses?: { mono: Float32Array; sr: number } }): Promise<MotorCiktisi[]> {
  const y = tarayiciYetenek()
  if (!y.wasm) return []
  const secilen = KAYIT.filter((m) => istenen.includes(m.motor) && m.modaliteler.includes(modalite))
  const out: MotorCiktisi[] = []
  for (const m of secilen) {
    const t0 = performance.now()
    try {
      const session = await oturumAc(m, y.webgpu)
      const labels = await m.calistir(girdi, session)
      out.push({ motor: m.motor, surum: m.surum, tier: 'B', dogrulanmis: false /* server decides from motor_kayit */, labels, sure_ms: Math.round(performance.now() - t0) })
    } catch (e) {
      out.push({ motor: m.motor, surum: m.surum, tier: 'B', dogrulanmis: false, labels: [], hata: e instanceof Error ? e.message : 'motor hatası', sure_ms: Math.round(performance.now() - t0) })
    }
  }
  return out
}

export type OrtModul = {
  env: { wasm: { wasmPaths: string; numThreads: number } }
  InferenceSession: { create: (url: string, opts: unknown) => Promise<unknown> }
  Tensor: new (type: string, data: Float32Array, dims: number[]) => unknown
}
let ortSoz: Promise<OrtModul> | null = null
export function ortYukle(): Promise<OrtModul> {
  // @ts-expect-error runtime URL import — served from /public/ort, not resolved by TypeScript/webpack
  if (!ortSoz) ortSoz = import(/* webpackIgnore: true */ '/ort/ort.webgpu.min.mjs') as Promise<OrtModul>
  return ortSoz
}

const oturumlar = new Map<string, unknown>()
async function oturumAc(m: TarayiciMotor, webgpu: boolean): Promise<unknown> {
  if (oturumlar.has(m.motor)) return oturumlar.get(m.motor)
  // onnxruntime-web is NOT bundled (Next/Terser cannot process its ESM). It is served from our own origin
  // (/public/ort, copied from node_modules/onnxruntime-web/dist) and loaded at runtime — no third-party CDN, CSP-safe.
  const ort = await ortYukle()
  ort.env.wasm.wasmPaths = '/ort/'
  ort.env.wasm.numThreads = 1 // no cross-origin isolation headers → single thread
  const session = await ort.InferenceSession.create(m.modelUrl, { executionProviders: webgpu ? ['webgpu', 'wasm'] : ['wasm'] })
  oturumlar.set(m.motor, session)
  return session
}

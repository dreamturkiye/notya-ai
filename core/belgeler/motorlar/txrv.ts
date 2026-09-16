/**
 * NOTYA-BELGE-02 — Tier B engine: TorchXRayVision DenseNet-121 "all" (Apache-2.0), exported to ONNX and run
 * in the doctor's browser. Input: chest X-ray (any size) → grayscale, center-crop square, 224×224, scaled to
 * [-1024, 1024] as torchxrayvision.datasets.normalize does. Output: 18 pathology probabilities already passed
 * through the model's operating-point normalisation (0.5 = operating point), NaN for pathologies this weight set
 * was not trained on → skipped. Labels are mapped onto the finding ontology; fusion never sees raw strings.
 * Weight provenance, sha256 and the export command live in docs/README_BELGELER.md.
 */
import { motorKaydet, ortYukle, type TarayiciMotor } from '../tarayiciMotor'
import TXRV_META from './txrv.meta.json'

type Session = { run: (feeds: Record<string, unknown>) => Promise<Record<string, { data: Float32Array }>>; inputNames: string[]; outputNames: string[] }

/** torchxrayvision label → bulgu_kodu. Several labels fold into one code (max wins). */
const LABELMAP: Record<string, string | null> = {
  Atelectasis: 'CXR.ATEL', Consolidation: 'CXR.CONS', Infiltration: 'CXR.OPAC', Pneumothorax: 'CXR.PTX', Edema: 'CXR.EDEMA',
  Emphysema: 'CXR.HYPER', Fibrosis: 'CXR.FIB', Effusion: 'CXR.EFF', Pneumonia: 'CXR.PNEU', Pleural_Thickening: 'CXR.PLTHICK',
  Cardiomegaly: 'CXR.CMG', Nodule: 'CXR.NOD', Mass: 'CXR.NOD', Hernia: null, 'Lung Lesion': 'CXR.NOD', Fracture: 'CXR.FRACT',
  'Lung Opacity': 'CXR.OPAC', 'Enlarged Cardiomediastinum': 'CXR.CMG',
}

function onIsle(bitmap: ImageBitmap): Float32Array {
  const side = Math.min(bitmap.width, bitmap.height)
  const sx = Math.floor((bitmap.width - side) / 2), sy = Math.floor((bitmap.height - side) / 2)
  const c = document.createElement('canvas'); c.width = 224; c.height = 224
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, 224, 224)
  const { data } = ctx.getImageData(0, 0, 224, 224)
  const out = new Float32Array(224 * 224)
  for (let i = 0; i < 224 * 224; i++) {
    const g = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
    out[i] = (2 * (g / 255) - 1) * 1024
  }
  return out
}

export const TXRV: TarayiciMotor = {
  motor: 'txrv-densenet121',
  surum: TXRV_META.surum,
  modaliteler: ['cxr'],
  modelUrl: TXRV_META.modelUrl,
  sha256: TXRV_META.sha256,
  async calistir(girdi, session) {
    if (!girdi.bitmap) return []
    const s = session as Session
    const ort = await ortYukle()
    const tensor = new ort.Tensor('float32', onIsle(girdi.bitmap), [1, 1, 224, 224])
    const out = await s.run({ [s.inputNames[0]]: tensor })
    const probs = out[s.outputNames[0]].data
    const labels: { kod: string; p: number; raw?: string }[] = []
    ;(TXRV_META.pathologies as string[]).forEach((ad, i) => {
      const kod = LABELMAP[ad]; const p = probs[i]
      if (!kod || !Number.isFinite(p)) return
      const mevcut = labels.find((l) => l.kod === kod)
      if (mevcut) { if (p > mevcut.p) { mevcut.p = Math.round(p * 1000) / 1000; mevcut.raw = ad } }
      else labels.push({ kod, p: Math.round(p * 1000) / 1000, raw: ad })
    })
    return labels
  },
}

motorKaydet(TXRV)

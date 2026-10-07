/**
 * NOTYA-SES-PROFILI-01 — Web Worker: speaker embeddings off the main thread (the ElevenLabs session and Silero
 * share the main thread). Audio arrives as PCM, is processed in memory and dropped; nothing leaves the browser.
 * The model (public/ses-profili/ge2e-v1.bin, ~2.8 MB) is downloaded once and kept in the Cache API.
 *
 * Messages: { id, t: 'yukle', url } · { id, t: 'gomme', pcm, hz } (enrolment sentence) ·
 *           { id, t: 'puan', pcm (16 kHz), profil } (runtime segment). Reply: { id, ok, gomme? | skor? | hata? }.
 */
import { agirlikCoz, kosinus, parcaGomme, sozGomme, yenidenOrnekle, type Ge2eAgirlik } from '@/lib/asistan/sesProfili/ge2e'
import { sessizlikKirp } from '@/lib/asistan/sesProfili/kalite'
import { SES_PROFILI_MODEL_SURUMU } from '@/lib/asistan/sesProfili/ayar'

type Istek =
  | { id: number; t: 'yukle'; url: string }
  | { id: number; t: 'gomme'; pcm: Float32Array; hz: number }
  | { id: number; t: 'puan'; pcm: Float32Array; profil: Float32Array }

type IsciKapsami = {
  onmessage: ((e: MessageEvent<Istek>) => void) | null
  postMessage: (m: unknown, aktar?: Transferable[]) => void
  caches?: CacheStorage
}
const kapsam = self as unknown as IsciKapsami

let agirlik: Promise<Ge2eAgirlik> | null = null

async function modelGetir(url: string): Promise<ArrayBuffer> {
  const ad = `notya-ses-profili-${SES_PROFILI_MODEL_SURUMU}`
  try {
    const depo = kapsam.caches ? await kapsam.caches.open(ad) : null
    const var_ = depo ? await depo.match(url) : undefined
    if (var_) return await var_.arrayBuffer()
    const r = await fetch(url)
    if (!r.ok) throw new Error(`ses_profili_model_${r.status}`)
    if (depo) await depo.put(url, r.clone()).catch(() => undefined)
    return await r.arrayBuffer()
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('ses_profili_model_')) throw e
    const r = await fetch(url)
    if (!r.ok) throw new Error(`ses_profili_model_${r.status}`)
    return await r.arrayBuffer()
  }
}

kapsam.onmessage = async (e: MessageEvent<Istek>) => {
  const m = e.data
  try {
    if (m.t === 'yukle') {
      if (!agirlik) agirlik = modelGetir(m.url).then(agirlikCoz)
      agirlik.catch(() => { agirlik = null })
      await agirlik
      kapsam.postMessage({ id: m.id, ok: true })
      return
    }
    if (!agirlik) throw new Error('ses_profili_model_yok')
    const a = await agirlik
    if (m.t === 'gomme') {
      const g = sozGomme(a, sessizlikKirp(yenidenOrnekle(m.pcm, m.hz)))
      kapsam.postMessage({ id: m.id, ok: true, gomme: g }, [g.buffer])
      return
    }
    if (m.t === 'puan') {
      kapsam.postMessage({ id: m.id, ok: true, skor: kosinus(parcaGomme(a, m.pcm), m.profil) })
      return
    }
  } catch (err) {
    kapsam.postMessage({ id: (m as { id?: number })?.id ?? -1, ok: false, hata: err instanceof Error ? err.message : 'hata' })
  }
}

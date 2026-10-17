/**
 * FOTO-AI-01 — evaluation harness: the runner. Sends each case through the SAME pipeline the app uses
 * (fotoDegerlendir: prompt -> structured call with validate/repair -> deterministic calibration), so the scores describe
 * the product, not a lookalike. The model call is injectable: `sahteCagirici` replays the fixture's scripted answers
 * (no network, no image); the CLI's live mode passes nothing and `aiCagir` is used (ai-model-politikasi: no model name here).
 */
import { fotoDegerlendir, type GorselGirdisi } from '../degerlendir'
import type { CagriFonksiyonu } from '../cagri'
import { gorselMetaTemizle } from '@/lib/doktor/fotoArsiv/metaTemizle'
import type { Olgu, OlguSeti } from './olgu'
import type { OlguSonucu } from './puanla'

/** 1x1 transparent PNG: placeholder image block for scripted runs (the scripted model never looks at it). */
const YER_TUTUCU_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

/** Replays `olgu.yanit` as the model answer; a case without a scripted answer yields an empty (invalid) one. */
export function sahteCagirici(olgu: Olgu): CagriFonksiyonu {
  return async () => ({ content: [{ type: 'text', text: typeof olgu.yanit === 'string' ? olgu.yanit : JSON.stringify(olgu.yanit ?? {}) }], model: 'scripted' })
}

export const GORSEL_AZAMI_BAYT = 2_500_000

export interface KosuSecenekleri {
  /** reads the image bytes of a case (live mode); returns null when the file is missing */
  gorselOku?: (dosya: string) => Buffer | null
  /** scripted mode: no images, answers come from the fixture */
  sahte?: boolean
  doctorId?: string
  /** override the model call for every case (tests) */
  cagir?: (olgu: Olgu) => CagriFonksiyonu
}

export async function olgulariKos(set: OlguSeti, o: KosuSecenekleri): Promise<OlguSonucu[]> {
  const sonuc: OlguSonucu[] = []
  for (const olgu of set.olgular) {
    let gorsel: GorselGirdisi
    if (o.sahte) gorsel = { mime: 'image/png', base64: YER_TUTUCU_PNG.toString('base64') }
    else {
      const ham = olgu.gorsel ? o.gorselOku?.(olgu.gorsel) ?? null : null
      if (!ham) { sonuc.push({ olgu, durum: 'hata', hatalar: [`Görüntü bulunamadı: ${olgu.gorsel ?? '(gorsel alanı yok)'}`] }); continue }
      if (ham.length > GORSEL_AZAMI_BAYT) { sonuc.push({ olgu, durum: 'hata', hatalar: [`Görüntü ${GORSEL_AZAMI_BAYT} bayttan büyük: önce küçültün (en uzun kenar ~1600 px).`] }); continue }
      const temiz = gorselMetaTemizle(ham) // same server-side strip as the app: EXIF never reaches the model
      if (!temiz) { sonuc.push({ olgu, durum: 'hata', hatalar: ['Yalnız JPEG veya PNG desteklenir.'] }); continue }
      gorsel = { mime: temiz.mime, base64: temiz.bytes.toString('base64') }
    }
    const s = await fotoDegerlendir({
      doctorId: o.doctorId ?? 'foto-ai-harness', gorsel, mod: olgu.mod, yas: olgu.yas, bolgeIpucu: null, veliDili: olgu.veliDili,
      cagir: o.cagir ? o.cagir(olgu) : o.sahte ? sahteCagirici(olgu) : undefined,
    })
    sonuc.push(s.durum === 'tamam'
      ? { olgu, durum: 'tamam', deger: s.deger, onarimDenendi: s.uretim.onarimDenendi }
      : { olgu, durum: 'hata', hatalar: s.hatalar, onarimDenendi: s.uretim.onarimDenendi })
  }
  return sonuc
}

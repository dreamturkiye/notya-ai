/**
 * FOTO-AI-01 — evaluation of ONE clinical photo (pure orchestration: no database, injectable model call).
 *
 * Flow: build prompt (mode + age aware) -> structured call with validate/repair (cagri.ts) -> deterministic calibration
 * (kalibrasyon.ts). The server layer (fotoServis.ts) wraps this with the hash cache, quota, storage and audit log.
 * The image that reaches the model is always a downscaled, metadata-free derivative (see fotoServis.ts / metaTemizle.ts).
 */
import { kalibreEt, type KalibrasyonBaglami } from './kalibrasyon'
import { yapilandirilmisCagri, type CagriFonksiyonu } from './cagri'
import { KALITE_SISTEMI, kullaniciMetni, sistemMetni } from './istem'
import {
  FOTO_AI_SURUMU, bolgeDogrula, fotoSonucuDogrula, kaliteDogrula, type FotoDegerlendirme, type FotoKalite, type FotoMod, type FotoUretimKaydi, type Guven,
} from './sema'

export interface GorselGirdisi { mime: 'image/jpeg' | 'image/png'; base64: string }

export const gorselBlogu = (g: GorselGirdisi): unknown => ({ type: 'image', source: { type: 'base64', media_type: g.mime, data: g.base64 } })

export interface TekGirdi {
  doctorId: string
  gorsel: GorselGirdisi
  mod: FotoMod
  yas: string | null
  bolgeIpucu: string | null
  veliDili: boolean
  cagir?: CagriFonksiyonu
  butceMs?: number
}

export type TekSonuc =
  | { durum: 'tamam'; deger: FotoDegerlendirme; uretim: FotoUretimKaydi }
  | { durum: 'hata'; hatalar: string[]; uretim: FotoUretimKaydi }

const uretimKaydi = (model: string | null, onarimDenendi: boolean, onarildi: boolean): FotoUretimKaydi => ({
  surum: FOTO_AI_SURUMU, model, kaynak: 'model', uretildi: new Date().toISOString(), onarimDenendi, onarildi,
})

export async function fotoDegerlendir(g: TekGirdi): Promise<TekSonuc> {
  const baglam: KalibrasyonBaglami = { veliDili: g.veliDili }
  const s = await yapilandirilmisCagri<FotoDegerlendirme>({
    doctorId: g.doctorId,
    system: sistemMetni(g.mod),
    icerik: [gorselBlogu(g.gorsel), { type: 'text', text: kullaniciMetni({ yas: g.yas, bolgeIpucu: g.bolgeIpucu, veliDili: g.veliDili }) }],
    dogrula: (ham) => fotoSonucuDogrula(ham, g.mod),
    maxTokens: 3000,
    butceMs: g.butceMs ?? 55_000,
    cagir: g.cagir,
  })
  const uretim = uretimKaydi(s.model, s.onarimDenendi, s.onarildi)
  if (!s.deger) return { durum: 'hata', hatalar: s.hatalar, uretim }
  return { durum: 'tamam', deger: kalibreEt(s.deger, baglam), uretim }
}

// ─── Pre-save quality gate ───────────────────────────────────────────────────────────────────────────────
export interface KaliteSonucu { kalite: FotoKalite; bolge: { id: string | null; guven: Guven }; yenile: boolean }

/** Cheap model check of a photo that is NOT yet saved. null = the gate could not run (the photo may still be saved). */
export async function kaliteKontrol(g: { doctorId: string; gorsel: GorselGirdisi; cagir?: CagriFonksiyonu; butceMs?: number }): Promise<KaliteSonucu | null> {
  const s = await yapilandirilmisCagri<{ kalite: FotoKalite; bolge: { id: string | null; guven: Guven } }>({
    doctorId: g.doctorId,
    system: KALITE_SISTEMI,
    icerik: [gorselBlogu(g.gorsel), { type: 'text', text: 'Fotoğrafın çekim kalitesini şemaya göre değerlendir. Yalnızca JSON.' }],
    dogrula: (ham) => {
      const o = ham as Record<string, unknown>
      const k = kaliteDogrula(o?.kalite)
      return k.kalite ? { deger: { kalite: k.kalite, bolge: bolgeDogrula(o?.bolge) }, hatalar: [] } : { hatalar: k.hatalar }
    },
    maxTokens: 500,
    butceMs: g.butceMs ?? 30_000,
    cagir: g.cagir,
  })
  if (!s.deger) return null
  const k = s.deger.kalite
  const yenile = k.genel === 'yetersiz' || !k.bolgeBelirlenebilir
  return { kalite: yenile && !k.yenidenCekim ? { ...k, yenidenCekim: 'Daha aydınlık bir yerde, bölgeyi kadrajı doldurarak ve yanına bir cetvel koyarak yeniden çekin.' } : k, bolge: s.deger.bolge, yenile }
}

/**
 * NOTYA-BELGE-OTO-01 — browser wiring of the standard workflow (mask -> evaluate -> ONE note write) on top of otoBatch.
 * Used by the Belgeler vault upload (any number of files) and, per document, by the Belgeler page.
 * The doctor-facing document is never altered; only the outbound copy is masked. Masking failure = skip (never send).
 */
import { gorseliOtomatikKimliksizlestir, type DeIdGorsel } from './deid'
import { adKarsilastir, type KimlikBulgulari } from './kimlikMaske'
import { KIMLIK_GIZLENEMEDI, topluIsle, type BatchSonuc, type BelgeAsama } from './otoBatch'
import type { BlokGirdi } from './notaBlok'

export interface OtoBelge { belgeId: string; ad: string; dosya: Blob }
export interface OtoSecenek {
  token: string
  hastaAdi?: string | null
  onDurum?: (belgeId: string, asama: BelgeAsama, not?: string) => void
  onBulgu?: (belgeId: string, bulgu: KimlikBulgulari, ad: 'eslesir' | 'eslesmiyor' | 'belirsiz') => void
  esZamanli?: number
}

const gorselMi = (b: Blob) => b.type.startsWith('image/')

export async function belgeleriOtomatikIsle(belgeler: OtoBelge[], o: OtoSecenek): Promise<BatchSonuc & { analizIdleri: Record<string, string> }> {
  const analizIdleri: Record<string, string> = {}
  const dosyalar = new Map(belgeler.map((b) => [b.belgeId, b.dosya]))
  const baslik = { Authorization: `Bearer ${o.token}`, 'Content-Type': 'application/json' }
  const sonuc = await topluIsle<DeIdGorsel>(
    belgeler.map((b, i) => ({ belgeId: b.belgeId, ad: b.ad, yuklemeSirasi: i })),
    {
      durum: o.onDurum,
      maskele: async (b) => {
        const dosya = dosyalar.get(b.belgeId)
        // PDFs / audio have no pixel masking here: left in Belgeler as before (never auto-sent unmasked).
        if (!dosya || !gorselMi(dosya)) return { ok: false, neden: 'Görsel olmayan belge: Belgeler bölümünden değerlendirilir' }
        const m = await gorseliOtomatikKimliksizlestir(dosya, { modalite: 'us' }) // 'us' = header-band safety net on
        o.onBulgu?.(b.belgeId, m.bulgu, adKarsilastir(m.bulgu.ad, o.hastaAdi))
        if (m.maske.durum !== 'maskelendi') return { ok: false, neden: KIMLIK_GIZLENEMEDI }
        return { ok: true, yuk: m.gorsel }
      },
      degerlendir: async (b, g) => {
        const r = await fetch('/api/doktor/belgeler/analiz', { method: 'POST', headers: baslik, body: JSON.stringify({ documentId: b.belgeId, modalityFinal: 'auto', deid: { mime: g.mime, base64: g.base64, hash: g.hash } }) })
        const j = await r.json().catch(() => ({}))
        if (!r.ok || !j?.analiz?.id) return { ok: false, neden: (j && j.error) || 'Değerlendirilemedi' }
        analizIdleri[b.belgeId] = j.analiz.id
        return { ok: true, girdi: { belgeId: b.belgeId, etiket: '', tarih: '', yuklemeSirasi: b.yuklemeSirasi } as BlokGirdi }
      },
      yaz: async (girdiler) => {
        const r = await fetch('/api/doktor/belgeler/analiz/otomatik-ekle', { method: 'POST', headers: baslik, body: JSON.stringify({ analizIds: girdiler.map((g) => analizIdleri[g.belgeId]).filter(Boolean) }) })
        if (!r.ok) throw new Error('yazilamadi')
      },
    },
    { esZamanli: o.esZamanli ?? 3 },
  )
  return { ...sonuc, analizIdleri }
}

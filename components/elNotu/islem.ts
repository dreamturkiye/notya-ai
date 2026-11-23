/**
 * ESNEK-MUAYENE-A — one source, start to end, on the device (shared by "El notu ekle", batch upload and the inbox route):
 * create / reuse the source → per page: on-device package (privacy first) → original page to the vault → read.
 */
import type { Rgba, Sablon, Kutu } from '@/core/elNotu/tipler'
import type { Getirici } from './ElNotuYakala'

export type SayfaSonuc = { sayfa: number; durum: 'okundu' | 'tekrar' | 'baslik' | 'gizlenemedi' | 'hata'; acik?: number; neden?: string[] }

export async function kaynagiOkut(g: {
  getir: Getirici; api: string; patientId: string; sessionId?: string | null; ziyaretTarihi?: string | null
  kanal: 'kamera' | 'dosya' | 'tarayici' | 'gelen_belge' | 'toplu'; gelenBelgeId?: string | null; rasterler: Rgba[]
  isaretler?: (Kutu | null)[]; sablonlar?: Sablon[]
}): Promise<{ kaynakId: string; sessionId: string | null; sayfalar: SayfaSonuc[]; acik: number }> {
  const { icerikOzeti, tarayiciOcr, tarayiciTuvali, orijinalKopya } = await import('@/core/elNotu/tarayici')
  const { sayfaPaketiHazirla } = await import('@/core/elNotu/sayfaPaketi')
  const isleme = await icerikOzeti(g.rasterler, g.patientId)
  const kr = await g.getir(`${g.api}/kaynak`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ patientId: g.patientId, sessionId: g.sessionId || null, kanal: g.kanal, isleme, ziyaretTarihi: g.ziyaretTarihi || null, gelenBelgeId: g.gelenBelgeId || null }) })
  const kj = await kr.json().catch(() => ({}))
  if (!kr.ok || !kj.kaynak?.id) throw new Error(kj.error || 'kaynak')
  let sablonlar = g.sablonlar
  if (!sablonlar) { const r = await g.getir(`${g.api}/sablon`); sablonlar = r.ok ? ((await r.json()).sablonlar || []) : [] }
  const sayfalar: SayfaSonuc[] = []
  let acik = 0
  for (let i = 0; i < g.rasterler.length; i++) {
    const isaret = g.isaretler?.[i]
    const s = await sayfaPaketiHazirla({ foto: g.rasterler[i], sayfa: i + 1, sablonlar: sablonlar!, serbestBeyan: sablonlar!.some((x) => x.tur === 'serbest'), kullaniciBolgeleri: isaret ? [isaret] : undefined, tuval: tarayiciTuvali, ocr: tarayiciOcr })
    if (s.durum === 'tekrar') { sayfalar.push({ sayfa: i + 1, durum: 'tekrar', neden: s.kalite.nedenler }); continue }
    if (s.durum === 'gizlenemedi') { sayfalar.push({ sayfa: i + 1, durum: 'gizlenemedi' }); continue }
    if (s.durum === 'baslik_gerekli') { sayfalar.push({ sayfa: i + 1, durum: 'baslik' }); continue }
    const kopya = await orijinalKopya(g.rasterler[i])
    const or = await g.getir(`${g.api}/orijinal`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kaynakId: kj.kaynak.id, sayfa: i + 1, ...kopya }) })
    const oj = await or.json().catch(() => ({}))
    const r = await g.getir(`${g.api}/oku`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kaynakId: kj.kaynak.id, paket: s.paket, maskeliSayfa: s.maskeliSayfa, orijinalBelgeId: oj.belgeId || null }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) { sayfalar.push({ sayfa: i + 1, durum: 'hata' }); continue }
    acik = Number(j.acik) || acik
    sayfalar.push({ sayfa: i + 1, durum: 'okundu', acik: Array.isArray(j.sayfa?.dogrula) ? j.sayfa.dogrula.length : 0 })
  }
  return { kaynakId: String(kj.kaynak.id), sessionId: kj.kaynak.sessionId ? String(kj.kaynak.sessionId) : null, sayfalar, acik }
}

/** Header words a batch page printed or typed (on-device OCR of the top 35%) → best matching appointment name. */
export function adEslestir(okunan: string[], adaylar: { id: string; ad: string }[]): { id: string; skor: number } | null {
  const katla = (s: string) => s.toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z\s]/g, ' ').trim()
  const kelimeler = new Set(okunan.flatMap((s) => katla(s).split(/\s+/)).filter((w) => w.length >= 3))
  let en: { id: string; skor: number } | null = null
  for (const a of adaylar) {
    const parca = katla(a.ad).split(/\s+/).filter((w) => w.length >= 3)
    if (!parca.length) continue
    const skor = parca.filter((w) => kelimeler.has(w)).length / parca.length
    if (skor > (en?.skor ?? 0)) en = { id: a.id, skor }
  }
  return en && en.skor >= 0.5 ? en : null
}

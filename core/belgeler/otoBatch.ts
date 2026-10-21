/**
 * NOTYA-BELGE-OTO-01 — batch-first orchestration (pure; side effects injected so it is unit-testable).
 *
 * N documents -> bounded concurrency (default 3) -> per document: mask (outbound copy only) -> evaluate.
 * One document failing never blocks the others. After the pool drains there is exactly ONE write for the whole
 * batch (never N saves / N revision-page openings). Failed documents stay in Belgeler for manual retry.
 */
import type { BlokGirdi } from './notaBlok'

export type BelgeAsama = 'bekliyor' | 'yukleniyor' | 'maskeleniyor' | 'degerlendiriliyor' | 'nota_eklendi' | 'atlandi' | 'hata'

export const KIMLIK_GIZLENEMEDI = 'Kimlik gizlenemedi, otomatik değerlendirilmedi'

export interface BatchBelge {
  belgeId: string
  ad: string
  yuklemeSirasi: number
}

export type MaskeSonucu<P> = { ok: true; yuk: P } | { ok: false; neden: string }
export type DegerlendirSonucu = { ok: true; girdi: BlokGirdi } | { ok: false; neden: string }

export interface BatchBagimlilik<P> {
  /** Produces the outbound (masked) payload. ok:false = masking failed / low confidence / timeout -> NOT sent. */
  maskele: (b: BatchBelge) => Promise<MaskeSonucu<P>>
  degerlendir: (b: BatchBelge, yuk: P) => Promise<DegerlendirSonucu>
  /** Called exactly once, with every successful block, only when at least one succeeded. */
  yaz: (girdiler: BlokGirdi[]) => Promise<void>
  /** Per-document progress row. */
  durum?: (belgeId: string, asama: BelgeAsama, not?: string) => void
}

export interface BatchSonuc {
  belgeler: { belgeId: string; asama: BelgeAsama; not?: string }[]
  yazimSayisi: number
  genel: { toplam: number; eklenen: number; atlanan: number; hatali: number }
}

export async function sinirliHavuz<T>(isler: (() => Promise<T>)[], esZamanli = 3): Promise<T[]> {
  const sonuc: T[] = new Array(isler.length)
  let i = 0
  const isci = async () => { for (;;) { const k = i++; if (k >= isler.length) return; sonuc[k] = await isler[k]() } }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(esZamanli, isler.length)) }, isci))
  return sonuc
}

export async function topluIsle<P>(belgeler: BatchBelge[], dep: BatchBagimlilik<P>, o: { esZamanli?: number } = {}): Promise<BatchSonuc> {
  const durum = (id: string, a: BelgeAsama, not?: string) => { try { dep.durum?.(id, a, not) } catch { /* UI callback must not break the batch */ } }
  const sonuclar = new Map<string, { asama: BelgeAsama; not?: string }>()
  const girdiler: BlokGirdi[] = []

  await sinirliHavuz(belgeler.map((b) => async () => {
    try {
      durum(b.belgeId, 'maskeleniyor')
      let m: MaskeSonucu<P>
      try { m = await dep.maskele(b) } catch { m = { ok: false, neden: KIMLIK_GIZLENEMEDI } }
      if (!m.ok) { sonuclar.set(b.belgeId, { asama: 'atlandi', not: m.neden || KIMLIK_GIZLENEMEDI }); durum(b.belgeId, 'atlandi', m.neden || KIMLIK_GIZLENEMEDI); return }
      durum(b.belgeId, 'degerlendiriliyor')
      let d: DegerlendirSonucu
      try { d = await dep.degerlendir(b, m.yuk) } catch { d = { ok: false, neden: 'Değerlendirilemedi' } }
      if (!d.ok) { sonuclar.set(b.belgeId, { asama: 'hata', not: d.neden }); durum(b.belgeId, 'hata', d.neden); return }
      girdiler.push({ ...d.girdi, belgeId: b.belgeId, yuklemeSirasi: b.yuklemeSirasi })
      sonuclar.set(b.belgeId, { asama: 'nota_eklendi' }) // provisional, confirmed after the single write
    } catch {
      sonuclar.set(b.belgeId, { asama: 'hata', not: 'Beklenmeyen hata' }); durum(b.belgeId, 'hata', 'Beklenmeyen hata')
    }
  }), o.esZamanli ?? 3)

  let yazimSayisi = 0
  if (girdiler.length) {
    try {
      yazimSayisi = 1
      await dep.yaz(girdiler)
      for (const g of girdiler) durum(g.belgeId, 'nota_eklendi')
    } catch {
      for (const g of girdiler) { sonuclar.set(g.belgeId, { asama: 'hata', not: 'Nota yazılamadı' }); durum(g.belgeId, 'hata', 'Nota yazılamadı') }
    }
  }
  const liste = belgeler.map((b) => ({ belgeId: b.belgeId, ...(sonuclar.get(b.belgeId) ?? { asama: 'hata' as BelgeAsama }) }))
  return {
    belgeler: liste,
    yazimSayisi,
    genel: {
      toplam: liste.length,
      eklenen: liste.filter((x) => x.asama === 'nota_eklendi').length,
      atlanan: liste.filter((x) => x.asama === 'atlandi').length,
      hatali: liste.filter((x) => x.asama === 'hata').length,
    },
  }
}

/** Shared concurrency gate for UI flows where documents arrive one by one (Ekler step): at most n tasks run at once. */
export function sinirliKuyruk(n = 3): <T>(is: () => Promise<T>) => Promise<T> {
  let calisan = 0
  const bekleyen: (() => void)[] = []
  const sirada = () => { while (calisan < n && bekleyen.length) { calisan++; bekleyen.shift()!() } }
  return <T,>(is: () => Promise<T>) => new Promise<T>((coz, red) => {
    bekleyen.push(() => { is().then(coz, red).finally(() => { calisan--; sirada() }) })
    sirada()
  })
}

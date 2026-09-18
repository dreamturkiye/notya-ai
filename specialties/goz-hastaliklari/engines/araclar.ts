/**
 * GOZ-EXCEPTIONAL-01 — Araçlar › göz stüdyolarının saf yardımcıları (chapter motorlarının üstünde ince katman; yeni klinik kural yok).
 * VA / logMAR: engines/va (vaCoz, harfFarki). GİL EK-3/G: engines/klinik (GIL_EK3G_KALEMLERI, gilSgkKontrol) — bedel yazılmaz.
 */
import { vaCoz, harfFarki, vaGoster } from './va'
import { GIL_EK3G_KALEMLERI } from './klinik'

export interface VaSatir {
  ham: string
  gosterim: string
  kategori: string | null
  ondalik: string | null
  logmar: string | null
  /** okunamadıysa kullanıcıya gösterilecek açıklama */
  hata: string | null
}

const virgul = (n: number, b: number) => n.toFixed(b).replace('.', ',')

export function vaSatiri(ham: string): VaSatir {
  const t = String(ham || '').trim()
  if (!t) return { ham: '', gosterim: '—', kategori: null, ondalik: null, logmar: null, hata: null }
  const o = vaCoz(t)
  if (!o) return { ham: t, gosterim: t, kategori: null, ondalik: null, logmar: null, hata: 'Okunamadı (ör. 0,8 · 6/12 · 20/40 · PS 1m · EH · IH · IHY)' }
  if (o.kategori !== 'sayisal') {
    const ad = o.kategori === 'PS' ? `Parmak sayma${o.mesafeM != null ? ` ${String(o.mesafeM).replace('.', ',')} m` : ''}` : o.kategori === 'EH' ? 'El hareketi' : o.kategori === 'IH' ? 'Işık hissi' : 'Işık hissi yok'
    return { ham: t, gosterim: ad, kategori: o.kategori, ondalik: null, logmar: null, hata: null }
  }
  return { ham: t, gosterim: vaGoster(t), kategori: 'sayisal', ondalik: virgul(o.ondalik!, o.ondalik! < 0.1 ? 3 : 2), logmar: virgul(o.logmar!, 2), hata: null }
}

export interface VaKarsilastirma { onceki: VaSatir; simdi: VaSatir; harf: number | null; not: string | null }

/** İki vizit arası ETDRS harf farkı (pozitif = kazanç). PS/EH/IH/IHY sayısal değildir → fark yok, yorum hekimin. */
export function vaKarsilastir(onceki: string, simdi: string): VaKarsilastirma {
  const a = vaSatiri(onceki), b = vaSatiri(simdi)
  const harf = harfFarki(onceki, simdi)
  let not: string | null = null
  if (a.ham && b.ham && harf == null && !a.hata && !b.hata) not = 'Sayısal olmayan değer (PS / EH / IH / IHY) — harf farkı hesaplanmaz; hekim yorumlar.'
  return { onceki: a, simdi: b, harf, not }
}

/** EK-3/G GİL kalemlerinde kod veya ad araması (TR küçük harf, aksan duyarlı değil). */
export function gilKodAra(q: string) {
  const norm = (s: string) => s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i')
  const t = norm(q.trim())
  if (!t) return [...GIL_EK3G_KALEMLERI]
  return GIL_EK3G_KALEMLERI.filter((k) => norm(`${k.kod} ${k.ad} ${k.not}`).includes(t))
}

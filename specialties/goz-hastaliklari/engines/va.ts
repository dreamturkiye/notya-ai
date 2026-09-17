/**
 * GOZ-CHAPTER — Görme keskinliği (VA). Pure. The clinic writes VA the way it reads the chart ("0,8", "1.0",
 * "6/12", "20/40", "PS 1m", "EH", "IH", "IHY"); this engine parses it, never rewrites it.
 * logMAR = −log10(ondalık). ETDRS harf farkı = −50 × ΔlogMAR (0,1 logMAR = 5 harf).
 * PS / EH / IH / IHY sayısal değildir → logMAR null (yayınlanmış ikame değerler kullanılmaz; hekim yorumlar).
 */
export type VaKategori = 'sayisal' | 'PS' | 'EH' | 'IH' | 'IHY'
export interface VaOkuma { ham: string; kategori: VaKategori; ondalik: number | null; logmar: number | null; mesafeM?: number | null }

const yuvarla = (n: number, b = 2) => Math.round(n * 10 ** b) / 10 ** b

export function vaCoz(hamGirdi: string | null | undefined): VaOkuma | null {
  const ham = String(hamGirdi ?? '').trim()
  if (!ham) return null
  const t = ham.toLocaleUpperCase('tr-TR').replace(/\s+/g, ' ')
  if (/^I\.?H\.?Y\.?$|^IŞIK HİSSİ YOK|^NLP$/.test(t)) return { ham, kategori: 'IHY', ondalik: null, logmar: null }
  if (/^I\.?H\.?(\+|\s|$)|^IŞIK HİSSİ|^LP/.test(t)) return { ham, kategori: 'IH', ondalik: null, logmar: null }
  if (/^E\.?H\.?(\s|$)|^EL HAREKETİ|^HM/.test(t)) return { ham, kategori: 'EH', ondalik: null, logmar: null }
  const ps = t.match(/^(?:P\.?S\.?|PARMAK SAYMA|CF)\s*(\d+(?:[.,]\d+)?)?\s*(M|MT|METRE|CM)?/)
  if (ps) {
    const deger = ps[1] ? Number(ps[1].replace(',', '.')) : null
    const mesafeM = deger == null ? null : ps[2] === 'CM' ? deger / 100 : deger
    return { ham, kategori: 'PS', ondalik: null, logmar: null, mesafeM }
  }
  const kesir = t.match(/^(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/)
  let ondalik: number | null = null
  if (kesir) {
    const pay = Number(kesir[1].replace(',', '.')), payda = Number(kesir[2].replace(',', '.'))
    if (pay > 0 && payda > 0) ondalik = pay / payda
  } else if (/^\d+(?:[.,]\d+)?$/.test(t)) {
    ondalik = Number(t.replace(',', '.'))
  }
  if (ondalik == null || !Number.isFinite(ondalik) || ondalik <= 0 || ondalik > 2.5) return null
  return { ham, kategori: 'sayisal', ondalik: yuvarla(ondalik, 3), logmar: yuvarla(-Math.log10(ondalik), 2) + 0 }
}

/** ETDRS harf farkı (yeni − eski); pozitif = kazanç. İkisi de sayısal değilse null. */
export function harfFarki(eski: string | null | undefined, yeni: string | null | undefined): number | null {
  const a = vaCoz(eski), b = vaCoz(yeni)
  if (a?.logmar == null || b?.logmar == null) return null
  return Math.round(-50 * (b.logmar - a.logmar))
}

/** Ekranda TR yazımı: ondalık virgül. Ham girdi korunur; yalnız sayısal ondalıklar biçimlenir. */
export function vaGoster(ham: string | null | undefined): string {
  const o = vaCoz(ham)
  if (!o) return ham ? String(ham) : '—'
  if (o.kategori !== 'sayisal') return o.ham
  return /\//.test(o.ham) ? o.ham : String(o.ondalik).replace('.', ',')
}

export type GozTaraf = 'sag' | 'sol'
export interface VaSeti { uzak_sc?: string | null; uzak_cc?: string | null; yakin?: string | null }
export interface MuayeneOlcum { tarih: string; va: { sag?: VaSeti; sol?: VaSeti }; gibSag: number | null; gibSol: number | null; gibYontem?: string | null }

/** Kopya-ileri: son muayenenin değerleri TASLAK olarak döner — kaydetmeden önce hekim "onayla" demelidir. */
export function kopyaIleriTaslak(son: MuayeneOlcum | null, bugun: string): { taslak: MuayeneOlcum; kaynakTarih: string; onayGerekli: true } | null {
  if (!son) return null
  return { taslak: { ...son, tarih: bugun }, kaynakTarih: son.tarih, onayGerekli: true }
}

/** Bir göz için en iyi uzak VA (cc varsa cc, yoksa sc) — trend ve SUT yanıt hesabı bunu kullanır. */
export function enIyiUzak(v: VaSeti | undefined): string | null {
  if (!v) return null
  const cc = vaCoz(v.uzak_cc), sc = vaCoz(v.uzak_sc)
  if (cc?.logmar != null && sc?.logmar != null) return cc.logmar <= sc.logmar ? cc.ham : sc.ham
  return (cc ? cc.ham : null) || (sc ? sc.ham : null)
}

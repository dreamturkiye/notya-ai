/**
 * ESNEK-MUAYENE-A — handwriting lexicon (pure): the doctor's own abbreviations first, then the branş seed, then the general
 * seed of the build's language. Deterministic expansion only where the meaning is unambiguous; an abbreviation with two
 * meanings in the same context, or one that is in no lexicon, is never guessed (→ Doğrula, then learned).
 */
import type { SozlukGirdisi } from './tipler'

export const anahtar = (s: string) => s.normalize('NFC').trim().replace(/[.:,;]+$/g, '').replace(/\s+/g, ' ').toLocaleLowerCase('tr')

export type Sozluk = {
  /** key → candidate meanings in priority order (doctor, branş, general). */
  harita: Map<string, SozlukGirdisi[]>
  girdiler: SozlukGirdisi[]
}

export function sozlukKur(hekim: SozlukGirdisi[], brans: SozlukGirdisi[], genel: SozlukGirdisi[]): Sozluk {
  const harita = new Map<string, SozlukGirdisi[]>()
  for (const g of [...hekim, ...brans, ...genel]) {
    const k = anahtar(g.kisaltma)
    if (!k) continue
    const l = harita.get(k) || []
    l.push(g)
    harita.set(k, l)
  }
  return { harita, girdiler: [...hekim, ...brans, ...genel] }
}

export type Cozum = { anlam: string; kaynak: SozlukGirdisi['kaynak'] } | { belirsiz: string[] } | null

/**
 * Meaning of one token. The doctor's own entry always wins (his meaning, even if a seed says otherwise). Among seed entries
 * of the same context, two different meanings = ambiguous. Exact case matters for single letters ("N" ≠ "n" is not
 * enforced, but "K"/"E" only resolve as sex right after an age number — see yasCinsiyet).
 */
export function coz(s: Sozluk, token: string, baglam: SozlukGirdisi['baglam'] = 'kelime'): Cozum {
  const l = s.harita.get(anahtar(token))
  if (!l?.length) return null
  const hekim = l.find((g) => g.kaynak === 'hekim')
  if (hekim) return { anlam: hekim.anlam, kaynak: 'hekim' }
  const uygun = l.filter((g) => (baglam === 'yas_cinsiyet' ? g.baglam === 'yas_cinsiyet' : g.baglam !== 'yas_cinsiyet'))
  const anlamlar = [...new Set(uygun.map((g) => g.anlam))]
  if (!anlamlar.length) return null
  if (anlamlar.length > 1) {
    // the branş seed outranks the general seed for the same key
    const brans = [...new Set(uygun.filter((g) => g.kaynak === 'brans').map((g) => g.anlam))]
    if (brans.length === 1) return { anlam: brans[0], kaynak: 'brans' }
    return { belirsiz: anlamlar }
  }
  return { anlam: anlamlar[0], kaynak: uygun[0].kaynak }
}

/** "37K", "40 E", "37k." → { yas: 37, cinsiyet: 'kadın' } using the lexicon's sex shorthand (language data). */
export function yasCinsiyet(s: Sozluk, token: string): { yas: number; cinsiyet: string } | null {
  const m = /^(\d{1,3})\s*([A-Za-zÇĞİÖŞÜçğıöşüА-Яа-я]{1,3})\.?$/.exec(token.trim())
  if (!m) return null
  const yas = Number(m[1])
  if (!(yas >= 0 && yas <= 120)) return null
  const c = coz(s, m[2], 'yas_cinsiyet')
  if (!c || !('anlam' in c)) return null
  return { yas, cinsiyet: c.anlam }
}

/** Abbreviation-shaped token that no lexicon knows: short, mostly capitals / has a dot, not a plain number. */
export function bilinmeyenKisaltmaMi(s: Sozluk, token: string, sozcukMu: (t: string) => boolean): boolean {
  const t = token.trim().replace(/[,;:]+$/, '')
  if (t.length < 2 || t.length > 6) return false
  if (/^\d+([.,]\d+)?$/.test(t)) return false
  if (coz(s, t)) return false
  if (sozcukMu(t)) return false
  const buyuk = (t.match(/[A-ZÇĞİÖŞÜ]/g) || []).length
  return buyuk >= 2 || /^[A-Za-zÇĞİÖŞÜçğıöşü]{1,4}\.$/.test(t)
}

export type GenisletmeSonucu = { metin: string; acilimlar: { kisaltma: string; anlam: string; kaynak: SozlukGirdisi['kaynak'] }[]; belirsizler: string[] }

/**
 * Deterministic expansion of a literal line with the lexicon (the reference the model's normalisation is checked against).
 * Every output word is either a source word or part of an expansion of a source token — nothing else can appear.
 */
export function genislet(s: Sozluk, satir: string): GenisletmeSonucu {
  const acilimlar: GenisletmeSonucu['acilimlar'] = []
  const belirsizler: string[] = []
  const out: string[] = []
  for (const ham of satir.split(/\s+/).filter(Boolean)) {
    const nokta = /[.,;:]$/.exec(ham)?.[0] || ''
    const t = nokta ? ham.slice(0, -1) : ham
    const yc = yasCinsiyet(s, t)
    if (yc) { const a = `${yc.yas} yaş ${yc.cinsiyet}`; acilimlar.push({ kisaltma: t, anlam: a, kaynak: 'genel' }); out.push(a + nokta); continue }
    const c = coz(s, t)
    if (c && 'anlam' in c) {
      if (anahtar(c.anlam) === anahtar(t)) { out.push(ham); continue }
      acilimlar.push({ kisaltma: t, anlam: c.anlam, kaynak: c.kaynak })
      out.push(c.anlam + nokta)
    } else {
      if (c && 'belirsiz' in c) belirsizler.push(t)
      out.push(ham)
    }
  }
  return { metin: out.join(' '), acilimlar, belirsizler }
}

/** Prompt block: the doctor's and the branş' abbreviations (compact, deduplicated, doctor first). */
export function sozlukBlogu(s: Sozluk, azami = 160): string {
  const gorulen = new Set<string>()
  const satirlar: string[] = []
  for (const g of s.girdiler) {
    const k = anahtar(g.kisaltma)
    if (gorulen.has(k)) continue
    gorulen.add(k)
    satirlar.push(`${g.kisaltma} = ${g.anlam}${g.kaynak === 'hekim' ? " (this doctor's own)" : ''}`)
    if (satirlar.length >= azami) break
  }
  return satirlar.join('\n')
}

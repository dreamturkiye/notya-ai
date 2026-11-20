/**
 * Cinsiyet — the ONE place a stored / typed sex value is read (CINSIYET-NORMAL-01, 2026-11-20).
 *
 * Canonical stored value: 'male' | 'female'. Older rows and other write paths stored free text: the manual
 * "Yeni Hasta" form wrote "Kadın" / "Erkek", the birth flow "Kız" / "Erkek", HL7 "kadın" / "erkek", intake and
 * imports single letters (K / E, F / M). Every clinical consumer (growth curves, percentiles, target height,
 * lab reference ranges, pregnancy rules) reads through `cinsiyetKanonik` so a variant never silently drops a
 * chart (2026-11-20: a manually added patient got "Doğum tarihi veya cinsiyet kayıtlı değil" and no Neyzi curve).
 * Values are encrypted, so existing rows are normalised on READ; new writes are canonical (`cinsiyetSakla`).
 *
 * Display (Kaan, 2026-09-10: "Everything has to be Turkish."): `cinsiyetTr` → 'Kadın' | 'Erkek'.
 */
export type KanonikCinsiyet = 'male' | 'female'

/** Lower-case (Turkish-aware), strip apostrophes and diacritics, dotless ı → i. Cyrillic is folded the same way. */
function katla(v: string): string {
  return v
    .normalize('NFKC')
    .toLocaleLowerCase('tr-TR')
    .replace(/[’'`´ʻʼ‘]/g, '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ı/g, 'i')
    .trim()
}

// English, Uzbek (Latin + Cyrillic) and Russian forms the six country builds store, plus Türkiye's own Turkish forms.
// A country build reads with { turkce: false }: a Turkish value is never accepted there (no Turkish in a country build).
const KADIN_HAM = [
  'female', 'f', 'woman', 'women', 'girl', 'fem',
  'ayol', 'qiz', 'qiz bola', 'аёл', 'қиз', 'киз',
  'женский', 'женщина', 'жен', 'ж', 'девочка',
]
const ERKEK_HAM = [
  'male', 'm', 'man', 'men', 'boy',
  'erkak', 'o‘g‘il', 'ogil', 'ogil bola', 'эркак', 'ўғил', 'угил',
  'мужской', 'мужчина', 'муж', 'м', 'мальчик',
]
const KADIN_TR = ['kadın', 'kız', 'k', 'bayan', 'kız çocuk', 'kız çocuğu']
const ERKEK_TR = ['erkek', 'e', 'bay', 'erkek çocuk', 'erkek çocuğu', 'oğlan']
/** Words that only qualify the sex ("Kız çocuk", "boy child") — ignored when splitting a compound value. */
const DOLGU = new Set(['cocuk', 'cocugu', 'child', 'baby', 'bebek', 'bola', 'ребенок', 'ребёнок'].map(katla))

const KADIN = new Set(KADIN_HAM.map(katla))
const ERKEK = new Set(ERKEK_HAM.map(katla))
const KADIN_T = new Set(KADIN_TR.map(katla))
const ERKEK_T = new Set(ERKEK_TR.map(katla))

function tekil(t: string, turkce: boolean): KanonikCinsiyet | null {
  if (KADIN.has(t) || (turkce && KADIN_T.has(t))) return 'female'
  if (ERKEK.has(t) || (turkce && ERKEK_T.has(t))) return 'male'
  return null
}

export interface CinsiyetSecenegi {
  /** false in a country build: Turkish forms (Kadın / Erkek / K / E) are not accepted. Default true (Türkiye). */
  turkce?: boolean
}

/**
 * Any stored / typed variant → 'male' | 'female'; unknown, empty, "other" or contradictory → null.
 * "Kız/Kadın", "K (Kadın)", "Erkek çocuk" resolve; "male/female" does not (contradictory).
 */
export function cinsiyetKanonik(v: string | null | undefined, secenek: CinsiyetSecenegi = {}): KanonikCinsiyet | null {
  if (v == null) return null
  const turkce = secenek.turkce !== false
  const t = katla(String(v))
  if (!t) return null
  const tam = tekil(t, turkce)
  if (tam) return tam
  const parcalar = t.split(/[\s/\\,;()|.\-_:]+/).filter((p) => p && !DOLGU.has(p))
  if (!parcalar.length) return null
  const sonuc = new Set<KanonikCinsiyet>()
  for (const p of parcalar) {
    const c = tekil(p, turkce)
    if (!c) return null
    sonuc.add(c)
  }
  return sonuc.size === 1 ? [...sonuc][0] : null
}

/** Single-letter Turkish code used by MBYS / report forms: female → 'K', male → 'E'. */
export function cinsiyetKodu(v: string | null | undefined): 'K' | 'E' | null {
  const c = cinsiyetKanonik(v)
  return c === 'female' ? 'K' : c === 'male' ? 'E' : null
}

/** Value to WRITE to patients.gender_encrypted: canonical or null (never a free-text variant). */
export function cinsiyetSakla(v: string | null | undefined): KanonikCinsiyet | null {
  return cinsiyetKanonik(v)
}

/** Turkish display. Unknown non-empty text is shown as typed; empty → '' (caller prints '—'). */
export function cinsiyetTr(v: string | null | undefined): string {
  const c = cinsiyetKanonik(v)
  if (c === 'female') return 'Kadın'
  if (c === 'male') return 'Erkek'
  const t = String(v || '').trim()
  return t
}

/** GÖP / pregnancy-rule sex. Unknown stays conservative (female rules apply). */
export function cinsiyetGop(v: string | null | undefined): 'female' | 'male' | 'unknown' {
  return cinsiyetKanonik(v) ?? 'unknown'
}

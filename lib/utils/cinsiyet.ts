/**
 * Cinsiyet görüntüleme — Kaan (2026-09-10): "Everything has to be Turkish."
 * Veritabanı 'male' | 'female' (ve eski kayıtlarda serbest metin) tutar; ekrana ve
 * asistan bağlamına yalnız Türkçe çıkar. Boş/bilinmeyen → '' (çağıran '—' basar).
 */
export function cinsiyetTr(v: string | null | undefined): string {
  const t = String(v || '').trim().toLowerCase()
  if (!t) return ''
  if (t === 'female' || t === 'f' || t === 'kadın' || t === 'kadin' || t === 'kız' || t === 'kiz') return 'Kadın'
  if (t === 'male' || t === 'm' || t === 'erkek') return 'Erkek'
  return String(v).trim()
}

/** GÖP / pregnancy-rule sex. Unknown stays conservative (female rules apply). */
export function cinsiyetGop(v: string | null | undefined): 'female' | 'male' | 'unknown' {
  const tr = cinsiyetTr(v)
  if (tr === 'Kadın') return 'female'
  if (tr === 'Erkek') return 'male'
  return 'unknown'
}

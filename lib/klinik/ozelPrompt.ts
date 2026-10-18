/**
 * Özel Branş prompt kilidi. Yalnız KLINIK_YENI_SLUGS.
 * TUS dermatoloji / FTR / psikiyatri / KBB / plastik bu yükleyiciye girmez.
 */
import fs from 'fs'
import path from 'path'
import { klinikSlugCoz, type KlinikYeniSlug } from '@/lib/specialties/klinikDikey'

const onbellek = new Map<string, string>()

function oku(slug: KlinikYeniSlug, dosya: 'system.md' | 'soap.md'): string {
  const anahtar = `${slug}:${dosya}`
  const varOlan = onbellek.get(anahtar)
  if (varOlan) return varOlan
  const metin = fs.readFileSync(path.join(process.cwd(), 'specialties', slug, 'prompts', dosya), 'utf8').trim()
  if (!metin) throw new Error(`özel branş prompt boş: ${slug}/${dosya}`)
  onbellek.set(anahtar, metin)
  return metin
}

export function ozelPromptMetni(slug: KlinikYeniSlug): string {
  return oku(slug, 'system.md')
}

export function ozelSoapMetni(slug: KlinikYeniSlug): string {
  return oku(slug, 'soap.md')
}

/** İlk çözülen Özel Branş. Çıplak `dermatoloji` TUS’tur — klinikSlugCoz null döner. */
export function ozelBransSlug(...branslar: (string | null | undefined)[]): KlinikYeniSlug | null {
  for (const b of branslar) {
    const s = klinikSlugCoz(b)
    if (s) return s
  }
  return null
}

export function ozelBransKilidi(...branslar: (string | null | undefined)[]): string {
  const s = ozelBransSlug(...branslar)
  if (!s) return ''
  return `=== ÖZEL BRANŞ KİLİDİ ===\nBu kilit, yukarıdaki genel talimatlarla çeliştiğinde ÖNCELİKLİDİR. Tanı kilitlemez. Doz yazılmaz.\n${ozelPromptMetni(s)}`
}

/** SOAP notu. Ses ve hafıza kısa system.md ile kalır. */
export function ozelBransSoapKilidi(...branslar: (string | null | undefined)[]): string {
  const s = ozelBransSlug(...branslar)
  const kisa = ozelBransKilidi(...branslar)
  if (!s || !kisa) return ''
  return `${kisa}\n\n${ozelSoapMetni(s)}`
}

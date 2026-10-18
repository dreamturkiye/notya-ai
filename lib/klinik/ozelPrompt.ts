/**
 * Özel Branş prompt kilidi. Yalnız KLINIK_YENI_SLUGS.
 * TUS dermatoloji / FTR / psikiyatri / KBB / plastik bu yükleyiciye girmez.
 */
import fs from 'fs'
import path from 'path'
import { klinikSlugCoz, type KlinikYeniSlug } from '@/lib/specialties/klinikDikey'

const onbellek = new Map<KlinikYeniSlug, string>()

export function ozelPromptMetni(slug: KlinikYeniSlug): string {
  const varOlan = onbellek.get(slug)
  if (varOlan) return varOlan
  const metin = fs.readFileSync(path.join(process.cwd(), 'specialties', slug, 'prompts', 'system.md'), 'utf8').trim()
  if (!metin) throw new Error(`özel branş prompt boş: ${slug}`)
  onbellek.set(slug, metin)
  return metin
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

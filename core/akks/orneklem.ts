/**
 * AKKS sampling + blind pairing (pure, deterministic — the same run / item always gives the same decision).
 *
 *  incelemeNedeni: every failing answer goes to the human review queue; a deterministic ~10% of passing answers too.
 *  korEslesme:     Prof. comparison — which answer is shown as "A" to a blind reviewer (hash of invite + item).
 *  korMetni:       strips what would reveal the author (assistant / colleague names, "Hocam", markdown, Notya chips) from
 *                  BOTH answers before a blind reviewer sees them.
 */
import { createHash } from 'node:crypto'

const sayi = (s: string) => parseInt(createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 8), 16)

export const ORNEKLEM_ORANI = 10

export function incelemeNedeni(kosuId: string, soruId: string, gecti: boolean): 'fail' | 'orneklem' | null {
  if (!gecti) return 'fail'
  return sayi(`akks-orneklem:${kosuId}:${soruId}`) % ORNEKLEM_ORANI === 0 ? 'orneklem' : null
}

export function korEslesme(davetId: string, soruId: string): { A: 'ayse' | 'prof'; B: 'ayse' | 'prof' } {
  return sayi(`akks-kor:${davetId}:${soruId}`) % 2 === 0 ? { A: 'ayse', B: 'prof' } : { A: 'prof', B: 'ayse' }
}

const ADLAR = /\b(Prof\.?\s*Dr\.?\s*)?(Ayşe(\s+Kaya)?|Notya|Fatma\s+Çelik|Selin\s+Aksoy|Emre\s+Aydın|Asistan)\b/giu

export function korMetni(metin: string): string {
  return String(metin || '')
    .replace(/\[\[[^\]]*\]\]/g, '')
    .replace(ADLAR, '')
    .replace(/\b(sevgili\s+)?hocam\b[,!.]?\s*/giu, '')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * ASR pause / filler — not a doctor turn.
 * Lives here (not in takvimSorusu) so the voice client can import it without node:crypto.
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'

export function sesGurultusuMu(mesaj: string | null | undefined): boolean {
  const ham = String(mesaj || '').trim()
  if (!ham) return true
  const harf = ham.replace(/[\s.·…,;:!?…\-–—'"“”‘’()[\]]+/g, '')
  if (!harf) return true
  const n = trAramaNormalize(harf)
  return /^(e+|ee+|eee+|hmm+|ii+|iii+|sey|ha+|ah+|ok)$/.test(n)
}

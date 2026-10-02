/**
 * NOTYA-SES-KILIT-01 — what we hand ElevenLabs.
 *
 * Each SSE text delta is synthesised on its own. A drip of short sentences restarts
 * Turkish prosody every time (blended words, dropped endings — the old slur) and a
 * sudden dump of a whole answer is read too fast. Finished sentences are held until
 * they form one breath, then released as a single delta. The tail is always flushed
 * when the turn ends, so nothing is swallowed.
 *
 * Expressive-mode tags ([slow], [excited], …) are stripped. On v3 they are the
 * mechanism that slows a phrase down and then rushes the next one. They have no
 * place in a clinical voice even if a model emits them.
 */

const SES_ETIKET = /\[(slowly|slow|fast|faster|quickly|rushed|rush|excited|excitement|whispers?|whispering|laughs?|laughing|sighs?|sigh|sad|angry|shouts?|shouting|softly|loudly|happy|sarcastic|crying|cries|breath|pause|emphasis|emphasized)\]/gi

/** One breath. Short of this, Flash restarts prosody; past this, a burst starts to rush. */
export const SES_BLOK_ESIGI = 160

export function sesEtiketTemizle(s: string): string {
  return String(s || '').replace(SES_ETIKET, '').replace(/[ \t]{2,}/g, ' ')
}

export class SesYayKapisi {
  private tampon = ''
  private kapali = false

  constructor(private readonly yay: (parca: string) => void) {}

  /** `hemen`: acknowledgement ("Tamam Hocam... ") must not wait for the answer. */
  ekle(parca: string, hemen = false): void {
    if (this.kapali) return
    const t = sesEtiketTemizle(parca)
    if (!t.trim()) return
    this.tampon += t
    if (hemen || this.tampon.length >= SES_BLOK_ESIGI) this.bosalt()
  }

  bitir(): void {
    if (this.kapali) return
    this.kapali = true
    this.bosalt()
  }

  private bosalt(): void {
    const t = this.tampon.trim()
    this.tampon = ''
    if (!t) return
    this.yay(t.endsWith(' ') ? t : `${t} `)
  }
}

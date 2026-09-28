/**
 * NOTYA-SES-KILIT-01 — what we hand ElevenLabs.
 *
 * SesAkisi already emits only a finished sentence. Holding those sentences until
 * 160 characters — or until the whole JSON and the session write finished — was
 * the gap both mouths shared: ElevenLabs could not start, and Fish (which speaks
 * the same stream) could not start, until the turn was over. A finished sentence
 * leaves immediately. A fragment stays here until the turn ends (`bitir`), so a
 * half sentence is still never synthesised on its own.
 *
 * Expressive-mode tags ([slow], [excited], …) are stripped. On v3 they are the
 * mechanism that slows a phrase down and then rushes the next one. They have no
 * place in a clinical voice even if a model emits them.
 */

const SES_ETIKET = /\[(slowly|slow|fast|faster|quickly|rushed|rush|excited|excitement|whispers?|whispering|laughs?|laughing|sighs?|sigh|sad|angry|shouts?|shouting|softly|loudly|happy|sarcastic|crying|cries|breath|pause|emphasis|emphasized)\]/gi

const CUMLE_TAMAM = /[.!?…]["”']?\s*$/

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
    if (hemen || CUMLE_TAMAM.test(this.tampon.trim())) this.bosalt()
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

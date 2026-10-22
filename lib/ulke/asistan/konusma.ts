/**
 * AU-CANLI-01 — THE SPOKEN-VS-SCREEN RULE (Kaan, 2026-09-26, Türkiye's rule, kept as it is): the SCREEN gets the full
 * answer; the VOICE gets three to five spoken beats (the patient or case, the core answer, the dose, the follow-up).
 * A list becomes "N items, on your screen"; a table becomes one sentence; whatever is left becomes "the rest is on
 * your screen". Only FINISHED sentences are ever spoken — never a clause cut in the middle.
 *
 * `SesAkisi` is fed the model's text as it streams and calls `yaz(sentence)` for each sentence that may be spoken.
 * It does not decide what the screen shows: the caller keeps the full text. Pure; the words it adds come from the
 * pack (`ekranSozleri`).
 */
import type { CanliAsistanAyarlari } from '../tipler'

export const SOZ_BEAT_SINIRI = 5
export const LISTE_ESIGI = 3

type EkranSozleri = CanliAsistanAyarlari['ekranSozleri']
type SatirTuru = 'bos' | 'liste' | 'tablo' | 'baslik' | 'ayirac' | 'duz' | 'belirsiz'

const LISTE = /^\s*(?:[-*•]\s+|\d{1,2}[.)]\s+)/
const KISA_ONEK = ['dr', 'mr', 'mrs', 'ms', 'prof', 'vs', 'no', 'approx', 'e.g', 'i.e', 'etc', 'st', 'fig']

function satirTuru(s: string): SatirTuru {
  const t = s.trim()
  if (!t) return 'bos'
  if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(t)) return 'ayirac'
  if (/^\|/.test(t)) return 'tablo'
  if (/^#{1,6}\s/.test(t)) return 'baslik'
  if (LISTE.test(s)) return 'liste'
  // Too short to tell "2." (a list number) from "2.5 mg ..." (a sentence): wait for more of the line.
  if (t.length < 3 || /^\d{1,2}[.)]?$/.test(t) || /^[-*•#|>]$/.test(t)) return 'belirsiz'
  return 'duz'
}

/** Markdown out, so only words are left to say. */
export function duzMetin(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_`~]+/g, '')
    .replace(/^\s*>\s?/, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** First index just after a finished sentence in `s`, or -1. "Dr. Chen", "e.g." and "2.5 mg" do not end one. */
function cumleSonu(s: string): number {
  const desen = /([.!?…])(["')\]]*)\s+(?=["'(\[]?[A-Z0-9])/g
  let m: RegExpExecArray | null
  while ((m = desen.exec(s))) {
    const oncesi = s.slice(0, m.index).split(/\s+/).pop()?.toLowerCase().replace(/^[("'[]+/, '') ?? ''
    if (m[1] === '.' && (KISA_ONEK.includes(oncesi) || /^[a-z]$/.test(oncesi) || /^\d+$/.test(oncesi))) continue
    return m.index + m[0].length
  }
  return -1
}

export class SesAkisi {
  private tampon = ''
  private beat = 0
  private listeSayisi = 0
  private listeMetni: string[] = []
  private tabloSoylendi = false
  private kalanVar = false
  private bitti = false
  private devamiSoylendi = false

  constructor(
    private readonly yaz: (cumle: string) => void,
    private readonly sozler: EkranSozleri,
    private readonly beatSiniri: number = SOZ_BEAT_SINIRI,
  ) {}

  /** true = part of the answer is on the screen only. */
  get ekranaKaldi(): boolean { return this.kalanVar }
  get beatSayisi(): number { return this.beat }

  private soyle(cumle: string): void {
    const t = duzMetin(cumle)
    if (!t || !/[\p{L}\p{N}]/u.test(t)) return
    if (this.beat >= this.beatSiniri) { this.kalanVar = true; return }
    this.beat += 1
    this.yaz(t)
  }

  private listeyiKapat(): void {
    if (this.listeSayisi === 0) return
    if (this.listeSayisi >= LISTE_ESIGI) {
      if (this.beat < this.beatSiniri) { this.beat += 1; this.yaz(this.sozler.liste(this.listeSayisi)) }
      else this.kalanVar = true
    } else {
      // One or two items are said as sentences: they are short enough to hear.
      for (const madde of this.listeMetni) this.soyle(/[.!?]$/.test(madde) ? madde : `${madde}.`)
    }
    this.listeSayisi = 0
    this.listeMetni = []
  }

  private tamSatir(satir: string): void {
    const tur = satirTuru(satir)
    if (tur === 'liste') {
      this.listeSayisi += 1
      this.listeMetni.push(duzMetin(satir.replace(LISTE, '')))
      return
    }
    this.listeyiKapat()
    if (tur === 'tablo') {
      if (!this.tabloSoylendi) {
        this.tabloSoylendi = true
        if (this.beat < this.beatSiniri) { this.beat += 1; this.yaz(this.sozler.tablo) } else this.kalanVar = true
      }
      return
    }
    if (tur === 'bos' || tur === 'ayirac') { this.tabloSoylendi = false; return }
    if (tur === 'baslik') { return }
    this.tabloSoylendi = false
    // A prose line: whatever is still held is its tail — a finished sentence now, because the line has ended.
    this.soyle(satir)
  }

  /** Feed the text that has streamed in since the last call. */
  ekle(parca: string): void {
    if (this.bitti || !parca) return
    this.tampon += parca
    let i: number
    while ((i = this.tampon.indexOf('\n')) >= 0) {
      const satir = this.tampon.slice(0, i)
      this.tampon = this.tampon.slice(i + 1)
      this.tamSatir(satir)
    }
    // The line in progress: a prose line may already hold finished sentences. A list, table or heading line waits for its end.
    if (satirTuru(this.tampon) === 'duz') {
      this.listeyiKapat()
      for (;;) {
        const son = cumleSonu(this.tampon)
        if (son < 0) break
        this.soyle(this.tampon.slice(0, son))
        this.tampon = this.tampon.slice(son)
      }
    }
  }

  /** The stream has ended. Whatever is held is the last line. */
  bitir(): void {
    if (this.bitti) return
    if (this.tampon.trim()) { const son = this.tampon; this.tampon = ''; this.tamSatir(son) }
    this.listeyiKapat()
    this.bitti = true
    if (this.kalanVar && !this.devamiSoylendi) {
      this.devamiSoylendi = true
      this.yaz(this.sozler.devami)
    }
  }
}

/** The whole answer, spoken form: for the tests and for a model call that did not stream. */
export function konusmaYap(ekran: string, sozler: EkranSozleri, beatSiniri: number = SOZ_BEAT_SINIRI): string {
  const cikti: string[] = []
  const akis = new SesAkisi((c) => cikti.push(c), sozler, beatSiniri)
  akis.ekle(ekran)
  akis.bitir()
  return cikti.join(' ')
}

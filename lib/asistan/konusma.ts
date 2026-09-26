/**
 * NOTYA-TEK-BEYIN — Ayşe'nin ekran cevabından SÖZLÜ biçim (Kaan, 2026-09-25).
 *
 * Tek beyin iki biçim üretir: `ekran` (biçimli metin — başlık, madde, tablo) ve `konusma` (doğal Türkçe cümleler).
 * 2026-09-25 rule (Dr. Gökhan / Kaan): the spoken answer was as detailed as the written one. REVERSED by Kaan on
 * 2026-09-26 (NOTYA-SES-SLUR-01): reading the chart like a document produced late-turn slur. Now: ekran stays full;
 * konusma = at most SOZ_BEAT_SINIRI sentences, lists of LISTE_ESIGI+ items become "N madde, ekranınızda".
 * Yalnız iki şey ekranda kalır:
 *   - kimlik / iletişim değeri (VELI-YASAL-ONAM): telefon, e-posta, T.C. kimlik no içeren cümle ve "(d.t. …)"
 *     doğum tarihi okunmaz; bir kez "İletişim bilgisini ekranınıza yazdım." denir;
 *   - tablolar (uzun sayısal tablolar): satırları okunmaz; bir kez "Tabloyu ekranınıza yazdım." denir.
 * Biçim işaretleri (madde imi, numara, **, #, emoji) konuşmaya çevrilir ya da atılır. Sözlü biçim modelden ayrı
 * istenmez; ekran metninden cümle cümle türetilir — yazı ve ses aynı cevabı verir, akışta (model yazarken) aynı
 * kurallar uygulanır. Saf modül (lib/asistan/tekBeyin.test.ts).
 */

/** Kimlik sorusunun sözlü biçimi gibi değerin hiç okunmadığı yerler için. */
export const EKRANA_YAZDIM = 'Ayrıntıları ekranınıza yazdım Hocam.'
export const ILETISIM_EKRANDA = 'İletişim bilgisini ekranınıza yazdım.'
export const TABLO_EKRANDA = 'Tabloyu ekranınıza yazdım.'
/** NOTYA-SES-SLUR-01 (Kaan, 2026-09-26): a spoken turn is at most this many sentences; the rest stays on screen. */
export const SOZ_BEAT_SINIRI = 5
export const DEVAMI_EKRANDA = 'Devamı ekranınızda Hocam.'
/** Lists of this many items or more are not read item by item — one sentence points to the screen. */
export const LISTE_ESIGI = 3
export function listeEkranda(n: number): string { return `${n} madde, ekranınızda.` }
const BASLIK_SATIRI = /^\s*#{1,6}\s+/
const LISTE_MADDESI = /^\s*(?:[-*•]\s+|\d{1,2}\.\s+)/

/** ElevenLabs: bekletme sözü "... " (üç nokta + boşluk) ile biter — ardından gelen cevapla doğal birleşir. */
export const DOLGU_BAKIYORUM = 'Bakıyorum Hocam... '
export const DOLGU_KAYDEDIYORUM = 'Tamam Hocam... '

const TELEFON = /(?:\+?90[\s-]?)?\(?0?5\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b|\b0?\d{3}[\s-]\d{3}[\s-]\d{2}[\s-]\d{2}\b/
const EPOSTA = /[\w.+-]+@[\w-]+\.[\w.]+/
const TC_NO = /\b[1-9]\d{10}\b/
const TABLO_SATIRI = /^\s*\|/
const AYIRAC_SATIRI = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/
// Madde imi atılır; satır içi listenin "2)" numarası (satirIciNumara) okunur.
const MADDE_IMI = /^\s*(?:[-*•]\s+|\d{1,2}\.\s+|#{1,6}\s+|>\s*)/
const BUYUK = 'A-ZÇĞİÖŞÜ'
// Cümle sonu: nokta/ünlem/soru + boşluk + büyük harf (ya da satır içi "2)" numarası). "d.t. 20.05" bölünmez.
const CUMLE_SONU = new RegExp(`([.!?…])\\s+(?=["“'(]?[${BUYUK}]|\\d{1,2}\\))`)
/** Bir cümlede okunmaması gereken kimlik / iletişim değeri var mı? */
export function kimlikDegeriVarMi(s: string): boolean {
  return TELEFON.test(s) || EPOSTA.test(s) || TC_NO.test(s)
}

function satirIciSade(s: string): string {
  return s
    .replace(MADDE_IMI, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*|__|`/g, '')
    .replace(/(^|\s)[*_](\S)/g, '$1$2')
    .replace(/(\S)[*_](?=\s|$)/g, '$1')
    // doğum tarihi kimlik değeridir: "(d.t. 20.05.1948)" okunmaz
    .replace(/\s*\(d\.\s?t\.[^)]*\)/gi, '')
    .replace(/\p{Extended_Pictographic}|[\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s+·\s+/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** "8 hasta: 1. Ali — ateş. 2. Veli" — satır içi numara cümle sonu sanılmasın: "1." → "1)". */
function satirIciNumara(t: string): string {
  return t.replace(/([:.—]\s+)(\d{1,2})\.(\s)/g, '$1$2)$3')
}

/**
 * Akışlı sözlü biçim. `ekle(tamMetinSimdiye)` her seferinde ekran metninin o ana kadarki TAMAMINI alır (akıştan
 * çözülen "speech" öneki); yeni tamamlanan cümleler temizlenip `yay`a gider. `bitir()` kalanı söyler.
 */
export class SesAkisi {
  private islenen = 0
  private tampon = ''
  private iletisimNotu = false
  private tabloNotu = false
  private devamNotu = false
  private beat = 0
  private liste: string[] = []
  readonly soylenen: string[] = []

  constructor(
    private readonly yay: (parca: string) => void,
    private readonly temizle: (cumle: string) => string = (c) => c,
    /** NOTYA-SES-ERKEN-01: fired once, right after "Devamı ekranınızda" — the voice turn can close here. */
    private readonly onSinir?: () => void,
    /** NOTYA-SES-OKU-01: sentence cap for this stream; Infinity reads everything ("bana anlat"). */
    private readonly sinir: number = SOZ_BEAT_SINIRI,
    /** NOTYA-SES-DEVAM-01: a continuation turn follows the cap — stop silently, no "Devamı ekranınızda". */
    private readonly sessizSinir = false,
  ) {}

  /** NOTYA-SES-DEVAM-01: the cap was reached (sentences after it were not spoken). */
  get sinirAsildi(): boolean { return this.devamNotu }

  ekle(tamMetin: string): void {
    if (tamMetin.length <= this.islenen) return
    this.tampon += tamMetin.slice(this.islenen)
    this.islenen = tamMetin.length
    this.isle(false)
  }

  bitir(): string {
    this.isle(true)
    this.listeyiBitir()
    return this.soylenen.join(' ').trim()
  }

  /** Notes ("ekranınıza yazdım") do not count as beats; sentences do. */
  private soyle(s: string, not = false): void {
    if (!not) {
      if (this.beat >= this.sinir) {
        if (!this.devamNotu) {
          this.devamNotu = true
          if (!this.sessizSinir) { this.soylenen.push(DEVAMI_EKRANDA); this.yay(`${DEVAMI_EKRANDA} `) }
          try { this.onSinir?.() } catch { /* yok */ }
        }
        return
      }
      this.beat++
    }
    this.soylenen.push(s)
    this.yay(`${s} `)
  }

  /**
   * NOTYA-SES-SLUR-01 (Kaan, 2026-09-26): only FINISHED sentences reach the voice. The old "first clause at the
   * first comma" flush fed ConvAI half-sentences that were synthesised separately and came out slurred; it is gone.
   * A sentence ends at . ! ? … (followed by a capital or an inline number) or at a newline; bitir() speaks the tail.
   */
  private isle(son: boolean): void {
    for (;;) {
      this.tampon = satirIciNumara(this.tampon)
      const nl = this.tampon.indexOf('\n')
      const m = CUMLE_SONU.exec(this.tampon)
      let kesit: string | null = null
      if (nl !== -1 && (!m || nl < m.index)) {
        kesit = this.tampon.slice(0, nl)
        this.tampon = this.tampon.slice(nl + 1)
      } else if (m) {
        kesit = this.tampon.slice(0, m.index + 1)
        this.tampon = this.tampon.slice(m.index + m[0].length)
      } else if (son) {
        kesit = this.tampon
        this.tampon = ''
      }
      if (kesit === null) return
      this.cumle(kesit)
      if (son && !this.tampon) return
    }
  }

  /** List items are held; ${LISTE_ESIGI}+ items become one pointer sentence, fewer are read as sentences. */
  private listeyiBitir(): void {
    const items = this.liste
    this.liste = []
    if (!items.length) return
    if (items.length >= LISTE_ESIGI) { this.soyle(listeEkranda(items.length)); return }
    for (const s of items) this.soyle(s)
  }

  private cumle(ham: string): void {
    if (!ham.trim() || AYIRAC_SATIRI.test(ham)) return
    if (TABLO_SATIRI.test(ham)) {
      this.listeyiBitir()
      if (!this.tabloNotu) { this.tabloNotu = true; this.soyle(TABLO_EKRANDA, true) }
      return
    }
    const madde = LISTE_MADDESI.test(ham)
    if (!madde) this.listeyiBitir()
    const s = this.temizle(satirIciSade(ham)).trim()
    if (!s) return
    if (kimlikDegeriVarMi(s)) {
      if (!this.iletisimNotu) { this.iletisimNotu = true; this.soyle(ILETISIM_EKRANDA, true) }
      return
    }
    // Başlık / madde satırı nokta ile bitmez — konuşmada cümle sonu olsun ("Muayene:" → "Muayene.").
    const cumle = /[.!?…]$/.test(s) ? s : `${s.replace(/[:;,]$/, '')}.`
    // A heading ("## Muayene", "Tedavi:") is structure, not content: spoken, but not counted as a beat.
    const baslik = BASLIK_SATIRI.test(ham) || (/[:]\s*$/.test(ham.trim()) && ham.trim().split(/\s+/).length <= 4)
    if (madde) this.liste.push(cumle)
    else this.soyle(cumle, baslik)
  }
}

/** Akışsız: ekran metninin tamamından sözlü biçim. */
export function konusmaYap(ekran: string, temizle?: (cumle: string) => string, secenek?: { sinirsiz?: boolean }): string {
  const a = new SesAkisi(() => {}, temizle, undefined, secenek?.sinirsiz ? Number.POSITIVE_INFINITY : SOZ_BEAT_SINIRI)
  a.ekle(String(ekran || ''))
  return a.bitir()
}

/** NOTYA-SES-DEVAM-01: the uncapped spoken sentences of a screen answer, one entry per sentence / note. */
export function sozCumleleri(ekran: string, temizle?: (cumle: string) => string): string[] {
  const a = new SesAkisi(() => {}, temizle, undefined, Number.POSITIVE_INFINITY)
  a.ekle(String(ekran || ''))
  a.bitir()
  return [...a.soylenen]
}

const bosluk = (s: string) => s.replace(/\s+/g, ' ').trim()

/**
 * NOTYA-SES-DEVAM-01 (Dr. Gökhan, 2026-09-26): what is left to say after a cut voice turn. `tumCumleler` is the
 * uncapped spoken form (sozCumleleri), `soylenen` the text that actually reached ElevenLabs before the turn closed.
 * The leading sentences found in order in `soylenen` are dropped; if not even the first one matches, the whole
 * answer is the remainder (repeating is better than skipping).
 */
export function sesDevamKalani(tumCumleler: string[], soylenen: string): string {
  const sozlu = bosluk(soylenen)
  let konum = 0
  let k = 0
  for (const c of tumCumleler) {
    const n = bosluk(c)
    if (!n) { k++; continue }
    const i = sozlu.indexOf(n, konum)
    if (i === -1) break
    konum = i + n.length
    k++
  }
  return tumCumleler.slice(k).map(bosluk).filter(Boolean).join(' ')
}

/**
 * NOTYA-SES-DEVAM-01: the hidden continuation turn the /asistan page sends when a cut voice turn has a remainder
 * (`[devam]`), or the doctor simply saying "devam" / "devam et".
 */
export const DEVAM_ISARETI = '[devam]'
const DEVAM_SOZU = /^devam(?:\s+(?:et|etsene|edin|edelim))?(?:\s+(?:hocam|ayşe|lütfen))*[.!]?$/iu
export function devamIstegiMi(mesaj: string): boolean {
  const m = String(mesaj || '').trim()
  if (m === DEVAM_ISARETI) return true
  return DEVAM_SOZU.test(m.toLocaleLowerCase('tr-TR'))
}

/**
 * NOTYA-AYSE-ACILIS-01 (Kaan, 2026-09-26): "Bakıyorum Hocam" her cevabın önüne geliyordu ve rahatsız ediciydi —
 * bekletme sözü tamamen kaldırıldı (süreye bağlı söylemek güvenilir ölçülemez). Yalnız sesli onayda
 * "Kaydediyorum Hocam..." kalır — o bir bekletme değil, işlemin alındığının teyididir.
 */
export function dolguSec(mesaj: string, g: { onay: boolean; vazgec: boolean; sosyal: boolean }): string {
  if (g.vazgec || g.sosyal || !String(mesaj || '').trim()) return ''
  return g.onay ? DOLGU_KAYDEDIYORUM : ''
}

/**
 * NOTYA-SES-OKU-01 (Dr. Gökhan, 2026-09-26: "Devamını ekranda görüyorum ama sen bana anlat"): the doctor asks
 * to HEAR the answer that is already on screen. No model call — the screen text is read aloud without the
 * sentence cap. Lists are still summarised ("N madde") because a list is not speech; prose is read in full.
 */
const OKU_ISTEGI = /(?:bana\s+(?:anlat|oku|söyle)|anlat(?:ır|sana)?\s*mısın|anlat\s*bakalım|devam(?:ını|ı)?\s*(?:anlat|oku|söyle)|sesli\s*(?:anlat|oku|söyle)|oku(?:r|sana)?\s*mısın|ekrandakini\s*(?:anlat|oku)|sen\s+bana\s+anlat|tamamını\s*(?:anlat|oku)|hepsini\s*(?:anlat|oku)|(?:^|\s)oku(?:sana)?\s*[.!?]?\s*$)/iu
export function okumaIstegiMi(mesaj: string): boolean {
  const m = String(mesaj || '').trim()
  return m.length <= 160 && OKU_ISTEGI.test(m)
}

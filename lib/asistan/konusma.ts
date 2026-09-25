/**
 * NOTYA-TEK-BEYIN — Ayşe'nin ekran cevabından SÖZLÜ biçim (Kaan, 2026-09-25).
 *
 * Tek beyin iki biçim üretir: `ekran` (biçimli metin — başlık, madde, tablo) ve `konusma` (doğal Türkçe cümleler).
 * Dr. Gökhan / Kaan (NOTYA-TEK-BEYIN ek şartı): sesli cevap yazılı cevap kadar AYRINTILIDIR — özet bölümleri,
 * muayene, tanı, dozlu tedavi, takip aynen okunur; kısa bir özet DEĞİLDİR. Ekran aynı anda biçimli metni gösterir.
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
/** İlk cümlenin ilk bölümü: en az 25 karakter, sonra ", " / " — " / " – " (ardından bir kelime başlamış olmalı). */
const ILK_BOLUM = /^[^\n]{25,}?(?:,|\s[—–])(?=\s+\S)/

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
  readonly soylenen: string[] = []

  constructor(
    private readonly yay: (parca: string) => void,
    private readonly temizle: (cumle: string) => string = (c) => c,
  ) {}

  ekle(tamMetin: string): void {
    if (tamMetin.length <= this.islenen) return
    this.tampon += tamMetin.slice(this.islenen)
    this.islenen = tamMetin.length
    this.isle(false)
  }

  bitir(): string {
    this.isle(true)
    return this.soylenen.join(' ').trim()
  }

  private soyle(s: string): void {
    this.soylenen.push(s)
    this.yay(`${s} `)
  }

  private isle(son: boolean): void {
    for (;;) {
      this.tampon = satirIciNumara(this.tampon)
      const nl = this.tampon.indexOf('\n')
      const m = CUMLE_SONU.exec(this.tampon)
      let kesit: string | null = null
      // Hız: ilk söz, ilk cümle bitmeden ilk virgül / tirede gider (seslendirme erken başlar); aynı süzgeçlerden geçer.
      const ilkParca = !this.soylenen.length && nl === -1 && !m && !son && !TABLO_SATIRI.test(this.tampon) ? ILK_BOLUM.exec(this.tampon) : null
      if (ilkParca) {
        const t = this.tampon.slice(0, ilkParca.index + ilkParca[0].length)
        this.tampon = this.tampon.slice(t.length)
        this.cumle(t, true)
        continue
      }
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
      this.cumle(kesit, false)
      if (son && !this.tampon) return
    }
  }

  private cumle(ham: string, bolum: boolean): void {
    if (!ham.trim() || AYIRAC_SATIRI.test(ham)) return
    if (TABLO_SATIRI.test(ham)) {
      if (!this.tabloNotu) { this.tabloNotu = true; this.soyle(TABLO_EKRANDA) }
      return
    }
    const s = this.temizle(satirIciSade(ham)).trim()
    if (!s) return
    if (kimlikDegeriVarMi(s)) {
      if (!this.iletisimNotu) { this.iletisimNotu = true; this.soyle(ILETISIM_EKRANDA) }
      return
    }
    // Başlık / madde satırı nokta ile bitmez — konuşmada cümle sonu olsun ("Muayene:" → "Muayene.").
    this.soyle(bolum || /[.!?…]$/.test(s) ? s : `${s.replace(/[:;,]$/, '')}.`)
  }
}

/** Akışsız: ekran metninin tamamından sözlü biçim. */
export function konusmaYap(ekran: string, temizle?: (cumle: string) => string): string {
  const a = new SesAkisi(() => {}, temizle)
  a.ekle(String(ekran || ''))
  return a.bitir()
}

/**
 * Hangi turda bekletme sözü söylenir: sunucu bir arama ya da model çağrısı yapacaksa hep. Net selamlaşma
 * (hızlı model, kısa cevap) ve vazgeç (anında) sözsüz; sesli onay "Tamam Hocam..." ile başlar.
 */
export function dolguSec(mesaj: string, g: { onay: boolean; vazgec: boolean; sosyal: boolean }): string {
  if (g.vazgec || g.sosyal || !String(mesaj || '').trim()) return ''
  return g.onay ? DOLGU_KAYDEDIYORUM : DOLGU_BAKIYORUM
}

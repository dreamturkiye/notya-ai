/**
 * ESNEK-MUAYENE-A — El Notu Okuyucu: shared types (pure, country-neutral; no words, no DOM, no server imports).
 *
 * Coordinates: every box is normalised to the de-warped page (0..1 on both axes) unless the name says "piksel".
 */

/** 8-bit grayscale raster (row-major). */
export type Gri = { w: number; h: number; d: Uint8ClampedArray }
/** RGBA raster as produced by canvas getImageData (row-major, 4 bytes per pixel). */
export type Rgba = { w: number; h: number; d: Uint8ClampedArray }
/** 0/1 mask raster. */
export type Maske = { w: number; h: number; d: Uint8Array }

export type Nokta = { x: number; y: number }
/** Page corners in pixel space: top-left, top-right, bottom-right, bottom-left. */
export type Dortgen = [Nokta, Nokta, Nokta, Nokta]
export type Kutu = { x0: number; y0: number; x1: number; y1: number }

export type KorumaliTur = 'taraf' | 'olumsuzluk' | 'sayi' | 'doz' | 'ilac' | 'alerji'
export type DogrulaSinif = 'kelime' | 'kisaltma' | 'korumali' | 'cizim' | 'celiski'
export type Taraf = 'sag' | 'sol' | 'iki' | null

/** Capture quality verdict, decided on the device before anything is sent. */
export type KaliteNedeni = 'bulanik' | 'parlama' | 'karanlik' | 'kucuk' | 'sayfa_yok'
export type KaliteKarari = { tamam: boolean; nedenler: KaliteNedeni[]; olcum: { bulaniklik: number; parlama: number; parlaklik: number; kisaKenar: number; sayfaOrani: number } }

export type CizimBolgesi = {
  id: string
  /** Anatomy key (seed/branş data, e.g. 'kulak_zari', 'burun_septum'). */
  anatomi: string
  /** Display label in the build's language (data, not code). */
  etiket: string
  /** Laterality is decided by the template geometry, never by a model (protected class). */
  taraf: Taraf
  kutu: Kutu
}

export type Sablon = {
  id: string
  ad: string
  /** 'formlu' = printed form with a header band; 'serbest' = a plain sheet the doctor declared as carrying no identity. */
  tur: 'formlu' | 'serbest'
  brans: string | null
  enBoy: number
  baslikBolgeleri: Kutu[]
  cizimBolgeleri: CizimBolgesi[]
  parmakIzi: number[] | null
}

/** One word as read by one model pass. `g` = the model's own 0..1 confidence; `alt` = alternative readings. */
export type HamKelime = { m: string; g: number; alt?: string[] }
export type HamSatir = { no: number; kelimeler: HamKelime[]; okunamadi?: boolean; /** the strip holds no handwriting (printed text / drawing / noise) */ bos?: boolean }

/** A word after self-consistency and re-ranking. */
export type OkunanKelime = {
  metin: string
  guven: number
  adaylar: string[]
  /** true when the two independent reads agreed on this word. */
  uyum: boolean
  korumali: KorumaliTur[]
  /** Accepted without a question (high confidence, reads agree, protected rules satisfied). */
  kabul: boolean
  kutu?: Kutu
  /** Came from the doctor's own confirmed crop memory (in-context example match). */
  hafizadan?: boolean
}

export type SatirOkuma = {
  no: number
  kutu: Kutu
  kelimeler: OkunanKelime[]
  /** Literal text (words joined). */
  ham: string
  /** Clinical normalisation (lexicon expansions); never adds a fact the literal text does not carry. */
  normal: string
  /** Template drawing region this line annotates (proximity / leader line), if any. */
  bolgeId?: string | null
}

export type CizimIsareti = 'yazi' | 'ok' | 'daire' | 'tarama' | 'cizgi' | 'normal_isareti' | 'nokta'
export type CizimBulgusu = {
  bolgeId: string
  anatomi: string
  taraf: Taraf
  bulgu: string
  isaret: CizimIsareti
  guven: number
  kabul: boolean
  /** The template region box (for the provenance crop). */
  kutu?: Kutu
}

export type DogrulaSorusu = {
  anahtar: string
  sinif: DogrulaSinif
  korumaliTur?: KorumaliTur
  okunan: string
  adaylar: string[]
  sayfa: number
  kutu: Kutu | null
  satirNo?: number
  kelimeNo?: number
  bolgeId?: string
  /** Line text around the word (masked page content only). */
  baglam: string
}

export type SayfaOkuma = {
  sayfa: number
  sablonId: string | null
  /** Vault id of this page's MASKED picture (crops for Doğrula / provenance are cut from it). */
  maskeliBelgeId?: string
  satirlar: SatirOkuma[]
  cizimler: CizimBulgusu[]
  dogrula: DogrulaSorusu[]
}

export type KaynakOkuma = {
  surum: 1
  sayfalar: SayfaOkuma[]
  /** Clinical text of the whole source, page by page, with drawing findings per region. */
  metin: string
  istatistik: { kelime: number; kabul: number; dogrula: number; korumaliAcik: number; hafizaOrnegi: number; okumaSayisi: number }
}

/** A lexicon entry: abbreviation / symbol -> meaning. */
export type SozlukGirdisi = { kisaltma: string; anlam: string; kaynak: 'hekim' | 'brans' | 'genel'; baglam?: 'yas_cinsiyet' | 'sembol' | 'kelime' }

/** One stored memory example (the doctor's confirmed crop). */
export type HafizaOrnegi = { id: string; metin: string; tanimlayici: number[]; enBoy: number; korumali: boolean; gorsel?: { mime: string; base64: string } }

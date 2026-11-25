/**
 * TR-PROTOKOL-KUTUPHANESI — source chips: which registry documents a text (an Ayşe answer, a note suggestion) names, with the
 * confirmed edition, the section the text is about, and the official link. Pure; the only import is the registry data, so
 * the client loads it in a lazy chunk (components/kaynaklar/KaynakCipleri.tsx) and never in a page's first load.
 *
 * A chip shows ONLY what the registry confirms: an unconfirmed edition is shown as "sürüm doğrulanmadı", never guessed.
 */
import { PROTOKOL_BELGELERI } from './belgeler'
import type { BelgeBolumu, ProtokolBelgesi } from './tipler'

export type KaynakCipi = {
  belgeId: string
  /** "SB Migren Klinik Protokolü" */
  etiket: string
  /** "Revizyon No. 01 (Ağustos 2025)" or "sürüm doğrulanmadı" */
  surum: string
  yil: number | null
  /** "3. Migren Başağrısı Tedavisi (s. 12)" when the text is about one section of the document. */
  bolum: string | null
  url: string | null
  durum: ProtokolBelgesi['durum']
  sonDogrulama: string
}

export const CIP_SINIRI = 4
export const SURUM_DOGRULANMADI = 'sürüm doğrulanmadı'

export const kucukHarf = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ')

const HARF = 'a-zçğıöşüâîû0-9'

/** The phrase occurs at a word start (Turkish suffixes after it are fine); short phrases (≤ 5 letters) must stand alone. */
export function ifadeGeciyor(metin: string, ifade: string): boolean {
  const kacis = ifade.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const son = ifade.replace(/\s/g, '').length <= 5 ? `(?![${HARF}])` : ''
  return new RegExp(`(?<![${HARF}])${kacis}${son}`, 'u').test(metin)
}

function bolumSec(b: ProtokolBelgesi, metin: string): BelgeBolumu | null {
  let en: { bolum: BelgeBolumu; puan: number } | null = null
  for (const bolum of b.bolumler || []) {
    const puan = bolum.konu.filter((k) => ifadeGeciyor(metin, k)).length
    if (puan > 0 && (!en || puan > en.puan)) en = { bolum, puan }
  }
  return en?.bolum ?? null
}

export function bolumEtiketi(bolum: BelgeBolumu): string {
  return bolum.sayfa ? `${bolum.baslik} (s. ${bolum.sayfa})` : bolum.baslik
}

export function cipOlustur(b: ProtokolBelgesi, bolum: BelgeBolumu | null = null): KaynakCipi {
  return {
    belgeId: b.id,
    etiket: b.kisaAd,
    surum: b.durum === 'guncel' && b.surum ? b.surum : SURUM_DOGRULANMADI,
    yil: b.durum === 'guncel' ? b.yil : null,
    bolum: bolum ? bolumEtiketi(bolum) : null,
    url: b.url,
    durum: b.durum,
    sonDogrulama: b.sonDogrulama,
  }
}

/**
 * Documents the text names. Longest alias first, so "türk hipertansiyon uzlaşı raporu" wins over a shorter overlapping one;
 * a superseded document is never chipped (its newer edition carries the alias). At most CIP_SINIRI chips.
 */
export function kaynakCipleri(metin: string, belgeler: readonly ProtokolBelgesi[] = PROTOKOL_BELGELERI): KaynakCipi[] {
  if (!metin || metin.length < 6) return []
  const m = kucukHarf(metin)
  const adaylar: { b: ProtokolBelgesi; uzunluk: number; konum: number }[] = []
  for (const b of belgeler) {
    if (b.durum === 'yerine-yenisi-geldi') continue
    let en: { uzunluk: number; konum: number } | null = null
    for (const ad of b.atifAdlari) {
      if (!ifadeGeciyor(m, ad)) continue
      const konum = m.indexOf(ad)
      if (!en || ad.length > en.uzunluk) en = { uzunluk: ad.length, konum }
    }
    if (en) adaylar.push({ b, ...en })
  }
  // A shorter alias inside the span of a longer, already chosen one is the same mention ("inme rehberi" ⊂ "akut iskemik inme rehberi").
  adaylar.sort((a, b) => b.uzunluk - a.uzunluk)
  const secilen: typeof adaylar = []
  for (const a of adaylar) {
    if (secilen.some((s) => a.konum >= s.konum && a.konum + a.uzunluk <= s.konum + s.uzunluk && s.b.id !== a.b.id)) continue
    secilen.push(a)
  }
  secilen.sort((a, b) => a.konum - b.konum)
  return secilen.slice(0, CIP_SINIRI).map(({ b }) => cipOlustur(b, bolumSec(b, m)))
}

/** "SB Migren Klinik Protokolü · Revizyon No. 01 (Ağustos 2025) · 3. Migren Başağrısı Tedavisi (s. 12)" */
export function cipMetni(c: KaynakCipi): string {
  return [c.etiket, c.surum, c.bolum].filter(Boolean).join(' · ')
}

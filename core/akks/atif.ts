/**
 * AKKS deterministic citation check (pure). The grader judges citation accuracy; this is the backstop for the one thing a
 * machine can check exactly: a year / edition cited for a document whose edition the TR-PROTOKOL-KUTUPHANESI registry has
 * confirmed. A different year next to that document's name, or a citation of a superseded edition, caps the citation
 * criterion at 0 ("citation accuracy 100% for any cited edition").
 */

/** The subset of a registry entry (lib/kaynaklar/protokolKutuphanesi ProtokolBelgesi) this check needs. */
export interface KayitliBelge {
  id: string
  kisaAd: string
  yil: number | null
  surum: string | null
  durum: 'guncel' | 'yerine-yenisi-geldi' | 'dogrulanamadi'
  /** Lower-case names a text uses for the document. */
  atifAdlari: string[]
}

export type AtifBulgusu = { belge: string; neden: 'yanlis-yil' | 'eski-surum'; alinti: string }

const kucuk = (s: string) => s.toLocaleLowerCase('tr-TR')

/** Years cited within ~60 characters after (or 25 before) a mention of the document. */
export function atifDenetle(metin: string, belgeler: readonly KayitliBelge[]): AtifBulgusu[] {
  const t = kucuk(metin)
  const bulgular: AtifBulgusu[] = []
  for (const b of belgeler) {
    for (const ad of b.atifAdlari.map(kucuk).filter((a) => a.length >= 6)) {
      let i = t.indexOf(ad)
      while (i >= 0) {
        const pencere = t.slice(Math.max(0, i - 25), i + ad.length + 60)
        const yillar = [...pencere.matchAll(/\b(19[89]\d|20[0-4]\d)\b/g)].map((m) => Number(m[1]))
        const alinti = metin.slice(Math.max(0, i - 25), i + ad.length + 60).replace(/\s+/g, ' ').trim()
        if (b.durum === 'yerine-yenisi-geldi') bulgular.push({ belge: b.id, neden: 'eski-surum', alinti })
        else if (b.durum === 'guncel' && b.yil && yillar.length && !yillar.includes(b.yil)) bulgular.push({ belge: b.id, neden: 'yanlis-yil', alinti })
        i = t.indexOf(ad, i + ad.length)
      }
    }
  }
  const tekil = new Map(bulgular.map((x) => [`${x.belge}:${x.neden}`, x]))
  return [...tekil.values()]
}

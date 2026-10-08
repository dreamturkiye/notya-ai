/**
 * NOTYA-ULKE-01 — leak test harness (docs/COUNTRY-PACK-CHECKLIST.md, rule 7).
 *
 * Scans what one country would SHOW (rendered HTML, an API answer, a message, a note) for the marks of every OTHER
 * country. Each country declares its own marks in countries/<kod>/sizintiTerimleri.ts: terms (state systems, payers,
 * law, money, reference names) and the letters only its languages use.
 *
 * TEST CODE: it imports every pack (countries/tumu.ts) and must never be imported by application code.
 *
 *   const bulgular = sizintiTara(html, { hedefUlke: 'uz', kaynak: '/' })
 *   sizintiYok(html, { hedefUlke: 'uz', kaynak: '/' })      // throws with every finding listed
 */
import { TUM_ULKELER } from '@/countries/tumu'
import { ULKE_KODLARI, type SizintiTerimi, type UlkeKodu } from '@/lib/ulke/tipler'

export type SizintiBulgusu = {
  /** Country whose mark was found. */
  ulke: UlkeKodu
  tur: 'terim' | 'harf'
  terim: string
  /** A few characters around the hit. */
  baglam: string
  kaynak: string
}

/** Case fold that also joins the Turkish dotted / dotless i, so "E-NABIZ", "e-Nabız" and "e-nabiz" are one. */
function katla(s: string): string {
  return s.toLowerCase().replace(/i̇/g, 'i').replace(/ı/g, 'i')
}

const HARF_VEYA_RAKAM = /[\p{L}\p{N}]/u

function terimAra(metin: string, katli: string, t: SizintiTerimi): number[] {
  const samanlik = t.buyukKucukDuyarli ? metin : katli
  const igne = t.buyukKucukDuyarli ? t.terim : katla(t.terim)
  const yerler: number[] = []
  let i = samanlik.indexOf(igne)
  while (i !== -1) {
    if (t.eslesme === 'parca') yerler.push(i)
    else {
      const once = i > 0 ? samanlik[i - 1] : ''
      const sonra = samanlik[i + igne.length] ?? ''
      if (!(once && HARF_VEYA_RAKAM.test(once)) && !(sonra && HARF_VEYA_RAKAM.test(sonra))) yerler.push(i)
    }
    i = samanlik.indexOf(igne, i + Math.max(1, igne.length))
  }
  return yerler
}

const baglam = (metin: string, i: number, uzunluk: number) =>
  metin.slice(Math.max(0, i - 30), i + uzunluk + 30).replace(/\s+/g, ' ').trim()

/**
 * Visible text of an HTML document plus the attribute values people read or hear (alt, title, placeholder,
 * aria-label, meta content, value). Scripts, styles and markup are dropped — a chunk file name is not content.
 */
export function gorunurMetin(html: string): string {
  const parcalar: string[] = []
  const ozellik = /\b(?:alt|title|placeholder|aria-label|content|value|lang)\s*=\s*"([^"]*)"|\b(?:alt|title|placeholder|aria-label|content|value|lang)\s*=\s*'([^']*)'/g
  let m: RegExpExecArray | null
  while ((m = ozellik.exec(html))) parcalar.push(m[1] ?? m[2] ?? '')
  const govde = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
  parcalar.push(govde)
  return parcalar.join('\n')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
}

export function sizintiTara(metin: string, secenek: { hedefUlke: UlkeKodu; kaynak: string }): SizintiBulgusu[] {
  const bulgular: SizintiBulgusu[] = []
  const katli = katla(metin)
  // A document that declares a language the target country does not have is somebody else's document.
  const htmlDili = /<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i.exec(metin)
  if (htmlDili && !(TUM_ULKELER[secenek.hedefUlke].paket.diller as readonly string[]).includes(htmlDili[1])) {
    const sahibi = ULKE_KODLARI.find((u) => u !== secenek.hedefUlke && (TUM_ULKELER[u].paket.diller as readonly string[]).includes(htmlDili[1]))
    bulgular.push({ ulke: sahibi ?? secenek.hedefUlke, tur: 'terim', terim: `<html lang="${htmlDili[1]}">`, baglam: htmlDili[0], kaynak: secenek.kaynak })
  }
  for (const ulke of ULKE_KODLARI) {
    if (ulke === secenek.hedefUlke) continue
    const kayit = TUM_ULKELER[ulke]
    for (const t of kayit.sizintiTerimleri) {
      const yerler = terimAra(metin, katli, t)
      // Folding can shift offsets by a character at most; the context is for the reader, not for slicing exactly.
      for (const i of yerler.slice(0, 3)) bulgular.push({ ulke, tur: 'terim', terim: t.terim, baglam: baglam(metin, i, t.terim.length), kaynak: secenek.kaynak })
    }
    const kendi = new Set([...TUM_ULKELER[secenek.hedefUlke].sizintiHarfleri])
    const gorulen = new Set<string>()
    for (let i = 0; i < metin.length; i++) {
      const h = metin[i]
      if (kayit.sizintiHarfleri.includes(h) && !kendi.has(h) && !gorulen.has(h)) {
        gorulen.add(h)
        bulgular.push({ ulke, tur: 'harf', terim: h, baglam: baglam(metin, i, 1), kaynak: secenek.kaynak })
      }
    }
  }
  return bulgular
}

/** Throws when anything of another country is in the text. The message lists every finding with its context. */
export function sizintiYok(metin: string, secenek: { hedefUlke: UlkeKodu; kaynak: string }): void {
  const b = sizintiTara(metin, secenek)
  if (!b.length) return
  const satirlar = b.map((x) => `  [${x.ulke}] ${x.tur === 'harf' ? 'letter' : 'term'} "${x.terim}" in ${x.kaynak}: …${x.baglam}…`)
  throw new Error(`${b.length} leak(s) of another country's content in ${secenek.hedefUlke} output:\n${satirlar.join('\n')}`)
}

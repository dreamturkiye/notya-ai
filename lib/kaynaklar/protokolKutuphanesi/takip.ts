/**
 * TR-PROTOKOL-KUTUPHANESI — monthly edition check, the PURE part (unit-tested): from what an official URL answered this month
 * and what it answered last time, decide what goes into the founder review queue. No I/O here; takipSunucu.ts fetches and
 * stores. Nothing is ever written into the registry from here — the queue is reviewed, then a commit updates belgeler.ts.
 *
 *   document URL  — bytes hash / ETag changed                       → 'icerik-degisti'
 *                   answered before, now 4xx/5xx / network error      → 'erisilemiyor' (once, on the transition)
 *   listing page  — a new PDF link whose file stem matches a document → 'yeni-surum-adayi' (with the document ids)
 *                   a new protocol / guideline link, no match         → 'yeni-belge-adayi'
 *                   a document's link disappeared from the listing    → 'listeden-kalkti'
 * The first observation of a URL is the baseline: stored, never flagged.
 */
import { createHash } from 'node:crypto'
import type { ProtokolBelgesi } from './tipler'
import type { TakipHedefi } from './index'

export type TakipBulguTuru = 'icerik-degisti' | 'erisilemiyor' | 'yeni-surum-adayi' | 'yeni-belge-adayi' | 'listeden-kalkti'

export type TakipKaydi = {
  url: string
  hash: string | null
  etag: string | null
  sonDegisiklik: string | null
  httpDurum: number | null
  /** Listing pages only: the normalised PDF / document links seen. */
  listeOgeleri: string[] | null
  kontrolAt: string
  degistiAt: string | null
}

export type TakipYaniti = {
  /** null = network error / timeout. */
  httpDurum: number | null
  etag: string | null
  sonDegisiklik: string | null
  icerikTuru: string | null
  govde: Uint8Array | null
}

export type TakipBulgusu = {
  tur: TakipBulguTuru
  url: string
  belgeIdleri: string[]
  ayrinti: Record<string, unknown>
  /** De-duplication key (unique in the queue). */
  imza: string
}

const basarili = (d: number | null) => d !== null && d >= 200 && d < 400

const ASCII: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u', İ: 'i' }
export const asciiKatla = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/[çğıöşüâîûİ]/g, (c) => ASCII[c] || c)

/** HTML → stable text for hashing: no scripts / styles / tags / session tokens / whitespace noise. */
export function htmlNormalize(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/__RequestVerificationToken\S*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const htmlMi = (tur: string | null, govde: Uint8Array) => /html/i.test(tur || '') || /^\s*<(!doctype|html)/i.test(new TextDecoder().decode(govde.slice(0, 200)))

export function icerikOzeti(govde: Uint8Array, icerikTuru: string | null): string {
  const h = createHash('sha256')
  if (htmlMi(icerikTuru, govde)) h.update(htmlNormalize(new TextDecoder().decode(govde)))
  else h.update(govde)
  return h.digest('hex')
}

/** Document links on a listing page: href values pointing at PDF / Eklenti files, normalised (lower-case, no query). */
export function listeOgeleri(html: string): string[] {
  const out = new Set<string>()
  for (const m of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    const href = m[1].trim()
    if (!/\.pdf(\?|#|$)|\/Eklenti\//i.test(href)) continue
    out.add(asciiKatla(decodeURIComponent(href.replace(/&amp;/g, '&')).split(/[?#]/)[0]))
  }
  return [...out].sort()
}

const KOK_GURULTU = /(pdf|revizyon|klinik|protokolu?|rehberi?|yayin|vers|final|kp|kr|son)/g

/** The letters of a file name that name the document ("migrenklinikprotokolurevizyon28082025pdf" → "migren"). */
export function dosyaKoku(url: string): string {
  const ad = asciiKatla(decodeURIComponent(url).split(/[?#]/)[0].split('/').pop() || '')
  return ad.replace(/\.[a-z0-9]+$/g, '').replace(/[^a-z]/g, '').replace(KOK_GURULTU, '')
}

export function kokEslesir(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true
  return Math.min(a.length, b.length) >= 5 && (a.startsWith(b) || b.startsWith(a))
}

/** "2026", "revizyon", "…25082025…" → the year / revision hints a file name carries (shown to the reviewer, never applied). */
export function surumIpucu(url: string): { yil: number | null; revizyon: boolean } {
  const ad = asciiKatla(decodeURIComponent(url).split('/').pop() || '')
  const yillar = [...ad.matchAll(/(?<!\d)(?:\d{4})?(20[1-4]\d)(?!\d)/g)].map((m) => Number(m[1]))
  return { yil: yillar.length ? Math.max(...yillar) : null, revizyon: /revizyon/.test(ad) }
}

function belgeEslestir(oge: string, belgeler: readonly ProtokolBelgesi[]): string[] {
  const kok = dosyaKoku(oge)
  return belgeler
    .filter((b) => b.durum !== 'yerine-yenisi-geldi')
    .filter((b) => [b.url, ...(b.takipUrl || [])].some((u) => u && kokEslesir(dosyaKoku(u), kok)))
    .map((b) => b.id)
}

/**
 * One URL, one month: the new stored record + what to flag. `onceki` null = first observation (baseline).
 */
export function takipKarsilastir(
  hedef: TakipHedefi,
  onceki: TakipKaydi | null,
  yanit: TakipYaniti,
  belgeler: readonly ProtokolBelgesi[],
  simdi: Date,
): { kayit: TakipKaydi; bulgular: TakipBulgusu[] } {
  const zaman = simdi.toISOString()
  const bulgular: TakipBulgusu[] = []
  if (!basarili(yanit.httpDurum) || !yanit.govde) {
    const kayit: TakipKaydi = { ...(onceki || { url: hedef.url, hash: null, etag: null, sonDegisiklik: null, listeOgeleri: null, degistiAt: null }), url: hedef.url, httpDurum: yanit.httpDurum, kontrolAt: zaman }
    if (!onceki || basarili(onceki.httpDurum)) {
      bulgular.push({ tur: 'erisilemiyor', url: hedef.url, belgeIdleri: hedef.belgeIdleri, ayrinti: { httpDurum: yanit.httpDurum, liste: hedef.listeId }, imza: `erisilemiyor:${hedef.url}:${zaman.slice(0, 10)}` })
    }
    return { kayit, bulgular }
  }

  const hash = icerikOzeti(yanit.govde, yanit.icerikTuru)
  const liste = hedef.listeId ? listeOgeleri(new TextDecoder().decode(yanit.govde)) : null
  const kayit: TakipKaydi = {
    url: hedef.url, hash, etag: yanit.etag, sonDegisiklik: yanit.sonDegisiklik, httpDurum: yanit.httpDurum,
    listeOgeleri: liste, kontrolAt: zaman, degistiAt: onceki?.degistiAt ?? null,
  }
  if (!onceki || !onceki.hash) return { kayit, bulgular }

  if (!hedef.listeId) {
    const etagFarkli = Boolean(onceki.etag && yanit.etag && onceki.etag !== yanit.etag)
    if (onceki.hash !== hash || (etagFarkli && onceki.hash !== hash)) {
      kayit.degistiAt = zaman
      bulgular.push({
        tur: 'icerik-degisti', url: hedef.url, belgeIdleri: hedef.belgeIdleri,
        ayrinti: { oncekiHash: onceki.hash, yeniHash: hash, oncekiSonDegisiklik: onceki.sonDegisiklik, yeniSonDegisiklik: yanit.sonDegisiklik },
        imza: `icerik-degisti:${hedef.url}:${hash}`,
      })
    }
    return { kayit, bulgular }
  }

  const eski = new Set(onceki.listeOgeleri || [])
  const yeni = new Set(liste || [])
  const isaretli = (o: string) => hedef.belgeIsaretleri.some((i) => o.includes(asciiKatla(i)))
  for (const o of yeni) {
    if (eski.has(o)) continue
    const eslesen = belgeEslestir(o, belgeler)
    if (eslesen.length) bulgular.push({ tur: 'yeni-surum-adayi', url: hedef.url, belgeIdleri: eslesen, ayrinti: { baglanti: o, ...surumIpucu(o) }, imza: `yeni-surum-adayi:${o}` })
    else if (isaretli(o)) bulgular.push({ tur: 'yeni-belge-adayi', url: hedef.url, belgeIdleri: [], ayrinti: { baglanti: o, ...surumIpucu(o) }, imza: `yeni-belge-adayi:${o}` })
  }
  for (const o of eski) {
    if (yeni.has(o)) continue
    const eslesen = belgeEslestir(o, belgeler)
    if (eslesen.length) bulgular.push({ tur: 'listeden-kalkti', url: hedef.url, belgeIdleri: eslesen, ayrinti: { baglanti: o }, imza: `listeden-kalkti:${o}:${zaman.slice(0, 7)}` })
  }
  if (bulgular.length) kayit.degistiAt = zaman
  return { kayit, bulgular }
}

/** Fısıltı line after a reviewed new edition: "Migren Klinik Protokolü — yeni sürümü yayımlandı" (no suffix guessing). */
export function duyuruBasligi(b: Pick<ProtokolBelgesi, 'baslik'>): string {
  const ad = b.baslik.replace(/\s*\((?:Revizyon|SB rehberi)[^)]*\)\s*$/, '').replace(/\s+\d{4}$/, '')
  return `${ad} — yeni sürümü yayımlandı`
}

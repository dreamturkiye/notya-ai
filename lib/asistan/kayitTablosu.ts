/**
 * NOTYA-AYSE-GERI-05 (Dr. Gökhan, 2026-10-01; audit §4.4–4.5, PR 5 / PR 6) — records on screen, from the record.
 *
 *   • Anthropometrics — kilo, boy, baş çevresi: from one exam, as a time-ordered series, across all exams. A TABLE
 *     on screen, one short spoken line.
 *   • Exam summaries — the last N, the first N, a year, or all exams: one dated block per exam with complaint,
 *     diagnosis and plan.
 *
 * Before: "Bütün muayenelerdeki kilo ölçümlerini sırayla göster" was answered by the quick card with ONE line (the
 * latest measurement — and for "baş çevresi ölçümleri" that line was a weight); "son üç muayenesini özetle" got the
 * whole-chart summary template, and on voice the older visits were not in the short chart at all.
 *
 * The rule of this module: ONLY STORED VALUES. Every number and every sentence comes from a chart event
 * (lib/doktor/dosyaOlaylari.ts — approved notes only, archived exams excluded, doctor-scoped at read time). Nothing
 * is computed, interpolated or judged here: no BMI, no percentile, no "normal". A measurement that an exam does not
 * have is written "kayıt yok"; a measurement no exam has is said so in words. Deterministic, no model, pure.
 *
 * Not this module: one fact ("kilosu kaç" → quick card), an evaluation ("büyümesi nasıl", "persentili" → the growth
 * evidence path, which does compute), one named exam ("6 aylık muayenesini özetle" → the visit-type matcher, #512).
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { trGun, type DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'
import { genitif } from '@/lib/asistan/konusmaBaglami'

export type OlcumTuru = 'kilo' | 'boy' | 'basCevresi'
export type Kapsam = { tip: 'tum' } | { tip: 'son'; adet: number } | { tip: 'ilk'; adet: number } | { tip: 'yil'; yil: number }
export type Ebeveyn = 'anne' | 'baba'
export type KayitIstegi =
  | { tur: 'olcum'; olcumler: OlcumTuru[]; kapsam: Kapsam; tekDeger: boolean }
  | { tur: 'muayene'; kapsam: Kapsam }
  /** NOTYA-KORPUS-KALAN-01 (Y-023): the mother's / father's height — a Hasta Bilgi Formu field, not a measurement of the patient. */
  | { tur: 'ebeveyn-boy'; kimler: Ebeveyn[] }

export interface KayitCevabi {
  /** Screen answer (markdown; tables are pipe tables). */
  ekran: string
  /** Spoken answer — short for a table, the summaries themselves for up to three exams. */
  konusma: string
}

const OLCUM: Record<OlcumTuru, { etiket: string; baslik: string; birim: string }> = {
  kilo: { etiket: 'kilo', baslik: 'Kilo (kg)', birim: 'kg' },
  boy: { etiket: 'boy', baslik: 'Boy (cm)', birim: 'cm' },
  basCevresi: { etiket: 'baş çevresi', baslik: 'Baş çevresi (cm)', birim: 'cm' },
}
const TUM_OLCUMLER: OlcumTuru[] = ['kilo', 'boy', 'basCevresi']
const YOK = 'kayıt yok'

const SAYI: Record<string, number> = { bir: 1, iki: 2, uc: 3, dort: 4, bes: 5, alti: 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10 }
const SAYI_ALT = `\\d{1,2}|${Object.keys(SAYI).join('|')}`
const sayiCoz = (s: string): number => (/^\d+$/.test(s) ? Number(s) : SAYI[s] ?? 0)
const MUAYENE = '(?:muayene|vizit|kontrol|ziyaret|gelis)'

/** An evaluation of growth — the evidence path (which computes percentiles) answers these. */
const DEGERLENDIRME = /persentil|egri|buyume(si)? (nasil|geri|normal)|kilo (aliyor|alimi|alamiyor|kaybi)|normal mi|geri mi|yeterli mi|dusuk mu|fazla mi|uzuyor mu|nasil gidiyor|yasina gore/
/** A list / series / table is asked for — not one fact. */
const LISTE = new RegExp(`\\b(tablo\\w*|liste\\w*|sirayla|sirasiyla|sira ile|tum\\w*|butun|hepsi\\w*|tek tek|zaman icinde|seyri\\w*|gecmis\\w*|olcumler\\w*|kilolar\\w*|boylar\\w*|degerler\\w*|goster\\w*|getir\\w*|dok|doker|cikar\\w*|neler|nelerdir|her ${MUAYENE}\\w*|${MUAYENE}ler\\w*)\\b`)

function kapsamBul(n: string): Exclude<Kapsam, { tip: 'tum' }> | null {
  const son = n.match(new RegExp(`\\bson (${SAYI_ALT}) ${MUAYENE}`))
  if (son && sayiCoz(son[1]) >= 1) return { tip: 'son', adet: sayiCoz(son[1]) }
  const ilk = n.match(new RegExp(`\\bilk (${SAYI_ALT}) ${MUAYENE}`))
  if (ilk && sayiCoz(ilk[1]) >= 1) return { tip: 'ilk', adet: sayiCoz(ilk[1]) }
  if (new RegExp(`\\b(son|en son|gecen|onceki) ${MUAYENE}(?!ler)`).test(n)) return { tip: 'son', adet: 1 }
  if (new RegExp(`\\bilk ${MUAYENE}(?!ler)`).test(n)) return { tip: 'ilk', adet: 1 }
  const yil = n.match(/\b(20\d{2})(?: ?(?:de|da|te|ta|deki|daki|teki|taki|yili\w*|senesi\w*))?\b/)
  if (yil) return { tip: 'yil', yil: Number(yil[1]) }
  return null
}

/** A table / series / every exam is asked for in so many words. */
const TABLO_SOZU = /\b(tablo\w*|liste\w*|sirayla|sirasiyla|sira ile|tum\w*|butun|hepsi\w*|tek tek|zaman icinde|seyri\w*|gecmis\w*)\b/

/**
 * "Annesinin boyu kaç", "baba boyu", "anne ve babasının boyları" — whose height is asked. Before, the single-value
 * matcher below saw only "boy … kaç" and answered with the CHILD's height ("son boy 110 cm").
 */
function ebeveynBoyuBul(n: string): Ebeveyn[] {
  const k = n.split(' ')
  const boy = k.findIndex((x) => /^boy(u|unu|un|lari|larini)?$/.test(x))
  if (boy < 0) return []
  // The parent is named right before the height: "annesinin boyu", "anne ve babasının boyları".
  const once = k.slice(Math.max(0, boy - 3), boy)
  const var_ = (re: RegExp) => once.some((x) => re.test(x))
  // Genitive ("annesinin boyu") or the compound ("anne boyu"); "annesi boyunu sordu" has the mother as its subject.
  return [
    ...(var_(/^(anne|annesinin|annenin|annemin)$/) ? ['anne' as const] : []),
    ...(var_(/^(baba|babasinin|babanin|babamin)$/) ? ['baba' as const] : []),
  ]
}

/** Null = not a record request this module answers. */
export function kayitIstegiBul(mesaj: string | null | undefined): KayitIstegi | null {
  const n = trAramaNormalize(mesaj).replace(/[?!.,;:'’]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!n) return null

  // ── a parent's height: the form field, never the patient's own measurement ──
  const kimler = ebeveynBoyuBul(n)
  if (kimler.length) return { tur: 'ebeveyn-boy', kimler }

  // ── anthropometrics ──
  const hepsi = /\bantropometri\w*|\bbuyume olcum\w*|\bvucut olcum\w*/.test(n)
  const olcumler: OlcumTuru[] = hepsi ? [...TUM_OLCUMLER] : []
  if (!hepsi) {
    if (/\b(kilo\w*|agirlig\w*|tarti\w*)\b/.test(n)) olcumler.push('kilo')
    if (/\bboy(u|unu|un|lari|larini)?\b/.test(n)) olcumler.push('boy')
    if (/\bbas cevre\w*/.test(n)) olcumler.push('basCevresi')
  }
  const genelOlcum = !olcumler.length && /\bolcum(ler)?(i|ini|leri|lerini)?\b/.test(n) && !/\b(ates|tansiyon|nabiz|spo2|saturasyon|seker|lab|tahlil)\w*/.test(n)
  // NOTYA-KORPUS-KALAN-01 (Y-021): "Son ölçümleri neler?" asks for the LAST measurements — every vital of the last
  // exam (ateş, tansiyon too). Since NOTYA-AYSE-GERI-05 any "ölçümleri" was taken here and answered with the
  // kilo / boy / baş çevresi table of every exam. Without a table word it is the visit-measurement query's question.
  if (genelOlcum && /\b(son|en son) olcum/.test(n) && !TABLO_SOZU.test(n)) return null
  if (genelOlcum) olcumler.push(...TUM_OLCUMLER)
  if (olcumler.length && !DEGERLENDIRME.test(n)) {
    const kapsam = kapsamBul(n)
    const liste = LISTE.test(n)
    // "Boyu kaç?", "baş çevresi ne?" — one value the quick card does not carry (it has the weight only).
    const tekDeger = !liste && !kapsam && !olcumler.includes('kilo') && /\b(kac|ne|nedir|kacti|neydi)\b/.test(n)
    // NOTYA-KORPUS-KALAN-01 (T-042, T-044): the single value is the LATEST RECORDED one, whichever exam holds it. It
    // used to be read from the last exam only: after an acute visit with a weight and nothing else, "boyu?" answered
    // "kayıtlı boy ölçümü yok (son muayene)" for a chart with a height one exam earlier.
    if (liste || kapsam || tekDeger) return { tur: 'olcum', olcumler, kapsam: kapsam ?? { tip: 'tum' }, tekDeger }
    return null
  }

  // ── exam summaries: several or all (one named exam stays with the visit-type matcher) ──
  if (new RegExp(`\\b${MUAYENE}`).test(n) && /\b(ozet\w*|anlat\w*|goster\w*|listele\w*|dok|doker|neler|sirala\w*|gecmis\w*|cikar\w*)\b/.test(n)) {
    const kapsam = kapsamBul(n)
    if (kapsam && (kapsam.tip === 'yil' || kapsam.adet >= 2)) return { tur: 'muayene', kapsam }
    const cogul = new RegExp(`\\b${MUAYENE}ler\\w*`).test(n)
    if (!kapsam && (cogul || /\b(tum\w*|butun|hepsi\w*|tek tek|sirayla|sirasiyla|her|gecmis\w*)\b/.test(n))) return { tur: 'muayene', kapsam: { tip: 'tum' } }
  }
  return null
}

/* ───────────────────────────── shared ───────────────────────────── */

interface Vizit { id: string; tarih: string; metin: string }

/** Approved exams, oldest first. */
function vizitler(olaylar: DosyaOlayi[]): Vizit[] {
  return olaylar
    .filter((o) => o.kaynak === 'not' && o.tur === 'vizit')
    .map((o) => ({ id: String(o.vizitId || o.kaynakId), tarih: o.tarih, metin: o.metin }))
    .sort((a, b) => a.tarih.localeCompare(b.tarih))
}

function kapsamUygula<T extends { tarih: string }>(liste: T[], k: Kapsam): T[] {
  if (k.tip === 'son') return liste.slice(-k.adet)
  if (k.tip === 'ilk') return liste.slice(0, k.adet)
  if (k.tip === 'yil') return liste.filter((v) => v.tarih.startsWith(String(k.yil)))
  return liste
}

function kapsamEtiketi(k: Kapsam, adet: number): string {
  if (k.tip === 'son') return adet === 1 ? 'son muayene' : `son ${adet} muayene`
  if (k.tip === 'ilk') return adet === 1 ? 'ilk muayene' : `ilk ${adet} muayene`
  if (k.tip === 'yil') return `${k.yil} yılı, ${adet} muayene`
  return `${adet} muayene`
}

const hucre = (s: string) => String(s || '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
const sayi = (d: number) => d.toLocaleString('tr-TR', { maximumFractionDigits: 2 })
const satir = (h: string[]) => `| ${h.join(' | ')} |`
const birlestir = (l: string[]) => (l.length <= 1 ? l.join('') : `${l.slice(0, -1).join(', ')} ve ${l[l.length - 1]}`)
const buyukBas = (s: string) => (s ? s[0].toLocaleUpperCase('tr-TR') + s.slice(1) : s)

/* ───────────────────────────── anthropometrics ───────────────────────────── */

const CIHAZ_TURU: [RegExp, OlcumTuru][] = [[/^(kilo|agirlik|weight|tarti)/, 'kilo'], [/^(boy|height)/, 'boy'], [/^(bas ?cevre|head)/, 'basCevresi']]

interface OlcumSatiri {
  tarih: string; kaynak: 'muayene' | 'cihaz'; deger: Partial<Record<OlcumTuru, number>>
  /** NOTYA-DANIS-OLCUM: read from the note TEXT (a labelled value), not from the vital fields — marked in the cell. */
  metinden?: OlcumTuru[]
}

function olcumSatirlari(olaylar: DosyaOlayi[], k: Kapsam): { satirlar: OlcumSatiri[]; muayeneSayisi: number; toplamMuayene: number } {
  const tum = vizitler(olaylar)
  const secili = kapsamUygula(tum, k)
  const idler = new Set(secili.map((v) => v.id))
  const deger = new Map<string, Partial<Record<OlcumTuru, number>>>()
  for (const o of olaylar) {
    if (o.kaynak !== 'olcum' || o.deger == null || !o.vizitId || !idler.has(String(o.vizitId))) continue
    if (o.tur !== 'kilo' && o.tur !== 'boy' && o.tur !== 'basCevresi') continue
    const d = deger.get(String(o.vizitId)) || {}
    d[o.tur] = o.deger
    deger.set(String(o.vizitId), d)
  }
  // NOTYA-DANIS-OLCUM: an exam whose weight / height / head circumference is written only in the note text
  // ("Kilo 9,8 kg") is not "kayıt yok" — the same labelled value the one-exam answer reads (dosyaSorgu/vizitOlcum).
  const metinden = new Map<string, OlcumTuru[]>()
  for (const o of olaylar) {
    if (o.kaynak !== 'not' || o.tur !== 'olcum-metin' || o.deger == null || !o.vizitId || !idler.has(String(o.vizitId))) continue
    const tur = o.anahtar
    if (tur !== 'kilo' && tur !== 'boy' && tur !== 'basCevresi') continue
    const d = deger.get(String(o.vizitId)) || {}
    if (d[tur] != null) continue
    d[tur] = o.deger
    deger.set(String(o.vizitId), d)
    metinden.set(String(o.vizitId), [...(metinden.get(String(o.vizitId)) || []), tur])
  }
  const satirlar: OlcumSatiri[] = secili.map((v) => ({ tarih: v.tarih, kaynak: 'muayene', deger: deger.get(v.id) || {}, metinden: metinden.get(v.id) }))
  // Device measurements (confirmed readings) belong to the series; a "son / ilk N muayene" request is about exams only.
  if (k.tip === 'tum' || k.tip === 'yil') {
    for (const o of olaylar) {
      if (o.kaynak !== 'cihaz' || o.deger == null) continue
      if (k.tip === 'yil' && !o.tarih.startsWith(String(k.yil))) continue
      const tur = CIHAZ_TURU.find(([re]) => re.test(trAramaNormalize(o.tur)))?.[1]
      if (tur) satirlar.push({ tarih: o.tarih, kaynak: 'cihaz', deger: { [tur]: o.deger } })
    }
  }
  satirlar.sort((a, b) => a.tarih.localeCompare(b.tarih) || (a.kaynak === b.kaynak ? 0 : a.kaynak === 'muayene' ? -1 : 1))
  return { satirlar, muayeneSayisi: secili.length, toplamMuayene: tum.length }
}

export function olcumCevabi(istek: Extract<KayitIstegi, { tur: 'olcum' }>, olaylar: DosyaOlayi[], hastaAdi: string): KayitCevabi {
  const ad = String(hastaAdi || '').trim() || 'Hasta'
  const { satirlar, muayeneSayisi, toplamMuayene } = olcumSatirlari(olaylar, istek.kapsam)
  const adlar = birlestir(istek.olcumler.map((t) => OLCUM[t].etiket))
  if (!toplamMuayene && !satirlar.length) {
    const yok = `${ad} için onaylı muayene kaydı yok Hocam; ${adlar} ölçümü de kayıtlı değil.`
    return { ekran: yok, konusma: yok }
  }
  const olan = istek.olcumler.filter((t) => satirlar.some((s) => s.deger[t] != null))
  const olmayan = istek.olcumler.filter((t) => !olan.includes(t))
  if (!olan.length) {
    const yok = `${ad} için kayıtlı ${adlar} ölçümü yok Hocam${istek.kapsam.tip === 'tum' ? '' : ` (${kapsamEtiketi(istek.kapsam, muayeneSayisi)})`}.`
    return { ekran: yok, konusma: yok }
  }
  // The latest stored value of each measurement that has one.
  const son = (t: OlcumTuru) => [...satirlar].reverse().find((s) => s.deger[t] != null)
  const sonCumle = olan.map((t) => { const s = son(t)!; return `son ${OLCUM[t].etiket} ${sayi(s.deger[t]!)} ${OLCUM[t].birim} (${trGun(s.tarih)})` })
  const eksikCumle = olmayan.length ? ` ${buyukBas(birlestir(olmayan.map((t) => OLCUM[t].etiket)))} için kayıtlı ölçüm yok.` : ''

  if (istek.tekDeger) {
    const cumle = `${ad} — ${birlestir(sonCumle)}.${eksikCumle}`
    return { ekran: cumle, konusma: cumle }
  }

  const cihazVar = satirlar.some((s) => s.kaynak === 'cihaz')
  const sutunlar = ['Tarih', ...(cihazVar ? ['Kaynak'] : []), ...istek.olcumler.map((t) => OLCUM[t].baslik)]
  const govde = satirlar.map((s) => [
    trGun(s.tarih),
    ...(cihazVar ? [s.kaynak === 'cihaz' ? 'cihaz ölçümü' : 'muayene'] : []),
    // A device row carries one measurement by nature; its other cells are not "missing", they are not applicable.
    ...istek.olcumler.map((t) => (s.deger[t] != null ? `${sayi(s.deger[t]!)}${s.metinden?.includes(t) ? ' (not metni)' : ''}` : s.kaynak === 'cihaz' ? '' : YOK)),
  ])
  const cihazSayisi = satirlar.filter((s) => s.kaynak === 'cihaz').length
  const kapsamNotu = `${kapsamEtiketi(istek.kapsam, muayeneSayisi)}${cihazSayisi ? `, ${cihazSayisi} cihaz ölçümü` : ''}${istek.kapsam.tip !== 'tum' && istek.kapsam.tip !== 'yil' && muayeneSayisi < toplamMuayene ? `; toplam ${toplamMuayene} muayene kayıtlı` : ''}`
  const ekran = [
    `**${ad} — ${adlar} ölçümleri** (${kapsamNotu})`,
    '',
    satir(sutunlar),
    satir(sutunlar.map(() => '---')),
    ...govde.map((h) => satir(h.map(hucre))),
    ...(olmayan.length ? ['', `${buyukBas(birlestir(olmayan.map((t) => OLCUM[t].etiket)))}: hiçbir kayıtta ölçüm yok.`] : []),
    '',
    'Yalnız dosyada kayıtlı değerler gösterilir; kayıtlı olmayan ölçüm "kayıt yok" olarak işaretlidir.',
  ].join('\n')
  const tek = istek.kapsam.tip === 'son' && istek.kapsam.adet === 1 || istek.kapsam.tip === 'ilk' && istek.kapsam.adet === 1
  const konusma = tek
    ? `${ad}, ${kapsamEtiketi(istek.kapsam, 1)} (${trGun(satirlar[0].tarih)}): ${birlestir(olan.map((t) => `${OLCUM[t].etiket} ${sayi(satirlar[0].deger[t]!)} ${OLCUM[t].birim}`))}.${eksikCumle}`
    : `${genitif(ad)} ${adlar} ölçümlerini tablo olarak ekrana getirdim Hocam; ${satirlar.length} kayıt var. ${buyukBas(sonCumle[0])}.${eksikCumle}`
  return { ekran, konusma }
}

/* ───────────────────────────── exam summaries ───────────────────────────── */

const BOLUM: [string, RegExp][] = [['Şikayet', /^Şikayet\/öykü:\s*/], ['Bulgu', /^Bulgu:\s*/], ['Değerlendirme', /^Değerlendirme:\s*/], ['Tanı', /^Tanı:\s*/], ['Plan', /^Plan:\s*/]]

/** The parts of a visit event's text (olaylariKur joins them with " | "). */
export function vizitBolumleri(metin: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const parca of String(metin || '').split(' | ')) {
    for (const [ad, re] of BOLUM) if (re.test(parca)) out[ad] = parca.replace(re, '').trim()
  }
  return out
}

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const sozTarih = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${Number(iso.slice(8, 10))} ${AYLAR[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}` : 'tarihsiz')
const nokta = (s: string) => (/[.!?…]$/.test(s) ? s : `${s}.`)

/** How many exam summaries are read aloud in full; beyond that the voice points at the screen. */
export const SESLI_MUAYENE_SINIRI = 3

export function muayeneCevabi(istek: Extract<KayitIstegi, { tur: 'muayene' }>, olaylar: DosyaOlayi[], hastaAdi: string): KayitCevabi {
  const ad = String(hastaAdi || '').trim() || 'Hasta'
  const tum = vizitler(olaylar)
  if (!tum.length) {
    const yok = `${ad} için onaylı muayene notu yok Hocam.`
    return { ekran: yok, konusma: yok }
  }
  const secili = kapsamUygula(tum, istek.kapsam)
  if (!secili.length) {
    const yok = `${ad} için ${istek.kapsam.tip === 'yil' ? `${istek.kapsam.yil} yılında ` : ''}onaylı muayene notu yok Hocam; dosyada ${trGun(tum[0].tarih)} – ${trGun(tum[tum.length - 1].tarih)} arasında ${tum.length} muayene kayıtlı.`
    return { ekran: yok, konusma: yok }
  }
  const istenen = istek.kapsam.tip === 'son' || istek.kapsam.tip === 'ilk' ? istek.kapsam.adet : null
  const azNotu = istenen && secili.length < istenen ? ` — dosyada yalnız ${secili.length} muayene kayıtlı` : ''
  const baslik = `**${ad} — ${kapsamEtiketi(istek.kapsam, secili.length)}**${azNotu}${secili.length < tum.length ? ` (toplam ${tum.length} onaylı muayene)` : ''}`
  const bloklar: string[] = []
  const sozler: string[] = []
  secili.forEach((v, i) => {
    const b = vizitBolumleri(v.metin)
    const icerik = Object.keys(b).length > 0
    bloklar.push([
      `**${i + 1}. ${trGun(v.tarih)}**`,
      ...(icerik
        ? [`- Şikayet: ${b['Şikayet'] || YOK}`, `- Tanı: ${b['Tanı'] || b['Değerlendirme'] || YOK}`, `- Plan: ${b['Plan'] || YOK}`]
        : ['- Not içeriği kayıtlı değil.']),
    ].join('\n'))
    sozler.push(icerik
      ? `${sozTarih(v.tarih)} muayenesi. Şikayet: ${nokta(b['Şikayet'] || YOK)} Tanı: ${nokta(b['Tanı'] || b['Değerlendirme'] || YOK)} Plan: ${nokta(b['Plan'] || YOK)}`
      : `${sozTarih(v.tarih)} muayenesi. Not içeriği kayıtlı değil.`)
  })
  const ekran = [baslik, '', bloklar.join('\n\n'), '', 'Özetler onaylı muayene notlarından alınmıştır; kayıtlı olmayan bölüm "kayıt yok" olarak işaretlidir.'].join('\n')
  const konusma = secili.length <= SESLI_MUAYENE_SINIRI
    ? `${ad}, ${kapsamEtiketi(istek.kapsam, secili.length)}. ${sozler.join(' ')}`
    : `${genitif(ad)} ${secili.length} muayenesinin özetini ekrana getirdim Hocam; ${sozTarih(secili[0].tarih)} ile ${sozTarih(secili[secili.length - 1].tarih)} arası. Sesli dinlemek isterseniz "bana anlat" deyin.`
  return { ekran, konusma }
}

/* ───────────────────────────── a parent's height (Hasta Bilgi Formu) ───────────────────────────── */

const EBEVEYN: Record<Ebeveyn, { olay: string; ad: string }> = { anne: { olay: 'anne-boy', ad: 'anne boyu' }, baba: { olay: 'baba-boy', ad: 'baba boyu' } }

/**
 * The value the form holds — the intake events of the chart index (lib/doktor/dosyaOlaylari.ts), the same
 * doctor-scoped read every other form field of the record answers uses. No model, nothing derived (no target
 * height). The sentence is said only when the doctor asks; a chart whose form has no such field says so.
 */
export function ebeveynBoyCevabi(istek: Extract<KayitIstegi, { tur: 'ebeveyn-boy' }>, olaylar: DosyaOlayi[], hastaAdi: string): KayitCevabi {
  const ad = String(hastaAdi || '').trim() || 'Hasta'
  const deger = (k: Ebeveyn) => olaylar.find((o) => o.kaynak === 'intake' && o.tur === EBEVEYN[k].olay && o.deger != null)?.deger ?? null
  const var_ = istek.kimler.filter((k) => deger(k) != null), yok = istek.kimler.filter((k) => deger(k) == null)
  const parcalar: string[] = []
  if (var_.length) parcalar.push(`${ad} — ${birlestir(var_.map((k) => `${EBEVEYN[k].ad} ${sayi(deger(k)!)} cm`))} (Hasta Bilgi Formu).`)
  if (yok.length) {
    const eksik = `${buyukBas(birlestir(yok.map((k) => EBEVEYN[k].ad)))} Hasta Bilgi Formu’nda kayıtlı değil${var_.length ? '.' : ' Hocam.'}`
    parcalar.push(var_.length ? eksik : `${ad} — ${eksik[0].toLocaleLowerCase('tr-TR')}${eksik.slice(1)}`)
  }
  const cumle = parcalar.join(' ')
  return { ekran: cumle, konusma: cumle }
}

export function kayitCevabi(istek: KayitIstegi, olaylar: DosyaOlayi[], hastaAdi: string): KayitCevabi {
  if (istek.tur === 'ebeveyn-boy') return ebeveynBoyCevabi(istek, olaylar, hastaAdi)
  return istek.tur === 'olcum' ? olcumCevabi(istek, olaylar, hastaAdi) : muayeneCevabi(istek, olaylar, hastaAdi)
}

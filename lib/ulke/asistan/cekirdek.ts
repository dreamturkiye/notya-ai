/**
 * NOTYA-ASISTAN-CEKIRDEK — a country assistant answers a chart question by calling Ayşe's engines.
 *
 * There is no second measurement engine and no second laboratory grouping. vizitOlcumKaniti decides which
 * visit and which recorded value. labSerileri decides which result is the latest. asiKaydi decides given
 * versus planned. This file only recognises the question in English and writes the answer in English.
 * A fix inside those three functions is a fix for every country that calls this door.
 *
 * Which vaccine is due next is not answered here: that is a country's calendar, and another country's
 * calendar is not applied.
 */
import type { DosyaHastasi, DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'
import { asiKaydi } from '@/lib/asistan/dosyaSorgu/asiKaydi'
import { labSerileri } from '@/lib/asistan/dosyaSorgu/labSerisi'
import { vizitOlcumKaniti, type OlcumAnahtari, type VizitOlcumKaniti, type VizitOlcumSorusu } from '@/lib/asistan/dosyaSorgu/vizitOlcum'

export type DosyaSorusu = { tur: 'asi' } | { tur: 'lab' } | { tur: 'olcum'; soru: VizitOlcumSorusu }

const DOZ = /\b(dose|doses|mg|ml|mcg|prescription|antibiotic)\b/i
const ASI = /\b(immunis\w*|immuniz\w*|vaccin\w*|shots?)\b/i
const LAB = /\b(labs?|laborator\w*|blood (test|results?|work)|test results?)\b/i
const KILO = /\b(kg|kgs|kilograms?|weight|weighed)\b/i
const BOY = /\b(height|cm tall|how tall)\b/i
const AY = /(?<!last\s)(?<!past\s)\b(\d{1,2})\s*-?\s*months?\b/i
const YAS = /(?<!last\s)(?<!past\s)\b(\d{1,2})\s*-?\s*years?\b/i
const SON = /\b(last|latest|most recent)\b/i
const ILK = /\bfirst\b/i

/** The English question, or null when it is not one of the chart questions. */
export function enDosyaSorusu(mesaj: string | null | undefined): DosyaSorusu | null {
  const n = String(mesaj ?? '').replace(/[?!.,;:]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!n || DOZ.test(n)) return null
  if (ASI.test(n)) return { tur: 'asi' }
  if (LAB.test(n)) return { tur: 'lab' }
  const olcumler: OlcumAnahtari[] = []
  if (KILO.test(n)) olcumler.push('kilo')
  if (BOY.test(n)) olcumler.push('boy')
  if (!olcumler.length) return null
  const ay = AY.exec(n)
  const yas = !ay && !/\byears?\s+ago\b/i.test(n) ? YAS.exec(n) : null
  const soru = (hedef: VizitOlcumSorusu['hedef']): VizitOlcumSorusu => ({ olcumler, genel: false, hedef, degerlendirme: false, kesin: true })
  if (ay) return { tur: 'olcum', soru: soru({ tip: 'vizit', yas: { sayi: Number(ay[1]), birim: 'ay' }, gruplar: [] }) }
  if (yas) return { tur: 'olcum', soru: soru({ tip: 'vizit', yas: { sayi: Number(yas[1]), birim: 'yas' }, gruplar: [] }) }
  if (ILK.test(n)) return { tur: 'olcum', soru: soru({ tip: 'ilk' }) }
  if (SON.test(n)) return { tur: 'olcum', soru: soru({ tip: 'son' }) }
  return null
}

/** The core writes "7,9 kg". An English sentence uses a decimal point. */
function ondalik(metin: string): string {
  return metin.replace(/(\d),(\d)/g, '$1.$2')
}

function olcumCevabi(k: VizitOlcumKaniti): string {
  const istenen = k.soru.olcumler
  if (k.durum === 'vizit-yok' || !k.vizitler.length) return 'There is no visit on the record at that age.'
  const satirlar = k.vizitler.flatMap((v) => v.kayitlar.filter((x) => istenen.includes(x.olcum)).map((x) => `${ondalik(x.metin)} on ${x.tarih}`))
  if (!satirlar.length) return 'That visit is on the record, and the measurement was not recorded at it. A medicine dose is not a weight.'
  return `Recorded at that visit: ${satirlar.join('; ')}.`
}

function asiCevabi(olaylar: DosyaOlayi[]): string {
  const k = asiKaydi(olaylar)
  if (!k.verilen.length && !k.plan.length) return 'There is no vaccine record on the chart.'
  const verilen = k.verilen.length ? k.verilen.map((o) => `${o.metin} (${o.tarih})`).join('; ') : 'none recorded as given'
  const plan = k.plan.length ? ` Not given, only planned or recommended: ${k.plan.map((o) => o.metin).join('; ')}.` : ''
  return `Vaccine record. Given: ${verilen}.${plan}`
}

function labCevabi(olaylar: DosyaOlayi[]): string {
  const seri = labSerileri(olaylar)
  if (!seri.length) return 'There is no laboratory result on the record.'
  const satir = seri.map((s) => {
    const son = s.olcumler[s.olcumler.length - 1]
    const deger = son.deger != null ? String(son.deger) : (son.metin.split(': ')[1] ?? son.metin)
    const ref = son.refAlt != null || son.refUst != null ? `; laboratory reference interval ${son.refAlt ?? '—'} to ${son.refUst ?? '—'} ${son.birim || ''}`.replace(/\s+$/, '') : ''
    return `${s.anahtar}: ${deger} ${son.birim || ''} (${son.tarih})${ref}`.replace(/\s+/g, ' ').trim()
  })
  return `Latest laboratory results: ${satir.join('; ')}.`
}

/**
 * The answer, from the shared engines, or null when the message is not a chart question.
 * The patient's name is not written: the caller adds it if a screen should show it.
 */
export function enDosyaCevabi(mesaj: string | null | undefined, olaylar: DosyaOlayi[], hasta: Pick<DosyaHastasi, 'dogumIso'>): string | null {
  const s = enDosyaSorusu(mesaj)
  if (!s) return null
  if (s.tur === 'asi') return asiCevabi(olaylar)
  if (s.tur === 'lab') return labCevabi(olaylar)
  return olcumCevabi(vizitOlcumKaniti(s.soru, olaylar, hasta))
}

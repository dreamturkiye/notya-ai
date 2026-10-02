/**
 * NOTYA-DANIS-OLCUM — a measurement written in note TEXT ("Kilo 9,8 kg, boy 75 cm", "TA 142/88 mmHg").
 *
 * Some visits carry their measurements only in the SOAP text, not in the Yaşamsal Bulgular fields. This reads
 * them — and only them: a value counts when it stands right after its own LABEL (kilo, ağırlık, boy, baş çevresi,
 * VKİ, tansiyon / TA, ateş, nabız, SpO₂). A bare number is never a measurement here: "1 mg/kg/gün", "kilo başına
 * 10 mg", "son ayda 1 kg almış", "boyunda 2 cm lenf nodu" and "ateş 3 gündür" yield nothing. Nothing is computed
 * or inferred; the quote that was read is returned with the value so the answer can show its source.
 */
import { cmCoz, kiloCoz, sayiCoz } from './olcumCoz'

export type MetinOlcumAnahtari = 'kilo' | 'boy' | 'basCevresi' | 'vki' | 'tansiyon' | 'ates' | 'nabiz' | 'spo2'

export interface MetinOlcumu {
  olcum: MetinOlcumAnahtari
  /** Canonical number (kg, cm, kg/m², °C, /dk, %); null for blood pressure. */
  deger: number | null
  /** "9,8 kg", "142/88 mmHg", "%97" — the value as it is shown. */
  metin: string
  /** The words that were read, from the note. */
  alinti: string
}

const trSayi = (n: number, b: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: b })

/** One display form for a measurement, whatever its source. */
export function olcumGosterimi(olcum: MetinOlcumAnahtari, deger: number | null | undefined, degerMetni?: string | null): string {
  if (olcum === 'tansiyon') return `${String(degerMetni || '').replace(/\s*mm\s*hg/i, '').replace(/\s+/g, '').trim()} mmHg`
  if (deger == null) return String(degerMetni || '').trim()
  if (olcum === 'kilo') return `${trSayi(deger, 3)} kg`
  if (olcum === 'boy' || olcum === 'basCevresi') return `${trSayi(deger, 1)} cm`
  if (olcum === 'vki') return `${trSayi(deger, 1)} kg/m²`
  if (olcum === 'ates') return `${trSayi(deger, 1)} °C`
  if (olcum === 'nabiz') return `${trSayi(deger, 0)}/dk`
  return `%${trSayi(deger, 0)}`
}

const HARF = 'a-zçğıöşü'
/** Label: not inside a longer word on either side ("boyun", "kilogram", "var" are not labels). */
const etiket = (secenekler: string) => `(?<![${HARF}0-9])(?:${secenekler})(?![${HARF}])`
/** Between the label and its number: a few characters of the same clause, no digit. */
const ARA = '[^\\d.;\\n]{0,14}?'
const SAYI = '(\\d{1,4}(?:[.,]\\d{1,3})?)'

const KALIPLAR: { olcum: MetinOlcumAnahtari; re: RegExp }[] = [
  { olcum: 'kilo', re: new RegExp(`${etiket('vücut ağırlığı|kilosu|kilo|ağırlığı|ağırlık|tartısı|tartı|va')}${ARA}${SAYI}\\s*(kg|kilogram|gram|gr|g)?(?![${HARF}/])`) },
  { olcum: 'boy', re: new RegExp(`${etiket('boyu|boy|uzunluğu|uzunluk')}${ARA}${SAYI}\\s*(cm|mm|m)?(?![${HARF}/])`) },
  { olcum: 'basCevresi', re: new RegExp(`${etiket('baş çevresi|bas cevresi|bç')}${ARA}${SAYI}\\s*(cm)?(?![${HARF}/])`) },
  { olcum: 'vki', re: new RegExp(`${etiket('vücut kitle indeksi|vücut kitle endeksi|vki|bki|bmi')}${ARA}${SAYI}`) },
  { olcum: 'tansiyon', re: new RegExp(`${etiket('arteriyel tansiyon|tansiyonu|tansiyon|kan basıncı|ta|kb')}${ARA}(\\d{2,3})\\s*/\\s*(\\d{2,3})`) },
  { olcum: 'ates', re: new RegExp(`${etiket('vücut sıcaklığı|vücut ısısı|ateşi|ateş')}${ARA}(\\d{2}(?:[.,]\\d)?)(?!\\d)`) },
  { olcum: 'nabiz', re: new RegExp(`${etiket('kalp hızı|nabız|nabiz|kta')}${ARA}(\\d{2,3})(?![\\d.,/]\\d)`) },
  { olcum: 'spo2', re: new RegExp(`${etiket('o2 satürasyonu|satürasyonu|satürasyon|spo2|spo₂|sat')}${ARA}(\\d{2,3})(?!\\d)`) },
]

/** The label is followed by a dose or a change, not by the measurement itself. */
const ARADA_OLMAZ = /başına|basina|alım|kayb|kayıp|artış|değişim|takib|takip/
const SONRA_OLMAZ = /^\s*(mg|ml|mcg|µg|iu|ünite|damla|doz|ölçek|gün|hafta|ay\b|yaş|kez|kere|saat|x\b|almış|aldı|vermiş|verdi|kaybetmiş|kaybetti|artmış|arttı|azalmış|azaldı|artış|kayıp)/

const ARALIK: Record<Exclude<MetinOlcumAnahtari, 'tansiyon'>, [number, number]> = {
  kilo: [0.3, 400], boy: [20, 250], basCevresi: [20, 70], vki: [8, 90], ates: [30, 45], nabiz: [20, 260], spo2: [40, 100],
}

/** Labelled measurements in a piece of note text — at most one per measurement (the first one written). */
export function metindenOlcumCikar(metin: string | null | undefined): MetinOlcumu[] {
  const ham = String(metin || '')
  if (!ham.trim()) return []
  // Turkish lower-casing keeps the string length, so match positions point into the original text.
  const k = ham.toLocaleLowerCase('tr-TR')
  const out: MetinOlcumu[] = []
  for (const { olcum, re } of KALIPLAR) {
    const g = new RegExp(re.source, 'g')
    for (let m = g.exec(k); m; m = g.exec(k)) {
      const tam = m[0]
      const sayiBasi = m.index + tam.search(/\d/)
      if (ARADA_OLMAZ.test(k.slice(m.index, sayiBasi)) || SONRA_OLMAZ.test(k.slice(m.index + tam.length))) continue
      const alinti = ham.slice(m.index, m.index + tam.length).replace(/\s+/g, ' ').trim()
      if (olcum === 'tansiyon') {
        const sis = Number(m[1]), dia = Number(m[2])
        if (sis < 50 || sis > 300 || dia < 20 || dia > 200 || dia >= sis) continue
        out.push({ olcum, deger: null, metin: olcumGosterimi(olcum, null, `${sis}/${dia}`), alinti })
        break
      }
      const birim = m[2] || ''
      const deger = olcum === 'kilo' ? kiloCoz(`${m[1]} ${birim}`) : olcum === 'boy' || olcum === 'basCevresi' ? cmCoz(`${m[1]} ${birim}`) : sayiCoz(m[1])
      const [alt, ust] = ARALIK[olcum]
      if (deger == null || deger < alt || deger > ust) continue
      out.push({ olcum, deger, metin: olcumGosterimi(olcum, deger), alinti })
      break
    }
  }
  return out
}

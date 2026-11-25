/**
 * HASTA-PORTALI-GUNLUK — the home-measurement catalog: patient-facing names, units, plausible input ranges (a typo
 * guard, not a clinical judgement), step sizes for the one-tap steppers, and the smart default context.
 */
import type { EvOlcum, GlukozBaglami, OlcumTipi } from './tipler'
import { trDakika } from './zaman'

export interface OlcumTanimi {
  tip: OlcumTipi
  ad: string
  kisaAd: string
  birim: string
  /** Accepted input range (outside = refused as a probable typo). */
  min: number
  max: number
  adim: number
  ondalik: number
  /** Second value (diastolic) for 'kb'. */
  ikinci?: { ad: string; min: number; max: number; adim: number }
  /** First-ever prefill when the patient has no reading yet. */
  ilkDeger: number
  ilkDeger2?: number
  /** Readings per day that count as "done" for the daily ring (branş config may override). */
  gunlukHedef: number
}

export const OLCUM_TANIMLARI: Record<OlcumTipi, OlcumTanimi> = {
  kb: { tip: 'kb', ad: 'Tansiyon', kisaAd: 'Tansiyon', birim: 'mmHg', min: 60, max: 260, adim: 1, ondalik: 0, ikinci: { ad: 'Küçük tansiyon', min: 30, max: 160, adim: 1 }, ilkDeger: 125, ilkDeger2: 80, gunlukHedef: 2 },
  glukoz: { tip: 'glukoz', ad: 'Kan şekeri', kisaAd: 'Şeker', birim: 'mg/dL', min: 20, max: 600, adim: 1, ondalik: 0, ilkDeger: 110, gunlukHedef: 2 },
  kilo: { tip: 'kilo', ad: 'Kilo', kisaAd: 'Kilo', birim: 'kg', min: 1, max: 350, adim: 0.1, ondalik: 1, ilkDeger: 75, gunlukHedef: 1 },
  nabiz: { tip: 'nabiz', ad: 'Nabız', kisaAd: 'Nabız', birim: '/dk', min: 25, max: 230, adim: 1, ondalik: 0, ilkDeger: 72, gunlukHedef: 1 },
  spo2: { tip: 'spo2', ad: 'Oksijen (SpO₂)', kisaAd: 'SpO₂', birim: '%', min: 50, max: 100, adim: 1, ondalik: 0, ilkDeger: 97, gunlukHedef: 1 },
  ates: { tip: 'ates', ad: 'Ateş', kisaAd: 'Ateş', birim: '°C', min: 33, max: 43, adim: 0.1, ondalik: 1, ilkDeger: 36.8, gunlukHedef: 1 },
  bel: { tip: 'bel', ad: 'Bel çevresi', kisaAd: 'Bel', birim: 'cm', min: 30, max: 250, adim: 0.5, ondalik: 1, ilkDeger: 90, gunlukHedef: 1 },
  su: { tip: 'su', ad: 'Su', kisaAd: 'Su', birim: 'bardak', min: 1, max: 6, adim: 1, ondalik: 0, ilkDeger: 1, gunlukHedef: 8 },
}

export const BAGLAM_ADI: Record<GlukozBaglami, string> = {
  aclik: 'Açlık',
  tokluk2: 'Tokluk 2. saat',
  yatmadan: 'Yatmadan önce',
  rastgele: 'Diğer',
}

/** Time-of-day default for glucose context (Türkiye time): morning açlık, after usual lunch / dinner tokluk 2. saat, late yatmadan. */
export function saateGoreBaglam(dakika: number): GlukozBaglami {
  if (dakika >= 5 * 60 && dakika < 10 * 60 + 30) return 'aclik'
  if (dakika >= 13 * 60 + 30 && dakika < 16 * 60 + 30) return 'tokluk2'
  if (dakika >= 20 * 60 && dakika < 22 * 60) return 'tokluk2'
  if (dakika >= 22 * 60 || dakika < 5 * 60) return 'yatmadan'
  return 'rastgele'
}

/**
 * Smart context pre-selection: the patient's own habit wins — the most frequent context among their past glucose
 * readings within ±90 minutes of the current time of day; otherwise the time-of-day default.
 */
export function onerilenBaglam(gecmis: Pick<EvOlcum, 'tip' | 'baglam' | 'olcumAt'>[], simdi: Date | string | number): GlukozBaglami {
  const d = trDakika(simdi)
  const sayac = new Map<GlukozBaglami, number>()
  for (const o of gecmis) {
    if (o.tip !== 'glukoz' || !o.baglam) continue
    const fark = Math.abs(trDakika(o.olcumAt) - d)
    if (Math.min(fark, 1440 - fark) > 90) continue
    sayac.set(o.baglam, (sayac.get(o.baglam) || 0) + 1)
  }
  let en: GlukozBaglami | null = null, n = 0
  for (const [b, c] of sayac) if (c > n || (c === n && en && b < en)) { en = b; n = c }
  return en && n >= 2 ? en : saateGoreBaglam(d)
}

/** Validate one reading from the patient. Returns the cleaned value or a Turkish error. */
export function olcumDogrula(ham: { tip?: unknown; deger?: unknown; deger2?: unknown; baglam?: unknown }): { ok: true; tip: OlcumTipi; deger: number; deger2: number | null; baglam: GlukozBaglami | null } | { ok: false; hata: string } {
  const tip = ham.tip as OlcumTipi
  const t = OLCUM_TANIMLARI[tip]
  if (!t) return { ok: false, hata: 'Ölçüm türü tanınmadı.' }
  const deger = Number(String(ham.deger ?? '').replace(',', '.'))
  if (!Number.isFinite(deger) || deger < t.min || deger > t.max) return { ok: false, hata: `${t.ad} değeri ${t.min}–${t.max} ${t.birim} arasında olmalı. Lütfen kontrol edin.` }
  let deger2: number | null = null
  if (t.ikinci) {
    deger2 = Number(String(ham.deger2 ?? '').replace(',', '.'))
    if (!Number.isFinite(deger2) || deger2 < t.ikinci.min || deger2 > t.ikinci.max) return { ok: false, hata: `${t.ikinci.ad} ${t.ikinci.min}–${t.ikinci.max} mmHg arasında olmalı.` }
    if (deger2 >= deger) return { ok: false, hata: 'Büyük tansiyon küçük tansiyondan yüksek olmalı. Değerleri yer değiştirmiş olabilir misiniz?' }
  }
  let baglam: GlukozBaglami | null = null
  if (tip === 'glukoz') {
    baglam = (['aclik', 'tokluk2', 'yatmadan', 'rastgele'] as const).includes(ham.baglam as GlukozBaglami) ? (ham.baglam as GlukozBaglami) : 'rastgele'
  }
  const yuvarla = (x: number) => Math.round(x * 10 ** t.ondalik) / 10 ** t.ondalik
  return { ok: true, tip, deger: yuvarla(deger), deger2: deger2 == null ? null : Math.round(deger2), baglam }
}

/** Display value: "128/82", "6,8", "36,9". */
export function degerMetni(o: Pick<EvOlcum, 'tip' | 'deger' | 'deger2'>): string {
  const t = OLCUM_TANIMLARI[o.tip]
  if (o.tip === 'kb') return `${Math.round(o.deger)}/${Math.round(o.deger2 ?? 0)}`
  return o.deger.toLocaleString('tr-TR', { maximumFractionDigits: t.ondalik, minimumFractionDigits: t.ondalik > 0 && !Number.isInteger(o.deger) ? 1 : 0 })
}

/** The metric key the rule engine and targets use: 'glukoz:tokluk2', 'kb', … */
export function metrikAnahtari(o: Pick<EvOlcum, 'tip' | 'baglam'>): string {
  return o.tip === 'glukoz' ? `glukoz:${o.baglam || 'rastgele'}` : o.tip
}

export function metrikEtiketi(anahtar: string): string {
  const [tip, baglam] = anahtar.split(':') as [OlcumTipi, GlukozBaglami | undefined]
  const t = OLCUM_TANIMLARI[tip]
  if (!t) return anahtar
  return baglam ? `${t.ad} · ${BAGLAM_ADI[baglam]}` : t.ad
}

/**
 * BRANS-PAKETI (diyetisyen) — measurement panel: BKİ, bel/boy oranı, bel çevresi riski, energy requirement and the safe
 * weekly loss rate. Decision support for the dietitian; never shown to the patient as a verdict.
 *
 * Sources (docs/kaynak/DIYETISYEN-PAKETI-ARASTIRMA.md):
 *  - TEMD Obezite Tanı ve Tedavi Kılavuzu 2024 (11. baskı, Kasım 2024): § 1.5 bel çevresi — Türkiye'de abdominal
 *    obezite eşiği kadın ≥ 90 cm, erkek ≥ 100 cm; § 6.1.1 haftada 0,5–1,0 kg kayıp, günlük 500–1000 kcal açık;
 *    protein enerjinin ~%12–15'i.
 *  - WHO BKİ sınıfları (TEMD 2024 § 1 aynı sınıfları kullanır).
 *  - Bel/boy oranı ≥ 0,5: Ashwell & Gibson (BMJ Open 2016) "keep your waist to less than half your height" — international
 *    support; TEMD 2024 does not set a WHtR cut-off (stated in the research note).
 *  - Mifflin–St Jeor (Am J Clin Nutr 1990;51:241-7): REE = 10·kg + 6,25·cm − 5·yaş + 5 (erkek) / −161 (kadın).
 *    Activity factors (PAL) are the dietitian's choice; the tool shows which one was used.
 * Lock: no diagnosis, no drug, no supplement dose (HEKIM_KILIT). The physician's diagnosis stays the reference.
 */
export const OLCUM_KILIT = 'Karar desteğidir. Tanı, ilaç ve takviye dozu yazılmaz; nihai plan diyetisyen ve hekim tanısınadır.'

export type Cinsiyet = 'kadin' | 'erkek'

export function bki(kiloKg: number, boyCm: number): number | null {
  if (!(kiloKg >= 25 && kiloKg <= 350) || !(boyCm >= 120 && boyCm <= 230)) return null
  return Math.round((kiloKg / (boyCm / 100) ** 2) * 10) / 10
}

export function bkiSinifi(b: number): string {
  if (b < 18.5) return 'Zayıf (< 18,5)'
  if (b < 25) return 'Normal (18,5–24,9)'
  if (b < 30) return 'Fazla kilolu (25–29,9)'
  if (b < 35) return 'Obez sınıf I (30–34,9)'
  if (b < 40) return 'Obez sınıf II (35–39,9)'
  return 'Obez sınıf III (≥ 40)'
}

/** Bel/boy oranı, 2 decimals; ≥ 0,5 = artmış kardiyometabolik risk işareti (uluslararası destek, TEMD eşiği değil). */
export function belBoyOrani(belCm: number, boyCm: number): { oran: number; risk: boolean } | null {
  if (!(belCm >= 40 && belCm <= 250) || !(boyCm >= 120 && boyCm <= 230)) return null
  const oran = Math.round((belCm / boyCm) * 100) / 100
  return { oran, risk: oran >= 0.5 }
}

/** TEMD 2024 § 1.5 — Türkiye eşiği: kadın ≥ 90 cm, erkek ≥ 100 cm. */
export const BEL_ESIGI: Record<Cinsiyet, number> = { kadin: 90, erkek: 100 }
export function belRiski(belCm: number, c: Cinsiyet): { esik: number; risk: boolean } | null {
  if (!(belCm >= 40 && belCm <= 250)) return null
  return { esik: BEL_ESIGI[c], risk: belCm >= BEL_ESIGI[c] }
}

export const AKTIVITE_KATSAYILARI = { hareketsiz: 1.2, hafif: 1.375, orta: 1.55, yuksek: 1.725 } as const
export type AktiviteDuzeyi = keyof typeof AKTIVITE_KATSAYILARI

/** Mifflin–St Jeor REE × activity factor. Returns the equation text so the screen can state it. */
export function enerjiGereksinimi(o: { kiloKg: number; boyCm: number; yas: number; cinsiyet: Cinsiyet; aktivite: AktiviteDuzeyi }): { ree: number; toplam: number; denklem: string } | null {
  if (!(o.kiloKg >= 25 && o.kiloKg <= 350) || !(o.boyCm >= 120 && o.boyCm <= 230) || !(o.yas >= 18 && o.yas <= 100)) return null
  const ree = Math.round(10 * o.kiloKg + 6.25 * o.boyCm - 5 * o.yas + (o.cinsiyet === 'erkek' ? 5 : -161))
  const k = AKTIVITE_KATSAYILARI[o.aktivite]
  return { ree, toplam: Math.round(ree * k), denklem: `Mifflin–St Jeor (1990): 10×kg + 6,25×cm − 5×yaş ${o.cinsiyet === 'erkek' ? '+ 5' : '− 161'} = ${ree} kcal; × ${k} (${o.aktivite})` }
}

/**
 * TEMD 2024 § 6.1.1 — safe weekly loss 0,5–1,0 kg via a 500–1000 kcal/day deficit. The target weight RANGE shown is the
 * BKİ 18,5–24,9 band for the height (a reference band, not a prescription); the dietitian sets the actual goal.
 */
export function guvenliKayip(o: { kiloKg: number; boyCm: number; toplamEnerji: number | null; ree?: number | null }): { haftalikKg: [number, number]; acikKcal: [number, number]; hedefAralikKg: [number, number]; altSinirUyarisi: string | null } | null {
  if (!(o.kiloKg >= 25 && o.kiloKg <= 350) || !(o.boyCm >= 120 && o.boyCm <= 230)) return null
  const m2 = (o.boyCm / 100) ** 2
  const hedefAralikKg: [number, number] = [Math.round(18.5 * m2 * 10) / 10, Math.round(24.9 * m2 * 10) / 10]
  // Not a cited floor: a plain consistency check — a 1000 kcal deficit that drops intake below the resting energy (REE)
  // is flagged for the dietitian's own review.
  const altSinirUyarisi = o.toplamEnerji != null && o.ree != null && o.toplamEnerji - 1000 < o.ree
    ? '1000 kcal açık, alımı dinlenme enerjisinin (REE) altına indirir — açığı diyetisyen gözden geçirir.'
    : null
  return { haftalikKg: [0.5, 1.0], acikKcal: [500, 1000], hedefAralikKg, altSinirUyarisi }
}

/** One-shot panel text for the tool screen. */
export function olcumPaneli(o: { kiloKg: number; boyCm: number; belCm: number | null; yas: number; cinsiyet: Cinsiyet; aktivite: AktiviteDuzeyi }): { satirlar: string[] } | { hata: string } {
  const b = bki(o.kiloKg, o.boyCm)
  if (b == null) return { hata: 'Kilo 25–350 kg, boy 120–230 cm aralığında olmalı.' }
  const e = enerjiGereksinimi(o)
  if (!e) return { hata: 'Yaş 18–100 aralığında olmalı (çocukta bu panel kullanılmaz).' }
  const satirlar = [`BKİ: ${b.toString().replace('.', ',')} kg/m² — ${bkiSinifi(b)}`]
  if (o.belCm != null) {
    const r = belRiski(o.belCm, o.cinsiyet)
    const w = belBoyOrani(o.belCm, o.boyCm)
    if (r) satirlar.push(`Bel çevresi: ${o.belCm} cm — Türkiye eşiği ${r.esik} cm (TEMD 2024): ${r.risk ? 'eşik ve üzeri' : 'eşik altı'}`)
    if (w) satirlar.push(`Bel/boy oranı: ${w.oran.toString().replace('.', ',')} — ${w.risk ? '0,5 ve üzeri' : '0,5 altı'}`)
  }
  satirlar.push(`Enerji: ${e.denklem} → ~${e.toplam} kcal/gün`)
  const g = guvenliKayip({ kiloKg: o.kiloKg, boyCm: o.boyCm, toplamEnerji: e.toplam, ree: e.ree })
  if (g) {
    satirlar.push(`Güvenli kayıp hızı: haftada 0,5–1,0 kg (günlük 500–1000 kcal açık, TEMD 2024 § 6.1.1)`)
    satirlar.push(`Boya göre BKİ 18,5–24,9 ağırlık bandı: ${g.hedefAralikKg[0]}–${g.hedefAralikKg[1]} kg (referans bant; hedefi diyetisyen belirler)`)
    if (g.altSinirUyarisi) satirlar.push(g.altSinirUyarisi)
  }
  satirlar.push(OLCUM_KILIT)
  return { satirlar }
}

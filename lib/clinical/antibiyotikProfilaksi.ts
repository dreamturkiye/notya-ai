/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — WEIGHT-BASED ANTIBIOTIC PROPHYLAXIS for caesarean birth and hysterectomy (and other
 * major gynaecological surgery). Obstetrics and gynaecology only. Pure, country-neutral: KEYS AND NUMBERS ONLY.
 *
 * THE KIT HOLDS NO DOSE. Every agent, amount, weight threshold and re-dosing rule is the COUNTRY'S (`ProfilaksiParametreleri`),
 * stated by the build with its national source beside it (Türkiye build, each country pack). A country whose national
 * guidance names no agent or dose (e.g. NICE in the United Kingdom: local formulary) states none: the tool then computes
 * nothing and says so (`ulusalDozYok`), and the clinician records the regimen of their own formulary.
 *
 * Verified parameter sets in this change (2026-11-05), each kept IN ITS OWN BUILD (countries/us, countries/au, countries/nz):
 *   US     ACOG Practice Bulletins 199 (2018, caesarean) and 195 (2018, gynaecological procedures), as applied in a US
 *          obstetric protocol read the same day: cefazolin 2 g, 3 g at 120 kg or more; azithromycin 500 mg added for a
 *          non-elective caesarean in labour or after rupture of membranes; severe beta-lactam allergy clindamycin 900 mg
 *          plus gentamicin 5 mg/kg; repeat dose after 4 hours or blood loss over 1500 mL.
 *   AU/NZ  RANZCOG statement C-Gen 17, Prophylactic antibiotics in obstetrics and gynaecology (current March 2021):
 *          caesarean cefazolin 2 g, 3 g over 120 kg, at least 30 minutes before; repeat dose if over 3 hours; severe
 *          penicillin allergy clindamycin 600 mg plus gentamicin 2 mg/kg; major gynaecological surgery cefazolin 2 g plus
 *          metronidazole 500 mg.
 */

export const PROFILAKSI_ISLEMLERI = ['sezaryen', 'histerektomi', 'buyuk_jinekolojik'] as const
export type ProfilaksiIslemi = (typeof PROFILAKSI_ISLEMLERI)[number]

/** The country's numbers. Every one optional: what is not stated is not computed. */
export type ProfilaksiParametreleri = {
  sefazolin_g?: number
  sefazolin_yuksek_g?: number
  /** At or above this weight the higher cefazolin amount (`kiloEsigiDahil` false = strictly above). */
  kilo_esigi_kg?: number
  kilo_esigi_dahil?: number // 1 = at or above, 0 = strictly above
  /** 1 = the higher amount is stated for caesarean birth only (RANZCOG C-Gen 17). */
  kilo_esigi_yalniz_sezaryen?: number
  /** Caesarean in labour / after rupture of membranes (non-elective): added. */
  azitromisin_mg?: number
  /** Severe beta-lactam allergy. */
  klindamisin_mg?: number
  gentamisin_mg_kg?: number
  /** Added for hysterectomy / major gynaecological surgery. */
  metronidazol_mg?: number
  tekrar_saat?: number
  tekrar_kan_ml?: number
}

export type ProfilaksiGirdisi = {
  islem: ProfilaksiIslemi
  kiloKg: number
  /** Non-elective caesarean in labour or after rupture of membranes. */
  eylemdeVeyaZarAcik?: boolean
  /** Severe (immediate / anaphylactic) beta-lactam allergy. */
  siddetliBetaLaktamAlerjisi?: boolean
  /** Hours since the first dose (optional): the repeat-dose rule is checked. */
  gecenSaat?: number | null
  /** Blood loss so far, mL (optional). */
  kanKaybiMl?: number | null
}

export type ProfilaksiDozu = { ilac: 'sefazolin' | 'azitromisin' | 'klindamisin' | 'gentamisin' | 'metronidazol'; miktar: number; birim: 'g' | 'mg' }
export type ProfilaksiSonucu = { tamam: boolean; dozlar: ProfilaksiDozu[]; uyarilar: string[]; ulusalDozYok: boolean }

const sayiMi = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

export function profilaksiHesapla(g: ProfilaksiGirdisi, p: ProfilaksiParametreleri): ProfilaksiSonucu {
  if (!sayiMi(g.kiloKg) || g.kiloKg <= 0 || g.kiloKg > 400 || !(PROFILAKSI_ISLEMLERI as readonly string[]).includes(g.islem)) {
    return { tamam: false, dozlar: [], uyarilar: [], ulusalDozYok: false }
  }
  const dozlar: ProfilaksiDozu[] = []
  const uyarilar: string[] = []
  const herhangi = Object.values(p).some(sayiMi)
  if (!herhangi) return { tamam: true, dozlar, uyarilar: ['ulusal_doz_yok'], ulusalDozYok: true }

  const jine = g.islem !== 'sezaryen'
  if (g.siddetliBetaLaktamAlerjisi) {
    if (sayiMi(p.klindamisin_mg)) dozlar.push({ ilac: 'klindamisin', miktar: p.klindamisin_mg, birim: 'mg' })
    if (sayiMi(p.gentamisin_mg_kg)) dozlar.push({ ilac: 'gentamisin', miktar: Math.round(p.gentamisin_mg_kg * g.kiloKg), birim: 'mg' })
    if (!sayiMi(p.klindamisin_mg) && !sayiMi(p.gentamisin_mg_kg)) uyarilar.push('alerji_rejimi_yok')
    else uyarilar.push('gentamisin_kilo_hekim')
  } else if (sayiMi(p.sefazolin_g)) {
    const esik = p.kilo_esigi_kg
    const yuksek = sayiMi(esik) && sayiMi(p.sefazolin_yuksek_g) && !(p.kilo_esigi_yalniz_sezaryen === 1 && jine) && (p.kilo_esigi_dahil === 0 ? g.kiloKg > esik : g.kiloKg >= esik)
    dozlar.push({ ilac: 'sefazolin', miktar: yuksek ? (p.sefazolin_yuksek_g as number) : p.sefazolin_g, birim: 'g' })
    if (yuksek) uyarilar.push('yuksek_kilo_dozu')
  }
  if (!g.siddetliBetaLaktamAlerjisi && jine && sayiMi(p.metronidazol_mg)) dozlar.push({ ilac: 'metronidazol', miktar: p.metronidazol_mg, birim: 'mg' })
  if (g.islem === 'sezaryen' && g.eylemdeVeyaZarAcik && sayiMi(p.azitromisin_mg)) dozlar.push({ ilac: 'azitromisin', miktar: p.azitromisin_mg, birim: 'mg' })

  if (sayiMi(p.tekrar_saat) && sayiMi(g.gecenSaat) && g.gecenSaat >= p.tekrar_saat) uyarilar.push('tekrar_doz_sure')
  if (sayiMi(p.tekrar_kan_ml) && sayiMi(g.kanKaybiMl) && g.kanKaybiMl > p.tekrar_kan_ml) uyarilar.push('tekrar_doz_kan')
  return { tamam: true, dozlar, uyarilar, ulusalDozYok: false }
}

export const PROFILAKSI_UYARILARI = ['ulusal_doz_yok', 'alerji_rejimi_yok', 'gentamisin_kilo_hekim', 'yuksek_kilo_dozu', 'tekrar_doz_sure', 'tekrar_doz_kan'] as const

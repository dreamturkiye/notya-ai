/**
 * NOTYA-DAH-WOW W3.2 — Antikoagülan kartı: warfarin INR serisi + TTR (Rosendaal), INR kontrol aralığı, DOAK sınıf/uygunluk
 * kontrolü (Cockcroft-Gault KrKl, yaş, kilo — "azaltılmış doz kriterleri" bayrağı; mg YOK, hekim dozu yazar),
 * HAS-BLED maddeleri KONTROL LİSTESİ (skor iddiası yok), etkileşim uyarıları. INR/izlem görevi ilacIzlem (W1.6) ile hizalı.
 */
import type { Dipnot } from './dahiliye'

export type Ajan = 'warfarin' | 'apiksaban' | 'rivaroksaban' | 'dabigatran' | 'edoksaban' | null
export function ajanBul(ilacMetinleri: string[]): Ajan {
  const m = ilacMetinleri.join(' ')
  return /warfarin|coumadin|kumadin/i.test(m) ? 'warfarin' : /apiksaban|eliquis/i.test(m) ? 'apiksaban' : /rivaroksaban|xarelto/i.test(m) ? 'rivaroksaban' : /dabigatran|pradaxa/i.test(m) ? 'dabigatran' : /edoksaban|lixiana/i.test(m) ? 'edoksaban' : null
}

/** Cockcroft-Gault (mL/dk); kadın ×0,85. */
export function crcl(yas: number, kiloKg: number, kreMgdl: number, kadin: boolean): number { return Math.round((((140 - yas) * kiloKg) / (72 * kreMgdl)) * (kadin ? 0.85 : 1)) }

/** Rosendaal doğrusal interpolasyon; ölçümler arası >56 gün aralıklar dışarıda bırakılır. */
export function ttr(seri: { deger: number; tarih: string }[], hedef: [number, number] = [2, 3]): { yuzde: number | null; gun: number } {
  const s = seri.slice().sort((a, b) => a.tarih.localeCompare(b.tarih))
  let toplam = 0, icinde = 0
  for (let i = 1; i < s.length; i++) {
    const gun = Math.round((Date.parse(s[i].tarih) - Date.parse(s[i - 1].tarih)) / 86400000)
    if (gun <= 0 || gun > 56) continue
    for (let d = 0; d < gun; d++) { const v = s[i - 1].deger + ((s[i].deger - s[i - 1].deger) * d) / gun; toplam++; if (v >= hedef[0] - 1e-9 && v <= hedef[1] + 1e-9) icinde++ }
  }
  return { yuzde: toplam ? Math.round((icinde / toplam) * 100) : null, gun: toplam }
}

export interface AkGirdi {
  ajan: Ajan; endikasyon: 'af' | 'vte' | 'mekanik_kapak' | 'diger' | null; hedefInr: [number, number] | null
  yas: number | null; kadin: boolean; kiloKg: number | null; kre: number | null; hb: number | null; plt: number | null
  inr: { deger: number; tarih: string }[]; ilacMetinleri: string[]; sbp: number | null
  hasBled: { karaciger?: boolean; inme?: boolean; kanama?: boolean; alkol?: boolean }; bugun: string
}
export interface AkSonuc { ajan: Ajan; ttr: number | null; sonInr: { deger: number; tarih: string } | null; sonrakiInr: string | null; krkl: number | null; uygunluk: string[]; kirmizi: string[]; uyarilar: string[]; hasBledMaddeleri: { madde: string; var: boolean | null; degistirilebilir: boolean }[]; plan: string[]; dipnotlar: Dipnot[] }

function gunEkle(t: string, g: number): string { const d = new Date(t + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + g); return d.toISOString().slice(0, 10) }

export function antikoagulanDegerlendir(g: AkGirdi): AkSonuc {
  const dip: Dipnot[] = [{ ref: 'HARRISON', not: 'Warfarin: hedef INR (çoğu endikasyonda 2–3; mekanik mitral kapakta daha yüksek, hekim), TTR ≥%70 iyi kontrol; DOAK: böbrek fonksiyonu (Cockcroft-Gault), yaş ve kiloya göre etiket doz kriterleri; mekanik kapakta DOAK kontrendike' }]
  const r: AkSonuc = { ajan: g.ajan, ttr: null, sonInr: null, sonrakiInr: null, krkl: null, uygunluk: [], kirmizi: [], uyarilar: [], hasBledMaddeleri: [], plan: [], dipnotlar: dip }
  if (g.yas != null && g.kiloKg != null && g.kre != null && g.kre > 0) r.krkl = crcl(g.yas, g.kiloKg, g.kre, g.kadin)
  const t = (re: RegExp) => g.ilacMetinleri.some((x) => re.test(x))
  if (!g.ajan) r.plan.push('Aktif antikoagülan yok (hasta_ilaclar) — endikasyon varsa hekim ajan seçer')
  if (g.endikasyon === 'mekanik_kapak' && g.ajan && g.ajan !== 'warfarin') r.kirmizi.push('MEKANİK KAPAK + DOAK: kontrendike — warfarine geçiş değerlendirmesi acil (kardiyoloji)')

  if (g.ajan === 'warfarin') {
    const hedef = g.hedefInr || [2, 3]
    const seri = g.inr.slice().sort((a, b) => b.tarih.localeCompare(a.tarih))
    r.sonInr = seri[0] || null
    r.ttr = ttr(g.inr, hedef).yuzde
    if (r.sonInr) {
      const v = r.sonInr.deger
      const aralikta = v >= hedef[0] && v <= hedef[1]
      const stabil = aralikta && seri.slice(0, 3).length === 3 && seri.slice(0, 3).every((x) => x.deger >= hedef[0] && x.deger <= hedef[1])
      r.sonrakiInr = gunEkle(r.sonInr.tarih, stabil ? 28 : aralikta ? 14 : 7)
      if (v >= 9) r.kirmizi.push(`INR ${v} ≥9: kanama riski çok yüksek — aynı gün değerlendirme (acil)`)
      else if (v > 4.5) r.uyarilar.push(`INR ${v} >4,5: doz atlama/azaltma kararı hekim; kanama sorgula; 2–3 günde tekrar`)
      else if (!aralikta) r.uyarilar.push(`INR ${v} hedef (${hedef.join('–')}) dışı: hekim doz düzenler; 1 haftada tekrar`)
    } else r.plan.push('Onaylı INR satırı yok — INR iste')
    if (r.ttr != null && r.ttr < 60) r.uyarilar.push(`TTR %${r.ttr} <60: labil INR — uyum/etkileşim/diyet; DOAK uygunsa geçiş tartışılır (mekanik kapak değilse)`)
    if (t(/amiodaron|flukonazol|metronidazol|klaritromisin|trimetoprim|sulfametoksazol/)) r.uyarilar.push('Warfarin + INR yükselten ilaç (amiodaron/azol/metronidazol/makrolid/TMP-SMX): INR yakın izlem')
  } else if (g.ajan) {
    if (g.kre == null) r.uyarilar.push('Onaylı kreatinin yok — DOAK uygunluğu değerlendirilemez')
    const k = r.krkl
    if (k != null && k < 15) r.kirmizi.push(`KrKl ${k} <15 mL/dk: ${g.ajan} önerilmez — nefroloji/kardiyoloji`)
    if (g.ajan === 'dabigatran') { if (k != null && k < 30) r.kirmizi.push(`Dabigatran + KrKl ${k} <30: kontrendike`); else if ((k != null && k <= 50) || (g.yas != null && g.yas >= 80)) r.uygunluk.push('Dabigatran: azaltılmış doz kriterleri (KrKl 30–50 / ≥80 yaş / kanama riski) değerlendir — hekim dozu yazar') }
    if (g.ajan === 'rivaroksaban' && k != null && k >= 15 && k < 50) r.uygunluk.push(`Rivaroksaban: KrKl ${k} (15–49) → azaltılmış doz kriteri — hekim dozu yazar`)
    if (g.ajan === 'edoksaban') { if ((k != null && k >= 15 && k <= 50) || (g.kiloKg != null && g.kiloKg <= 60)) r.uygunluk.push('Edoksaban: KrKl 15–50 veya kilo ≤60 → azaltılmış doz kriteri — hekim dozu yazar'); if (k != null && k > 95 && g.endikasyon === 'af') r.uyarilar.push('Edoksaban + KrKl >95 (AF): etkinlik azalması bildirilmiştir — ajan seçimi hekim') }
    if (g.ajan === 'apiksaban') {
      const kriter = [g.yas != null && g.yas >= 80, g.kiloKg != null && g.kiloKg <= 60, g.kre != null && g.kre >= 1.5].filter(Boolean).length
      if (kriter >= 2) r.uygunluk.push(`Apiksaban: 3 kriterin ${kriter}'si (≥80 yaş, ≤60 kg, Kre ≥1,5) → azaltılmış doz kriteri — hekim dozu yazar`)
      else if (k != null && k >= 15 && k < 30) r.uygunluk.push(`Apiksaban: KrKl ${k} (15–29) → azaltılmış doz kriteri — hekim dozu yazar`)
      else r.uygunluk.push('Apiksaban: azaltılmış doz kriteri yok (≥2/3 değil)')
    }
    r.plan.push('DOAK izlem: yılda en az 1 (KrKl <60 veya ≥75 yaş: 6 ayda; KrKl <30: 3 ayda) Kre/eGFR + Hb')
  }
  if (g.hb != null && g.hb < 10) r.uyarilar.push(`Hb ${g.hb} <10 antikoagülan altında: gizli kanama araştır`)
  if (g.plt != null && g.plt < 100) r.uyarilar.push(`Trombosit ${g.plt} <100: kanama riski — hekim`)
  if (g.ajan && t(/asetilsalisilik|aspirin|klopidogrel|tikagrelor|prasugrel/)) r.uyarilar.push('Antikoagülan + antiplatelet: kanama riski — kombinasyon endikasyonu ve süresi hekim/kardiyoloji')
  if (g.ajan && t(/ibuprofen|naproksen|diklofenak|etodolak|meloksikam|selekoksib|deksketoprofen/)) r.uyarilar.push('Antikoagülan + NSAİİ: kaçın (GİS kanama)')
  r.hasBledMaddeleri = [
    { madde: 'Kontrolsüz hipertansiyon (SBP >160)', var: g.sbp == null ? null : g.sbp > 160, degistirilebilir: true },
    { madde: 'Böbrek fonksiyon bozukluğu (KrKl <30 / diyaliz)', var: r.krkl == null ? null : r.krkl < 30, degistirilebilir: false },
    { madde: 'Karaciğer hastalığı', var: g.hasBled.karaciger ?? null, degistirilebilir: false },
    { madde: 'İnme öyküsü', var: g.hasBled.inme ?? null, degistirilebilir: false },
    { madde: 'Kanama öyküsü / yatkınlık (anemi dahil)', var: g.hasBled.kanama ?? (g.hb != null ? g.hb < 10 : null), degistirilebilir: false },
    { madde: 'Labil INR (warfarinde TTR <%60)', var: g.ajan === 'warfarin' ? (r.ttr == null ? null : r.ttr < 60) : false, degistirilebilir: true },
    { madde: 'Yaşlı (>65)', var: g.yas == null ? null : g.yas > 65, degistirilebilir: false },
    { madde: 'Antiplatelet / NSAİİ kullanımı', var: t(/asetilsalisilik|aspirin|klopidogrel|tikagrelor|prasugrel|ibuprofen|naproksen|diklofenak|etodolak|meloksikam|selekoksib/), degistirilebilir: true },
    { madde: 'Alkol (haftada ≥8 kadeh)', var: g.hasBled.alkol ?? null, degistirilebilir: true },
  ]
  r.dipnotlar.push({ ref: 'TIHUD2023', not: 'HAS-BLED maddeleri kanama riskinin değiştirilebilir faktörlerini göstermek için kontrol listesi olarak kullanılır; antikoagülan kesme gerekçesi değildir' })
  return r
}

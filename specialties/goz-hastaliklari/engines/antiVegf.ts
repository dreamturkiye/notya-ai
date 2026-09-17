/**
 * GOZ-CHAPTER — İntravitreal enjeksiyon takvimi + SGK kapıları. Pure, deterministic.
 * Kaynak: SUT 4.2.33 "Göz hastalıklarında ilaç kullanım ilkeleri" (mevzuat.gov.tr birleştirilmiş metin,
 * RG-23/5/2026-33262 değişikliği dahil; 2026-09-17 okundu). Madde metni gömülmez — kendi sözcüklerimizle kural.
 * Motor planlar ve uyarır; enjeksiyon kararı, aralık (idame) ve doz hekimindir. Faricimab / brolucizumab SUT'ta geçmez.
 */
import type { Dipnot } from '../protocols/sources'
import { harfFarki } from './va'

export type Ajan = 'bevacizumab' | 'ranibizumab' | 'aflibersept_2mg' | 'aflibersept_8mg' | 'deksametazon_implant' | 'faricimab' | 'brolucizumab' | 'diger'
export type Endikasyon = 'ybmd' | 'dmo' | 'rvt' | 'miyopik_knv' | 'rop' | 'diger'
export interface Enjeksiyon { id?: string; goz: 'sag' | 'sol'; ajan: Ajan; endikasyon: Endikasyon; faz: 'yukleme' | 'idame'; dozNo: number | null; tarih: string; durum: 'planli' | 'yapildi' | 'iptal' }

export const AJAN_ADI: Record<Ajan, string> = {
  bevacizumab: 'Bevacizumab', ranibizumab: 'Ranibizumab', aflibersept_2mg: 'Aflibersept 2 mg', aflibersept_8mg: 'Aflibersept 8 mg',
  deksametazon_implant: 'Deksametazon implant', faricimab: 'Faricimab', brolucizumab: 'Brolucizumab', diger: 'Diğer',
}
export const ENDIKASYON_ADI: Record<Endikasyon, string> = {
  ybmd: 'Yaş tip YBMD', dmo: 'Diyabetik makula ödemi', rvt: 'Retinal ven tıkanıklığı', miyopik_knv: 'Patolojik miyopiye bağlı KNV', rop: 'ROP', diger: 'Diğer',
}

const D = (not: string): Dipnot => ({ ref: 'SUT_4233', not })
const gunEkle = (t: string, g: number) => { const d = new Date(`${t}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + g); return d.toISOString().slice(0, 10) }
const gunFarki = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000)
const ayEkle = (t: string, ay: number) => { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }

/** Yükleme dozu sayısı: 3 (4–6 hafta arayla). DMÖ'de aflibersept 2 mg ile 5 doz seçeneği (hekim seçer). Miyopik KNV'de bevacizumab yükleme şartı yok. */
export function yuklemeDozSayisi(ajan: Ajan, endikasyon: Endikasyon, dmoBesDoz = false): { doz: number | null; dipnot: Dipnot } {
  if (ajan === 'deksametazon_implant') return { doz: null, dipnot: D('İmplant için yükleme dozu tanımlı değil; yılda en fazla 4, aynı gözde en az 3 ay ara') }
  if (ajan === 'bevacizumab' && endikasyon === 'miyopik_knv') return { doz: null, dipnot: D('Patolojik miyopik KNV: bevacizumab yükleme dozu şartı aranmaz') }
  if (ajan === 'aflibersept_2mg' && endikasyon === 'dmo' && dmoBesDoz) return { doz: 5, dipnot: D('DMÖ: aflibersept 2 mg ile yükleme 5 doz olabilir (hekim seçimi)') }
  if (ajan === 'faricimab' || ajan === 'brolucizumab' || ajan === 'diger') return { doz: null, dipnot: D('Bu ajan SUT 4.2.33 metninde yer almıyor — SGK ödeme kuralı yok; şema hekimindir') }
  return { doz: 3, dipnot: D('Yükleme: 4–6 hafta arayla ardışık 3 doz; reçete/raporda kaçıncı doz yazılır') }
}

/** Yükleme takvimi taslağı: ilk dozdan itibaren 4–6 hafta pencereleri. Tarih seçimi hekimindir. */
export function yuklemeTakvimi(ilkTarih: string, ajan: Ajan, endikasyon: Endikasyon, dmoBesDoz = false): Array<{ dozNo: number; enErken: string; enGec: string }> {
  const { doz } = yuklemeDozSayisi(ajan, endikasyon, dmoBesDoz)
  if (!doz) return []
  const out = [{ dozNo: 1, enErken: ilkTarih, enGec: ilkTarih }]
  for (let i = 2; i <= doz; i++) { const onceki = out[i - 2].enErken; out.push({ dozNo: i, enErken: gunEkle(onceki, 28), enGec: gunEkle(out[i - 2].enGec, 42) }) }
  return out
}

export interface SgkKapiSonuc { odenebilir: boolean | null; uyarilar: string[]; engeller: string[]; dipnotlar: Dipnot[] }

/** SGK kapıları (ödeme kuralları — klinik kararı değil). `basamak`: uygulamanın yapılacağı yer. Muayenehane SGK basamağı değildir. */
export function sgkKapilari(g: { ajan: Ajan; goz: 'sag' | 'sol'; tarih: string; basamak: 'muayenehane' | '2' | '3'; gecmis: Enjeksiyon[]; son3AydaMiVeyaSvo?: boolean }): SgkKapiSonuc {
  const uyarilar: string[] = [], engeller: string[] = [], dipnotlar: Dipnot[] = []
  const yapilan = g.gecmis.filter((e) => e.durum === 'yapildi' && e.tarih <= g.tarih).sort((a, b) => (a.tarih < b.tarih ? 1 : -1))
  const ayniGoz = yapilan.filter((e) => e.goz === g.goz)

  if (g.ajan === 'faricimab' || g.ajan === 'brolucizumab' || g.ajan === 'diger') {
    engeller.push(`${AJAN_ADI[g.ajan]} SUT 4.2.33'te geçmiyor — SGK ödemesi yok (hasta bilgilendirilir).`)
    dipnotlar.push(D('4.2.33 ajan listesi: bevacizumab, ranibizumab, aflibersept, deksametazon implant, verteporfin'))
  }
  if (g.basamak === 'muayenehane') {
    uyarilar.push('Muayenehane uygulaması SGK basamağı değildir: SGK ödemesi için bevacizumab 2./3. basamakta, diğer ajanlar yalnız 3. basamakta uygulanır. Rapor taslağı hastanın ilgili basamağa başvurusu içindir.')
    dipnotlar.push(D('4.2.33(1): bevacizumab 2. veya 3. basamak; ranibizumab, aflibersept, deksametazon implant yalnız 3. basamak'))
  } else if (g.basamak === '2' && g.ajan !== 'bevacizumab') {
    engeller.push(`${AJAN_ADI[g.ajan]} 2. basamakta SGK'ca ödenmez (yalnız 3. basamak).`)
    dipnotlar.push(D('4.2.33(1)'))
  }
  // Aynı gözde aynı anda kombinasyon ödenmez: son 28 günde aynı gözde farklı ajan
  const farkliAjanYakin = ayniGoz.find((e) => e.ajan !== g.ajan && gunFarki(e.tarih, g.tarih) < 28)
  if (farkliAjanYakin && !(g.ajan === 'deksametazon_implant')) uyarilar.push(`Aynı gözde ${AJAN_ADI[farkliAjanYakin.ajan]} ${farkliAjanYakin.tarih} tarihinde yapılmış — aynı gözde eş zamanlı kombinasyon ödenmez (farklı göz kombinasyon sayılmaz).`)

  if (g.ajan === 'deksametazon_implant') {
    const sonAntiVegf = ayniGoz.find((e) => e.ajan !== 'deksametazon_implant')
    if (sonAntiVegf && gunFarki(sonAntiVegf.tarih, g.tarih) < 30) engeller.push(`İmplant anti-VEGF'ten en erken 1 ay sonra: son anti-VEGF ${sonAntiVegf.tarih}.`)
    const sonImplant = ayniGoz.find((e) => e.ajan === 'deksametazon_implant')
    if (sonImplant && g.tarih < ayEkle(sonImplant.tarih, 3)) engeller.push(`Aynı gözde iki implant arası en az 3 ay: son implant ${sonImplant.tarih}, en erken ${ayEkle(sonImplant.tarih, 3)}.`)
    const yil = yapilan.filter((e) => e.ajan === 'deksametazon_implant' && e.goz === g.goz && e.tarih > ayEkle(g.tarih, -12))
    if (yil.length >= 4) engeller.push(`Son 12 ayda bu gözde ${yil.length} implant — yılda en fazla 4.`)
    dipnotlar.push(D('4.2.33(10): implant anti-VEGF sonrası ≥1 ay; yılda ≤4; aynı gözde ≥3 ay ara'))
  }
  if (g.ajan === 'aflibersept_8mg') {
    const son8 = ayniGoz.find((e) => e.ajan === 'aflibersept_8mg' && e.faz === 'idame')
    if (son8 && g.tarih < ayEkle(son8.tarih, 3)) uyarilar.push(`Aflibersept 8 mg idame en erken 3 ayda bir: son idame ${son8.tarih}.`)
    dipnotlar.push(D('4.2.33(9): aflibersept 8 mg idame en erken 3 ay'))
  }
  // Ranibizumab ↔ aflibersept geçişi: önce bevacizumab ile yükleme
  const sonRanAfl = ayniGoz.find((e) => e.ajan === 'ranibizumab' || e.ajan === 'aflibersept_2mg' || e.ajan === 'aflibersept_8mg')
  const ranAflGecis = sonRanAfl && ((sonRanAfl.ajan === 'ranibizumab' && g.ajan.startsWith('aflibersept')) || (sonRanAfl.ajan.startsWith('aflibersept') && g.ajan === 'ranibizumab'))
  if (ranAflGecis) {
    const bevaSonra = ayniGoz.filter((e) => e.ajan === 'bevacizumab' && e.faz === 'yukleme' && e.tarih > sonRanAfl!.tarih).length
    if (bevaSonra < 3) engeller.push(`${AJAN_ADI[sonRanAfl!.ajan]} → ${AJAN_ADI[g.ajan]} geçişi: önce bevacizumab ile yükleme tamamlanmalı (bu gözde geçiş sonrası ${bevaSonra}/3).`)
    dipnotlar.push(D('4.2.33(7)-(8): ranibizumab ↔ aflibersept geçişinde önce bevacizumab yüklemesi'))
  }
  if (g.son3AydaMiVeyaSvo) {
    uyarilar.push('Son 3 ayda MI / serebrovasküler olay: anti-VEGF kontrendikasyonu gerekçesi kurul raporuna yazılır; bu durumda implant ödenir.')
    dipnotlar.push(D('4.2.33(12)-(13)'))
  }
  return { odenebilir: engeller.length ? false : g.basamak === 'muayenehane' ? null : true, uyarilar, engeller, dipnotlar }
}

export type YanitSinif = 'yeterli' | 'yetersiz' | 'belirsiz'
/**
 * SUT 4.2.33(3) yanıt kriterleri — birincil metinle satır satır doğrulandı (2026-09-17):
 *  yeterli: (1) görme keskinliğinde azalma yok veya ≥1 sıra (5 harf) kazanç, (2) OKT merkezi fovea kalınlığı ≤250 µm — herhangi biri
 *  yetersiz: (1) görme keskinliğinde azalma veya ≥5 harf kayıp, (2) OKT MFK'da 50 µm azalma olmaması — herhangi biri
 * (4): yüklemede İLK muayeneye, idamede BİR ÖNCEKİ muayeneye göre karşılaştırılır → `vaOnceki`/`mfkOncekiMikron` buna göre verilir.
 * İki yön aynı anda tutarsa sınıf 'belirsiz' — karar hekimin; (5) MFK ≥250 µm iken "yanıt veriyor" beyanı yalnız hekimin.
 */
export function sutYanit(g: { vaOnceki: string | null; vaSimdi: string | null; mfkOncekiMikron: number | null; mfkSimdiMikron: number | null }): { sinif: YanitSinif; harf: number | null; gerekce: string[]; dipnot: Dipnot } {
  const harf = harfFarki(g.vaOnceki, g.vaSimdi)
  const gerekce: string[] = []
  const vaYeterli = harf != null && harf >= 0 // görmede azalma yok veya kazanç
  const vaYetersiz = harf != null && harf < 0
  const mfkYeterli = g.mfkSimdiMikron != null && g.mfkSimdiMikron <= 250
  const mfkAzalma = g.mfkOncekiMikron != null && g.mfkSimdiMikron != null ? g.mfkOncekiMikron - g.mfkSimdiMikron : null
  const mfkYetersiz = mfkAzalma != null && mfkAzalma < 50
  if (harf != null) gerekce.push(`VA değişimi ${harf > 0 ? '+' : ''}${harf} harf`)
  if (g.mfkSimdiMikron != null) gerekce.push(`MFK ${g.mfkSimdiMikron} µm${mfkAzalma != null ? ` (Δ ${mfkAzalma > 0 ? '−' : '+'}${Math.abs(mfkAzalma)} µm)` : ''}`)
  const dipnot = D('4.2.33(3): yeterli = VA azalma yok / ≥5 harf kazanç veya MFK ≤250 µm; yetersiz = ≥5 harf kayıp veya MFK\'da 50 µm azalma yok')
  if (vaYetersiz || mfkYetersiz) {
    if (vaYeterli || mfkYeterli) return { sinif: 'belirsiz', harf, gerekce: [...gerekce, 'Kriterler çelişiyor — hekim değerlendirir'], dipnot }
    return { sinif: 'yetersiz', harf, gerekce, dipnot }
  }
  if (vaYeterli || mfkYeterli) return { sinif: 'yeterli', harf, gerekce, dipnot }
  return { sinif: 'belirsiz', harf, gerekce: [...gerekce, 'VA veya OKT verisi eksik'], dipnot }
}

/** Göz başına sıradaki doz: yükleme sayacı + son yapılan. İdame aralığını hekim belirler (motor tarih önermez). */
export function sonrakiDoz(gecmis: Enjeksiyon[], goz: 'sag' | 'sol', bugun: string): { faz: 'yukleme' | 'idame' | null; dozNo: number | null; enErken: string | null; enGec: string | null; not: string } {
  const g = gecmis.filter((e) => e.goz === goz && e.durum === 'yapildi' && e.ajan !== 'deksametazon_implant').sort((a, b) => (a.tarih < b.tarih ? 1 : -1))
  const son = g[0]
  if (!son) return { faz: null, dozNo: null, enErken: null, enGec: null, not: 'Bu gözde yapılmış anti-VEGF yok.' }
  const { doz } = yuklemeDozSayisi(son.ajan, son.endikasyon)
  const yuklemeYapilan = g.filter((e) => e.ajan === son.ajan && e.faz === 'yukleme').length
  if (doz && son.faz === 'yukleme' && yuklemeYapilan < doz) {
    const enErken = gunEkle(son.tarih, 28), enGec = gunEkle(son.tarih, 42)
    return { faz: 'yukleme', dozNo: yuklemeYapilan + 1, enErken, enGec, not: `${AJAN_ADI[son.ajan]} yükleme ${yuklemeYapilan + 1}/${doz}${bugun > enGec ? ' — pencere geçti' : ''}` }
  }
  return { faz: 'idame', dozNo: null, enErken: null, enGec: null, not: 'Yükleme tamam — idame aralığını hekim belirler (her idame raporunda yanıt yazılır).' }
}

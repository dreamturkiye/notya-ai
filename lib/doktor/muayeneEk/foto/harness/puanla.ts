/**
 * FOTO-AI-01 — evaluation harness: the scorer. Pure; the same function scores scripted answers (tests) and real ones.
 *
 * Metrics (all are counts first, ratios second, and a ratio with an empty denominator is `null`, never a flattering 1.0):
 *   - schema validity   : cases where a strictly valid answer was obtained (after at most one repair) / all cases
 *   - region agreement  : predicted region == reference region (null reference = "cannot be identified" -> predicted null)
 *   - red flags         : per (case, code) pair, positive = var | olasi.  recall = TP/(TP+FN)  precision = TP/(TP+FP).
 *                         A MISSED flag (FN) is listed by case id: that is the dangerous error.
 *   - abstain           : reference "degerlendirilebilir:false" means the right behaviour is to abstain.
 *                         dogruAbstain / gereksizAbstain (abstained when it could have answered) / kacirilanAbstain
 *                         (answered when it should have abstained: the dangerous one).
 *   - quality           : agreement of the model's overall quality grade with the reference grade.
 */
import { bayrakKodlari, type FotoDegerlendirme } from '../sema'
import type { Olgu } from './olgu'

export interface OlguSonucu {
  olgu: Olgu
  durum: 'tamam' | 'hata'
  deger?: FotoDegerlendirme
  hatalar?: string[]
  onarimDenendi?: boolean
}

export interface Oran { pay: number; payda: number; oran: number | null }
const oranla = (pay: number, payda: number): Oran => ({ pay, payda, oran: payda > 0 ? pay / payda : null })

export interface BayrakKodSkoru { kod: string; tp: number; fp: number; fn: number; tn: number }

export interface Puan {
  olguSayisi: number
  semaGecerliligi: Oran
  onarimGerekenOlgu: number
  bolgeUyumu: Oran
  bayrakDuyarlilik: Oran
  bayrakOzgulluk: Oran
  /** precision of the positive calls */
  bayrakKesinlik: Oran
  kacirilanBayrak: { olguId: string; kod: string }[]
  yanlisAlarm: { olguId: string; kod: string }[]
  bayrakKodlari: BayrakKodSkoru[]
  abstain: { dogruAbstain: number; gereksizAbstain: number; kacirilanAbstain: number; dogruDegerlendirme: number; dogruluk: Oran; kacirilanOlgular: string[] }
  kalite: Oran
  /** every case that has no usable reference for a metric is simply not counted there; this lists how many cases fed each metric */
  katki: { bolge: number; bayrak: number; abstain: number; kalite: number }
}

const pozitif = (d: string) => d === 'var' || d === 'olasi'

export function puanla(sonuclar: readonly OlguSonucu[]): Puan {
  const tamam = sonuclar.filter((s) => s.durum === 'tamam' && s.deger)
  let bolgeDogru = 0, bolgeN = 0
  let tp = 0, fp = 0, fn = 0, tn = 0, bayrakN = 0
  const kacirilan: Puan['kacirilanBayrak'] = []
  const yanlis: Puan['yanlisAlarm'] = []
  const kodHaritasi = new Map<string, BayrakKodSkoru>()
  let dogruAbstain = 0, gereksiz = 0, kacirilanAb = 0, dogruDeg = 0, abstainN = 0
  const kacirilanOlgular: string[] = []
  let kaliteDogru = 0, kaliteN = 0

  for (const s of tamam) {
    const d = s.deger!
    const b = s.olgu.beklenen
    if ('bolge' in b) {
      bolgeN++
      if ((d.bolge.id ?? null) === (b.bolge ?? null)) bolgeDogru++
    }
    if (b.kirmiziBayrak) {
      bayrakN++
      const beklenenKodlar = new Set(b.kirmiziBayrak)
      for (const kod of bayrakKodlari(s.olgu.mod)) {
        const tahmin = pozitif(d.kirmiziBayraklar.find((x) => x.kod === kod)?.durum ?? 'degerlendirilemez')
        const gercek = beklenenKodlar.has(kod)
        const k = kodHaritasi.get(kod) ?? { kod, tp: 0, fp: 0, fn: 0, tn: 0 }
        if (tahmin && gercek) { tp++; k.tp++ }
        else if (tahmin && !gercek) { fp++; k.fp++; yanlis.push({ olguId: s.olgu.id, kod }) }
        else if (!tahmin && gercek) { fn++; k.fn++; kacirilan.push({ olguId: s.olgu.id, kod }) }
        else { tn++; k.tn++ }
        kodHaritasi.set(kod, k)
      }
    }
    if (typeof b.degerlendirilebilir === 'boolean') {
      abstainN++
      const abstainEtti = !d.degerlendirilebilir
      if (!b.degerlendirilebilir && abstainEtti) dogruAbstain++
      else if (b.degerlendirilebilir && abstainEtti) gereksiz++
      else if (!b.degerlendirilebilir && !abstainEtti) { kacirilanAb++; kacirilanOlgular.push(s.olgu.id) }
      else dogruDeg++
    }
    if (b.kalite) { kaliteN++; if (d.kalite.genel === b.kalite) kaliteDogru++ }
  }
  return {
    olguSayisi: sonuclar.length,
    semaGecerliligi: oranla(tamam.length, sonuclar.length),
    onarimGerekenOlgu: sonuclar.filter((s) => s.onarimDenendi).length,
    bolgeUyumu: oranla(bolgeDogru, bolgeN),
    bayrakDuyarlilik: oranla(tp, tp + fn),
    bayrakOzgulluk: oranla(tn, tn + fp),
    bayrakKesinlik: oranla(tp, tp + fp),
    kacirilanBayrak: kacirilan,
    yanlisAlarm: yanlis,
    bayrakKodlari: [...kodHaritasi.values()].sort((a, b) => a.kod.localeCompare(b.kod)),
    abstain: { dogruAbstain, gereksizAbstain: gereksiz, kacirilanAbstain: kacirilanAb, dogruDegerlendirme: dogruDeg, dogruluk: oranla(dogruAbstain + dogruDeg, abstainN), kacirilanOlgular },
    kalite: oranla(kaliteDogru, kaliteN),
    katki: { bolge: bolgeN, bayrak: bayrakN, abstain: abstainN, kalite: kaliteN },
  }
}

const yuzde = (o: Oran): string => (o.oran == null ? 'n/a (örnek yok)' : `%${(o.oran * 100).toFixed(1)} (${o.pay}/${o.payda})`)

export const RAPOR_UYARISI = 'BU RAPOR KLİNİK DOĞRULAMA DEĞİLDİR. Sayılar yalnızca verilen fixture kümesi için geçerlidir; küçük kümelerde oranlar kararsızdır. Gerçek klinik fotoğraflarla doğrulama (Dr. Gökhan) henüz yapılmamıştır.'

export function raporMetni(p: Puan, ad: string, secenekler: { sahte: boolean; surum: string }): string {
  const s: string[] = []
  s.push(`FOTO-AI değerlendirme raporu — küme: ${ad} — istem sürümü: ${secenekler.surum} — kaynak: ${secenekler.sahte ? 'SCRIPTED (sahte model, gerçek görüntü yok)' : 'canlı model'}`)
  s.push(RAPOR_UYARISI)
  s.push('')
  s.push(`Olgu sayısı           : ${p.olguSayisi}`)
  s.push(`Şema geçerliliği      : ${yuzde(p.semaGecerliligi)}   (onarım gereken: ${p.onarimGerekenOlgu})`)
  s.push(`Bölge uyumu           : ${yuzde(p.bolgeUyumu)}`)
  s.push(`Kırmızı bayrak        : duyarlılık ${yuzde(p.bayrakDuyarlilik)}  |  kesinlik ${yuzde(p.bayrakKesinlik)}  |  özgüllük ${yuzde(p.bayrakOzgulluk)}`)
  s.push(`Abstain doğruluğu     : ${yuzde(p.abstain.dogruluk)}  (doğru abstain ${p.abstain.dogruAbstain}, gereksiz abstain ${p.abstain.gereksizAbstain}, KAÇIRILAN abstain ${p.abstain.kacirilanAbstain})`)
  s.push(`Kalite derecesi uyumu : ${yuzde(p.kalite)}`)
  if (p.kacirilanBayrak.length) {
    s.push('')
    s.push('KAÇIRILAN KIRMIZI BAYRAKLAR (en tehlikeli hata türü):')
    for (const k of p.kacirilanBayrak) s.push(`  - ${k.olguId}: ${k.kod}`)
  }
  if (p.abstain.kacirilanOlgular.length) {
    s.push('')
    s.push('ABSTAIN ETMESİ GEREKİRKEN DEĞERLENDİRDİĞİ OLGULAR:')
    for (const id of p.abstain.kacirilanOlgular) s.push(`  - ${id}`)
  }
  if (p.yanlisAlarm.length) {
    s.push('')
    s.push('YANLIŞ ALARMLAR:')
    for (const k of p.yanlisAlarm) s.push(`  - ${k.olguId}: ${k.kod}`)
  }
  if (p.bayrakKodlari.length) {
    s.push('')
    s.push('Kod bazında (TP/FP/FN/TN):')
    for (const k of p.bayrakKodlari) s.push(`  ${k.kod.padEnd(28)} ${k.tp}/${k.fp}/${k.fn}/${k.tn}`)
  }
  return s.join('\n')
}

/**
 * FOTO-AI-01 — deterministic calibration of a validated model answer. Pure; runs on every fresh AND cached evaluation.
 *
 * The model proposes, these rules dispose. Nothing here adds clinical content; it can only take things away or
 * downgrade confidence, and it turns "I cannot tell" into an explicit abstain:
 *   1. poor image quality, or a region that cannot be identified  -> ABSTAIN (no morphology, no differentials), with a
 *      "çekimi yenileyin" suggestion; red flags stay visible (a false negative costs more than a false alarm) but
 *      "var" is capped at "olası";
 *   2. no scale reference in the frame -> every size statement (mm / cm) is removed, never estimated;
 *   3. one photograph never earns "yüksek" confidence for a differential consideration (cap: orta); a medium-quality
 *      image caps observations at orta as well;
 *   4. a red flag needs a stated criterion; "var" without one becomes "olası"; ABCDE needs at least one named letter;
 *   5. definitive diagnostic wording ("kesin tanı", "tanısı konulmuştur") is cut;
 *   6. "veli" wording follows the patient's age (veliDiliMi): an adult never gets it;
 *   7. any red flag present -> the triage hint says "Doktor incelemesi gerekir".
 */
import { BAYRAK_ETIKETI, type FotoAyirici, type FotoDegerlendirme, type FotoGozlem, type Guven } from './sema'

export const KARAR_DESTEK_UYARISI = 'Karar destek aracıdır, tanı değildir.'
export const ABSTAIN_METNI = 'Bu görüntüden güvenle yorum yapılamıyor.'
export const YENIDEN_CEKIM_VARSAYILAN = 'Işığı artırın, netlemesini bekleyin, bölgeyi tam kadrajda ve yanında bir ölçek referansıyla (cetvel ya da madeni para) yeniden çekin.'

export interface KalibrasyonBaglami {
  /** veliDiliMi(): reşit olmayan hastada true; erişkinde false. */
  veliDili: boolean
}

export const OLCU_IFADESI = /\d+(?:[.,]\d+)?\s*(?:mm|cm|milimetre|santim|santimetre)\b/i
export const KESIN_TANI = /\bkesin(?:likle)?\s+tan[ıi]|tan[ıi]s[ıi]\s+(?:konul|kondu|budur)|te[şs]his\s+edil|\bkesindir\b|\bkesin\s+olarak\b/i
export const VELI = /\bveli(?:si|nin|ye|yi|ler|lerin|sine|ne)?\b/i

function cumleler(m: string): string[] {
  return m.split(/(?<=[.!?;])\s+|\n+/).map((c) => c.trim()).filter(Boolean)
}

/** Drops every sentence for which `at` is true; returns the rest joined and whether anything was dropped. */
export function cumleAt(m: string, at: (c: string) => boolean): { metin: string; atildi: boolean } {
  const tum = cumleler(m)
  const kalan = tum.filter((c) => !at(c))
  return { metin: kalan.join(' '), atildi: kalan.length !== tum.length }
}

const DUSUR: Record<Guven, Guven> = { yuksek: 'orta', orta: 'orta', dusuk: 'dusuk' }
const BIR_ASAGI: Record<Guven, Guven> = { yuksek: 'orta', orta: 'dusuk', dusuk: 'dusuk' }
export const birKademeDusur = (g: Guven): Guven => BIR_ASAGI[g]

export function kalibreEt(girdi: FotoDegerlendirme, b: KalibrasyonBaglami): FotoDegerlendirme {
  const d: FotoDegerlendirme = JSON.parse(JSON.stringify(girdi))
  const notlar: string[] = []

  // text hygiene on every free-text field
  let kesinKesildi = false
  const temizle = (m: string): string => {
    let s = m
    const a = cumleAt(s, (c) => KESIN_TANI.test(c)); s = a.metin; if (a.atildi) kesinKesildi = true
    if (!b.veliDili) s = cumleAt(s, (c) => VELI.test(c)).metin
    if (!d.kalite.olcekReferansi) s = cumleAt(s, (c) => OLCU_IFADESI.test(c)).metin
    return s
  }
  if (d.morfoloji) {
    const m = d.morfoloji
    m.renk = temizle(m.renk); m.sinir = temizle(m.sinir); m.yuzey = temizle(m.yuzey); m.dagilim = temizle(m.dagilim); m.sayi = temizle(m.sayi)
    m.boyut = d.kalite.olcekReferansi && m.boyut ? temizle(m.boyut) || null : null
  }
  d.gozlemler = d.gozlemler.map((g) => ({ ...g, metin: temizle(g.metin) })).filter((g) => g.metin)
  d.ayiricilar = d.ayiricilar.map((a) => ({ ...a, ad: temizle(a.ad), ayirtEdici: temizle(a.ayirtEdici) })).filter((a) => a.ad)
  d.kirmiziBayraklar = d.kirmiziBayraklar.map((f) => ({ ...f, kriter: temizle(f.kriter), not: temizle(f.not) }))
  d.sinirlar = d.sinirlar.map(temizle).filter(Boolean)
  if (d.oneri) d.oneri = temizle(d.oneri) || null
  if (d.abstain) d.abstain = { neden: temizle(d.abstain.neden) || ABSTAIN_METNI }
  if (kesinKesildi) notlar.push('Kesin tanı dili içeren ifade çıkarıldı; bu çıktı bir tanı değildir.')
  if (!d.kalite.olcekReferansi) notlar.push('Görüntüde ölçek referansı yok: boyut tahmini yapılmadı.')

  // 1. abstain
  const kalitesiz = d.kalite.genel === 'yetersiz'
  const bolgesiz = d.degerlendirilebilir && !d.kalite.bolgeBelirlenebilir
  if (kalitesiz || bolgesiz || !d.degerlendirilebilir) {
    d.degerlendirilebilir = false
    d.morfoloji = null
    d.gozlemler = []
    d.ayiricilar = []
    const neden = d.abstain?.neden || (kalitesiz ? 'Görüntü kalitesi değerlendirme için yetersiz.' : 'Görüntüdeki bölge belirlenemiyor.')
    d.abstain = { neden }
    if (!d.kalite.yenidenCekim) d.kalite.yenidenCekim = YENIDEN_CEKIM_VARSAYILAN
    d.kirmiziBayraklar = d.kirmiziBayraklar.map((f) => (f.durum === 'var' ? { ...f, durum: 'olasi' as const, not: f.not || 'Görüntü kalitesi düşük; kesin değil.' } : f))
  } else {
    d.abstain = null
    // 3. confidence caps
    d.ayiricilar = d.ayiricilar.map((a): FotoAyirici => ({ ...a, guven: DUSUR[a.guven], ayirtEdici: a.ayirtEdici || 'Ayırt etmek için klinik muayene gerekir.' }))
    if (d.kalite.genel === 'orta') {
      d.gozlemler = d.gozlemler.map((g): FotoGozlem => ({ ...g, guven: DUSUR[g.guven] }))
      d.bolge = { ...d.bolge, guven: DUSUR[d.bolge.guven] }
    }
  }
  if (d.kalite.genel === 'yetersiz' && !d.kalite.yenidenCekim) d.kalite.yenidenCekim = YENIDEN_CEKIM_VARSAYILAN

  // 4. red flags need criteria
  d.kirmiziBayraklar = d.kirmiziBayraklar.map((f) => {
    if (f.durum !== 'var' && f.durum !== 'olasi') return f
    let { durum, kriter } = f
    if (!kriter.trim()) {
      if (durum === 'var') durum = 'olasi'
      kriter = 'Ölçüt belirtilmedi — doktor incelemesi gerekir.'
    } else if (f.kod === 'pigmentli-lezyon-abcde' && !/\b[ABCDE]\b|asimetri|düzensiz|sınır|renk|çap|evrim|değişim/i.test(kriter)) {
      if (durum === 'var') durum = 'olasi'
    }
    if (f.kod === 'pigmentli-lezyon-abcde' && !d.kalite.olcekReferansi) kriter = kriter.replace(/\bD\b[^,;.]*[:=]?\s*(?:>|≥)?\s*\d+[^,;.]*/gi, 'D: ölçek referansı yok')
    return { ...f, durum, kriter }
  })

  // 7. triage hint
  const aktif = d.kirmiziBayraklar.filter((f) => f.durum === 'var' || f.durum === 'olasi')
  if (aktif.length) {
    const liste = aktif.map((f) => BAYRAK_ETIKETI[f.kod as keyof typeof BAYRAK_ETIKETI] ?? f.kod).join('; ')
    d.oneri = d.oneri && /doktor incelemesi gerekir/i.test(d.oneri) ? d.oneri : `Doktor incelemesi gerekir: ${liste}.`
  } else if (!d.degerlendirilebilir) {
    d.oneri = `${ABSTAIN_METNI} ${d.kalite.yenidenCekim ? 'Çekimi yenileyin.' : ''}`.trim()
  }

  d.sinirlar = [...new Set([...notlar, ...d.sinirlar])].slice(0, 8)
  return d
}

/** Quality-only answer (pre-save gate) in the same vocabulary: does it say "retake"? */
export function cekimiYenilemeli(k: FotoDegerlendirme['kalite']): boolean {
  return k.genel === 'yetersiz' || !k.bolgeBelirlenebilir
}

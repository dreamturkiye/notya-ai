/**
 * GOZ-CHAPTER — Diyabetik retinopati: tarama takvimi + evreye göre kontrol aralığı + dahiliye sevk döngüsü. Pure.
 * Evre YALNIZ hekim girişidir (fundus muayenesi / görüntü) — sohbetten veya nottan evre üretilmez.
 *
 * TR önce:
 *  - Tarama başlangıcı/sıklığı: TEMD DM Kılavuzu 2026 (17. baskı) §13.2.1 + §2.5.3 — birincil PDF okundu.
 *    T1: tanıdan 5 yıl sonra (≥10 yaş) yıllık; T2: tanıda, sonra yıllık; DR yok + iyi glisemik kontrol + ardışık 2 normal
 *    muayene → 1–2 yıl (hekim seçer); gebelik (önceden DM): ilk trimester + her trimester + doğum sonrası ≥1 yıl; GDM: gerekmez.
 *    T2 izlem: DR yok/minimal → yılda bir; ileri evre → 3–6 ayda bir (TEMD metni, evre tablosu yok).
 *  - Evre başına aralık (uluslararası sütun): ICO Guidelines for Diabetic Eye Care 2017, Tablo 3a (yüksek kaynaklı ortam) —
 *    birincil PDF okundu. TEMD ile farklıysa `catisma: true`, iki sütun gösterilir (KD dual-column deseni).
 *  - Çakışma (gebelik): TEMD "her trimester" ↔ ICO "ilk vizit + 28. hafta (DR varsa 16–20. hafta)" → TEMD uygulanır, ICO notu gösterilir.
 */
import type { Dipnot } from '../protocols/sources'

export type DrEvre = 'yok' | 'hafif_npdr' | 'orta_npdr' | 'agir_npdr' | 'pdr' | 'degerlendirilemedi'
export type Dmo = 'yok' | 'merkez_disi' | 'merkez_tutan'

export const EVRE_ADI: Record<DrEvre, string> = {
  yok: 'DR yok', hafif_npdr: 'Hafif NPDR', orta_npdr: 'Orta NPDR', agir_npdr: 'Ağır NPDR', pdr: 'PDR', degerlendirilemedi: 'Değerlendirilemedi',
}
export const DMO_ADI: Record<Dmo, string> = { yok: 'DMÖ yok', merkez_disi: 'Merkezi tutmayan DMÖ', merkez_tutan: 'Merkezi tutan DMÖ' }

/** ICO 2017 Tablo 3a — ay aralığı [alt, üst]; alt 0 = kaynak yalnız üst sınır veriyor ("<3 ay", "<1 ay"). */
export const ICO_ARALIK_AY: Record<Exclude<DrEvre, 'degerlendirilemedi'>, [number, number]> = {
  yok: [12, 24], hafif_npdr: [6, 12], orta_npdr: [3, 6], agir_npdr: [0, 3], pdr: [0, 1],
}
export const ICO_DMO_ARALIK_AY: Record<Exclude<Dmo, 'yok'>, [number, number]> = { merkez_disi: [3, 6], merkez_tutan: [1, 3] }

const SIRA: DrEvre[] = ['yok', 'hafif_npdr', 'orta_npdr', 'agir_npdr', 'pdr']
const DMO_SIRA: Dmo[] = ['yok', 'merkez_disi', 'merkez_tutan']
const ayEkle = (t: string, ay: number) => { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }

export interface DrGirdi {
  dmTip: 'T1' | 'T2' | 'diger' | null
  dmTaniTarihi: string | null
  yas: number | null
  gebe: boolean
  evreSag: DrEvre | null
  evreSol: DrEvre | null
  dmoSag: Dmo | null
  dmoSol: Dmo | null
  sonFundus: string | null
  /** hekim: ardışık 2 yıl DR yok + iyi glisemik kontrol (TEMD Öneri 4) */
  ikiNormalIyiKontrol?: boolean
  bugun: string
}

export interface Pencere { enErken: string; enGec: string; gerekce: string }
export interface DrSonuc {
  kotuEvre: DrEvre | null
  kotuDmo: Dmo | null
  /** kontrol pencereleri — TR (TEMD) ve uluslararası (ICO) ayrı sütun; çakışma birleştirilmez, hekim sonraki_kontrol ile kilitler */
  kontrol: { tr: Pencere; uluslararasi: Pencere; catisma: boolean; not: string } | null
  taramaGorevi: { kod: string; ad: string; due: string } | null
  sevkAciliyet: 'ayni_gun' | 'uzman' | null
  uyarilar: string[]
  dipnotlar: Dipnot[]
}

export function drDegerlendir(g: DrGirdi): DrSonuc {
  const uyarilar: string[] = [], dipnotlar: Dipnot[] = []
  const evreler = [g.evreSag, g.evreSol].filter((e): e is DrEvre => !!e && e !== 'degerlendirilemedi')
  const kotuEvre = evreler.length ? evreler.reduce((a, b) => (SIRA.indexOf(b) > SIRA.indexOf(a) ? b : a)) : null
  const dmolar = [g.dmoSag, g.dmoSol].filter((d): d is Dmo => !!d)
  const kotuDmo = dmolar.length ? dmolar.reduce((a, b) => (DMO_SIRA.indexOf(b) > DMO_SIRA.indexOf(a) ? b : a)) : null
  if (g.evreSag === 'degerlendirilemedi' || g.evreSol === 'degerlendirilemedi') uyarilar.push('En az bir gözde fundus değerlendirilemedi (ortam opasitesi / işbirliği) — tekrar veya ileri görüntüleme hekim kararı.')

  // Tarama (evre girilmemiş veya DR yok) — TEMD
  let taramaGorevi: DrSonuc['taramaGorevi'] = null
  if (g.dmTip === 'T1' && g.dmTaniTarihi) {
    const bas = ayEkle(g.dmTaniTarihi, 60)
    if (!g.sonFundus && g.bugun >= bas && (g.yas == null || g.yas >= 10)) taramaGorevi = { kod: 'dr_tarama', ad: 'Tip 1 DM: tanıdan 5 yıl geçti — yıllık retinopati taraması başlasın', due: g.bugun }
    else if (!g.sonFundus && g.bugun < bas) uyarilar.push(`Tip 1 DM: retinopati taraması tanıdan 5 yıl sonra başlar (${bas}); ergenlikte hekim erken başlatabilir.`)
    dipnotlar.push({ ref: 'TEMD_DM', not: 'T1DM: tanıdan 5 yıl sonra (≥10 yaş) yılda bir tarama' })
  }
  if (g.dmTip === 'T2' && !g.sonFundus) {
    taramaGorevi = { kod: 'dr_tarama', ad: 'Tip 2 DM: tanıda retinopati taraması (kayıt yok)', due: g.bugun }
    dipnotlar.push({ ref: 'TEMD_DM', not: 'T2DM: tanı anında tarama, sonra yıllık' })
  }
  if (g.gebe) {
    uyarilar.push('Gebelik (önceden DM): ilk trimesterde muayene, her trimesterde tekrar, doğum sonrası en az 1 yıl izlem (TEMD). ICO 2017 farklı takvim önerir (ilk vizit + 28. hafta; DR varsa 16–20. hafta) — TR kılavuzu uygulanır.')
    dipnotlar.push({ ref: 'TEMD_DM', not: 'Gebelik öncesi DM: her trimester + postpartum ≥1 yıl; GDM\'de göz muayenesi gerekmez' }, { ref: 'ICO_DR_2017', not: 'Gebelik takvimi farklı — ikincil' })
  }

  let kontrol: DrSonuc['kontrol'] = null
  let sevkAciliyet: DrSonuc['sevkAciliyet'] = null
  if (kotuEvre && g.sonFundus) {
    const pencere = (alt: number, ust: number, gerekce: string) => ({ enErken: ayEkle(g.sonFundus!, alt), enGec: ayEkle(g.sonFundus!, ust), gerekce })
    // Uluslararası (ICO 2017 Tablo 3a): evre ve DMÖ'nün daha sık olanı
    let [ia, iu] = ICO_ARALIK_AY[kotuEvre as Exclude<DrEvre, 'degerlendirilemedi'>]
    let igerekce = `${EVRE_ADI[kotuEvre]}: ICO 2017 ${fmtAy(ia)}–${fmtAy(iu)}`
    if (kotuDmo && kotuDmo !== 'yok') {
      const [da, du] = ICO_DMO_ARALIK_AY[kotuDmo]
      if (du < iu) { ia = Math.min(ia, da); iu = du; igerekce = `${DMO_ADI[kotuDmo]}: ICO 2017 ${fmtAy(da)}–${fmtAy(du)}` }
    }
    // TR (TEMD 2026 §13.2.1): DR yok / minimal → yılda bir (ardışık 2 normal + iyi kontrol → 1–2 yıl); ileri evre → 3–6 ay.
    // TEMD "minimal" ile "ileri evre"yi ICDR evresine eşlemez: hafif NPDR = minimal, orta+ veya DMÖ = ileri evre (eşleme hekim teyitli varsayım).
    const ileri = kotuEvre !== 'yok' && kotuEvre !== 'hafif_npdr' || (!!kotuDmo && kotuDmo !== 'yok')
    let tr = ileri ? pencere(3, 6, 'İleri evre: TEMD 2026 3–6 ayda bir') : g.ikiNormalIyiKontrol && kotuEvre === 'yok' ? pencere(12, 24, 'Ardışık 2 yıl DR yok + iyi glisemik kontrol: TEMD 1–2 yıl (hekim seçer)') : pencere(12, 12, `${kotuEvre === 'yok' ? 'DR yok' : 'Minimal DR'}: TEMD yılda bir`)
    let uluslararasi = pencere(ia, iu, igerekce)
    if (g.gebe) {
      tr = pencere(0, 3, 'Gebelik: TEMD her trimester + postpartum ≥1 yıl')
      uluslararasi = { ...uluslararasi, gerekce: `${uluslararasi.gerekce}; gebelikte ICO ilk vizit + 28. hafta` }
    }
    const catisma = tr.enGec !== uluslararasi.enGec
    kontrol = { tr, uluslararasi, catisma, not: catisma ? 'TEMD ve ICO aralıkları farklı — iki sütun gösterilir, birleştirilmez; hekim sonraki kontrolü kilitler.' : 'TEMD ve ICO uyumlu.' }
    dipnotlar.push({ ref: 'TEMD_DM', not: 'Tarama/izlem aralığı (TR taban): T2 minimal/yok yılda bir, ileri evre 3–6 ay' }, { ref: 'ICO_DR_2017', not: 'Evre başına kontrol aralığı (Tablo 3a, yüksek kaynaklı ortam) — uluslararası sütun' }, { ref: 'ICDR_2003', not: 'Evre adları' })
  }
  if (kotuEvre === 'pdr') { sevkAciliyet = 'ayni_gun'; uyarilar.push('PDR: <1 ay içinde değerlendirme/tedavi (ICO); vitreus/preretinal kanama veya rubeozis → aynı gün (TEMD Tablo 13.1).') }
  else if (kotuEvre === 'agir_npdr' || kotuDmo === 'merkez_tutan') sevkAciliyet = 'uzman'
  if (sevkAciliyet) dipnotlar.push({ ref: 'TEMD_DM', not: 'Tablo 13.1: ani görme kaybı, rubeozis, proliferatif bulgular → aynı gün göz; makülopati / ağır NPDR → göz uzmanı' })
  return { kotuEvre, kotuDmo, kontrol, taramaGorevi, sevkAciliyet, uyarilar, dipnotlar }
}

function fmtAy(ay: number): string { return ay === 0 ? '0' : ay >= 12 ? `${ay / 12} yıl` : `${ay} ay` }

/** Dahiliye → göz sevki kapanışı: dahiliye kartına dönecek özet (hastaya/dahiliyeciye tanı dili sade, evre hekimin girdiği). */
export function dahiliyeGeriBildirim(s: DrSonuc, fundusTarihi: string): string {
  const evre = s.kotuEvre ? EVRE_ADI[s.kotuEvre] : 'evre girilmedi'
  const dmo = s.kotuDmo ? `, ${DMO_ADI[s.kotuDmo]}` : ''
  return `Göz dibi muayenesi ${fundusTarihi}: ${evre}${dmo}.`
}

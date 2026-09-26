/**
 * DERM-CHAPTER — Yapılandırılmış izlem kartları: Behçet, büllü hastalıklar, BZBH izlemi, saç / tırnak.
 * Kutucuk listesinin ötesinde: tutulum alanları, aktivite maddeleri, gereken tetkik kapıları ve
 * "sıradaki adım" metni. Tanı, ilaç ve doz kararı hekimindir; burada hiçbir doz veya rejim yoktur.
 */
import type { Dipnot } from '../protocols/sources'
import type { BehcetCard, BullousWorkup } from '../schema'
import { saltBolgelerden, type SaltGirdisi } from './score-calculator'
import { TRIKOSKOPI_ALANLARI } from '../imaging/dermoscopy'
import { sarkCibaniFollowUpOverdue, type BzbhKind } from '../protocols/endemic-bzbh'

export type TakipKarti = {
  id: string
  baslik: string
  /** tutulum / bulgu satırları */
  bulgular: string[]
  /** eksik olan zorunlu adımlar */
  eksikler: string[]
  /** sıradaki adım — hekim onayına açık metin */
  sonrakiAdim: string[]
  aciliyet: 'rutin' | 'ivedi' | 'acil'
  dipnotlar: Dipnot[]
}

// ── Behçet ────────────────────────────────────────────────────────────────────

/** ISG (Uluslararası Çalışma Grubu) ölçüt başlıkları — tekrarlayan oral ülser zorunlu majör ölçüttür. */
export const BEHCET_TUTULUM_ALANLARI: Array<{ kod: string; ad: string; isg: boolean; ivedi?: boolean }> = [
  { kod: 'oral', ad: 'Tekrarlayan oral ülser (yılda ≥3)', isg: true },
  { kod: 'genital', ad: 'Genital ülser / skar', isg: true },
  { kod: 'goz', ad: 'Göz tutulumu (üveit / retinal vaskülit)', isg: true, ivedi: true },
  { kod: 'deri', ad: 'Deri lezyonu (papülopüstüler, eritema nodozum benzeri)', isg: true },
  { kod: 'paterji', ad: 'Paterji testi pozitif', isg: true },
  { kod: 'vaskuler', ad: 'Damar tutulumu (tromboflebit / arteriyel)', isg: false, ivedi: true },
  { kod: 'noro', ad: 'Nörolojik tutulum bulgusu', isg: false, ivedi: true },
  { kod: 'eklem', ad: 'Artrit / artralji', isg: false },
  { kod: 'gis', ad: 'Gastrointestinal bulgu', isg: false },
]

export type BehcetTakipGirdi = {
  kart: BehcetCard | null
  /** ISG dışı organ tutulumları */
  ek?: Record<string, boolean>
  /** son 4 haftada ülser sayısı (hekim / hasta beyanı) */
  oralUlserSayisi?: number | null
  hlaB51?: boolean | null
  /** son göz muayenesi tarihi */
  sonGozMuayenesi?: string | null
  bugun?: string
}

export function behcetTakip(g: BehcetTakipGirdi): TakipKarti {
  const k = g.kart
  const ek = g.ek || {}
  const isaretli = (kod: string): boolean => {
    if (!k) return !!ek[kod]
    if (kod === 'oral') return k.oral
    if (kod === 'genital') return k.genital
    if (kod === 'goz') return k.eye
    if (kod === 'paterji') return k.pathergy
    return !!ek[kod]
  }
  const bulgular = BEHCET_TUTULUM_ALANLARI.filter((a) => isaretli(a.kod)).map((a) => a.ad)
  if (g.oralUlserSayisi != null) bulgular.push(`Son 4 haftada oral ülser: ${g.oralUlserSayisi}`)
  if (g.hlaB51 != null) bulgular.push(`HLA-B51: ${g.hlaB51 ? 'pozitif' : 'negatif'} (tanı ölçütü değildir)`)

  const eksikler: string[] = []
  if (!isaretli('oral') && !k) eksikler.push('Oral ülser öyküsü (majör ölçüt) sorgulanmadı')
  if (!k?.pathergy && !ek.paterji) eksikler.push('Paterji testi (yapıldı / yapılmadı) kaydı')
  if (!g.sonGozMuayenesi) eksikler.push('Göz muayenesi tarihi — Behçet izleminde düzenli göz değerlendirmesi')

  const ivedi = BEHCET_TUTULUM_ALANLARI.some((a) => a.ivedi && isaretli(a.kod))
  const sonrakiAdim: string[] = []
  if (isaretli('goz')) sonrakiAdim.push('Göz tutulumu işaretli — ivedi göz hastalıkları değerlendirmesi (hekim sevki)')
  if (ek.vaskuler || ek.noro) sonrakiAdim.push('Damar / nörolojik tutulum — ilgili branş ile birlikte değerlendirme hekim kararı')
  if (isaretli('genital')) sonrakiAdim.push('Genital bölge fotoğrafı için ek onam alınır (KVKK / onam kartı)')
  if (k?.isgCriteriaMet) sonrakiAdim.push('ISG ölçütleri hekim tarafından karşılanmış işaretlendi — izlem planı hekimin')
  else sonrakiAdim.push('ISG ölçütleri tamamlanmadı — tanı hekim değerlendirmesiyle konur')

  return {
    id: 'behcet-takip',
    baslik: 'Behçet izlem kartı',
    bulgular: bulgular.length ? bulgular : ['Tutulum işaretlenmedi'],
    eksikler,
    sonrakiAdim,
    aciliyet: ivedi ? 'ivedi' : 'rutin',
    dipnotlar: [{ ref: 'ALPSOY_BEHCET', not: 'ISG ölçüt başlıkları ve organ tutulumu izlemi; tedavi kararı hekimin' }],
  }
}

// ── Büllü hastalıklar ─────────────────────────────────────────────────────────

export type BullozTakipGirdi = {
  workup: BullousWorkup | null
  /** tutulan vücut yüzey alanı yüzdesi (hekim) */
  bsaPct?: number | null
  /** mukoza tutulumu alanları */
  mukoza?: Record<string, boolean>
  /** izlem: son PDAI ve tarihi */
  pdaiOnceki?: number | null
  /** steroid / immünosupresif izlem laboratuvarı yapıldı mı (doz yazılmaz) */
  labIzlem?: boolean
  /** kemik sağlığı / enfeksiyon profilaksisi konuşuldu mu (hekim kararı) */
  eslikEdenIzlem?: boolean
}

export const BULLOZ_MUKOZA_ALANLARI: Array<{ kod: string; ad: string }> = [
  { kod: 'oral', ad: 'Ağız mukozası' },
  { kod: 'farenks', ad: 'Farenks / larenks (ses kısıklığı, yutma güçlüğü)' },
  { kod: 'goz', ad: 'Konjonktiva' },
  { kod: 'genital', ad: 'Genital mukoza' },
  { kod: 'anal', ad: 'Anal mukoza' },
  { kod: 'ozofagus', ad: 'Özofagus' },
]

export function bullozTakip(g: BullozTakipGirdi): TakipKarti {
  const w = g.workup
  const muk = g.mukoza || {}
  const bulgular: string[] = []
  if (w) {
    bulgular.push(`Nikolsky: ${w.nikolsky ? 'pozitif' : 'negatif'}`)
    bulgular.push(`DIF: ${w.dif ? 'yapıldı' : 'yapılmadı'} · IIF: ${w.iif ? 'yapıldı' : 'yapılmadı'}`)
    if (w.dsg1 != null) bulgular.push(`Dsg1: ${w.dsg1}`)
    if (w.dsg3 != null) bulgular.push(`Dsg3: ${w.dsg3}`)
    if (w.bp180 != null) bulgular.push(`BP180: ${w.bp180}`)
    if (w.pdai != null) bulgular.push(`PDAI: ${w.pdai}${g.pdaiOnceki != null ? ` (önceki ${g.pdaiOnceki})` : ''}`)
  }
  if (g.bsaPct != null) bulgular.push(`Tutulan yüzey alanı: %${g.bsaPct}`)
  const mukozaAd = BULLOZ_MUKOZA_ALANLARI.filter((m) => muk[m.kod]).map((m) => m.ad)
  if (mukozaAd.length) bulgular.push(`Mukoza tutulumu: ${mukozaAd.join(', ')}`)

  const eksikler: string[] = []
  if (!w?.dif) eksikler.push('Biyopsi + DIF — tanı DIF olmadan kilitlenmez')
  if (w?.pdai == null) eksikler.push('PDAI aktivite skoru')
  if (!g.labIzlem) eksikler.push('Sistemik tedavi laboratuvar izlemi kaydı')
  if (g.bsaPct == null) eksikler.push('Tutulan yüzey alanı (%)')

  const sonrakiAdim: string[] = []
  if (!w?.dif) sonrakiAdim.push('Perilezyonel biyopsi + DIF planlanır (hekim)')
  if (muk.farenks || muk.ozofagus) sonrakiAdim.push('Larenks / özofagus tutulumu — ilgili branş değerlendirmesi hekim kararı')
  if (muk.goz) sonrakiAdim.push('Konjonktiva tutulumu — göz hastalıkları değerlendirmesi hekim sevkiyle')
  if ((g.bsaPct ?? 0) >= 10 || mukozaAd.length >= 2) sonrakiAdim.push('Yaygın tutulum — yatış ihtiyacı hekim tarafından değerlendirilir')
  if (!g.eslikEdenIzlem) sonrakiAdim.push('Uzun süreli sistemik tedavide eşlik eden izlem (kemik sağlığı, enfeksiyon) hekim tarafından planlanır')

  const acil = (g.bsaPct ?? 0) >= 30 || muk.farenks === true
  return {
    id: 'bulloz-takip',
    baslik: 'Büllü hastalık izlem kartı',
    bulgular: bulgular.length ? bulgular : ['Bulgu girilmedi'],
    eksikler,
    sonrakiAdim,
    aciliyet: acil ? 'acil' : w?.dif ? 'rutin' : 'ivedi',
    dipnotlar: [
      { ref: 'TEMEL_DERM', not: 'Büllü hastalıkta tanı DIF ile kesinleşir' },
      { ref: 'BOLOGNIA', not: 'Aktivite ve izlem başlıkları (rol atfı); tedavi ve doz hekimin' },
    ],
  }
}

// ── BZBH izlemi ───────────────────────────────────────────────────────────────

export type BzbhTakipGirdi = {
  kind: BzbhKind
  baslangicIso?: string | null
  sonZiyaretIso?: string | null
  bugun: string
  /** Form 014 taslağı yazdırıldı / bildirim yapıldı işareti (hekim) */
  bildirimYapildi?: boolean
  /** partner / temaslı bilgilendirme (CYBE) */
  partnerBilgilendirme?: boolean
}

export function bzbhTakip(g: BzbhTakipGirdi): TakipKarti {
  const eksikler: string[] = []
  const sonrakiAdim: string[] = []
  const bulgular: string[] = []
  if (g.baslangicIso) bulgular.push(`Tanı / başlangıç: ${g.baslangicIso}`)
  if (g.sonZiyaretIso) bulgular.push(`Son ziyaret: ${g.sonZiyaretIso}`)
  if (!g.bildirimYapildi) eksikler.push('Bildirim (Form 014) hekim tarafından yapılmadı olarak işaretli')
  else bulgular.push('Bildirim hekim tarafından yapıldı olarak işaretlendi')

  const cybe = g.kind === 'sifiliz' || g.kind === 'gonore' || g.kind === 'hiv'
  if (cybe && !g.partnerBilgilendirme) eksikler.push('Partner / temaslı bilgilendirme planı')
  if (cybe) sonrakiAdim.push('CYBE algoritması: eşlik eden enfeksiyon taraması ve danışmanlık hekim tarafından planlanır')

  let gecikmis = false
  if (g.kind === 'sark_cibani' && g.baslangicIso && g.sonZiyaretIso) {
    gecikmis = sarkCibaniFollowUpOverdue({ startIso: g.baslangicIso, lastVisitIso: g.sonZiyaretIso, todayIso: g.bugun })
    sonrakiAdim.push(gecikmis ? 'Şark çıbanı izlemi gecikmiş — 3 ayda bir, 1 yıl boyunca kontrol' : 'Şark çıbanı izlemi: 3 ayda bir, 1 yıl boyunca')
    if (gecikmis) eksikler.push('Gecikmiş 3 aylık izlem ziyareti')
  }
  if (g.kind === 'hiv') sonrakiAdim.push('HIV: enfeksiyon hastalıkları ile birlikte izlem hekim sevkiyle')

  return {
    id: 'bzbh-takip',
    baslik: 'Bildirimi zorunlu hastalık izlemi',
    bulgular: bulgular.length ? bulgular : ['Kayıt girilmedi'],
    eksikler,
    sonrakiAdim,
    aciliyet: g.kind === 'hiv' || gecikmis ? 'ivedi' : 'rutin',
    dipnotlar: [
      { ref: 'BZBH_014', not: 'Bildirim yükümlülüğü; Notya canlı bildirim yapmaz — yazdırılabilir taslak' },
      { ref: 'TDD_CYBE', not: 'CYBE algoritma başlıkları; tedavi ve doz hekimin' },
    ],
  }
}

// ── Saç / tırnak ──────────────────────────────────────────────────────────────

export type SacTirnakGirdi = {
  /** SALT bölge yüzdeleri (çalışma sayfası) */
  salt?: SaltGirdisi | null
  /** doğrudan girilen SALT (eski kayıt) */
  saltToplam?: number | null
  trikoskopi?: Record<string, boolean>
  /** trikoskopi fotoğrafı sayısı (core görüntüleme) */
  trikoskopiFotoSayisi?: number
  /** çekme testi (pull test) */
  cekmeTesti?: 'pozitif' | 'negatif' | 'yapilmadi'
  /** tırnak bulguları */
  tirnak?: Record<string, boolean>
  /** kaş / kirpik tutulumu */
  kasKirpik?: boolean
}

export const TIRNAK_BULGULARI: Array<{ kod: string; ad: string }> = [
  { kod: 'pitting', ad: 'Pitting (yüzeyel çukurlaşma)' },
  { kod: 'onikoliz', ad: 'Onikolizis' },
  { kod: 'trakionisi', ad: 'Trakionişi (zımpara tırnak)' },
  { kod: 'yag_lekesi', ad: 'Yağ lekesi görünümü' },
  { kod: 'subungual_hiperkeratoz', ad: 'Subungual hiperkeratoz' },
  { kod: 'longitudinal_melanonisi', ad: 'Longitudinal melanonişi' },
  { kod: 'beau', ad: 'Beau çizgileri' },
]

export function sacTirnakTakip(g: SacTirnakGirdi): TakipKarti & { saltToplam: number | null; saltBant: string | null } {
  const bulgular: string[] = []
  const eksikler: string[] = []
  const sonrakiAdim: string[] = []

  let saltToplam: number | null = null
  let bant: string | null = null
  if (g.salt) {
    const s = saltBolgelerden(g.salt)
    saltToplam = s.toplam
    bant = s.bant
    bulgular.push(`SALT ${s.toplam} — ${s.bant}`)
    bulgular.push(s.bolgeler.map((b) => `${b.ad}: %${b.yuzde}`).join(' · '))
  } else if (g.saltToplam != null) {
    saltToplam = g.saltToplam
    bulgular.push(`SALT ${g.saltToplam} (bölge dökümü yok)`)
    eksikler.push('SALT bölge çalışma sayfası (vertex / yan / oksiput)')
  } else {
    eksikler.push('SALT skoru')
  }

  const trik = g.trikoskopi || {}
  const trikAd = TRIKOSKOPI_ALANLARI.filter((t) => trik[t.kod]).map((t) => t.ad)
  if (trikAd.length) bulgular.push(`Trikoskopi: ${trikAd.join(', ')}`)
  else eksikler.push('Trikoskopi bulgu kaydı')
  if (!g.trikoskopiFotoSayisi) eksikler.push('Trikoskopi fotoğrafı (Görüntüleme — aynı bölge, seri izlem)')
  else bulgular.push(`Trikoskopi fotoğrafı: ${g.trikoskopiFotoSayisi} kayıt`)

  if (g.cekmeTesti && g.cekmeTesti !== 'yapilmadi') bulgular.push(`Çekme testi: ${g.cekmeTesti}`)
  else eksikler.push('Çekme (pull) testi kaydı')
  if (g.kasKirpik) bulgular.push('Kaş / kirpik tutulumu var')

  const tirnakAd = TIRNAK_BULGULARI.filter((t) => (g.tirnak || {})[t.kod]).map((t) => t.ad)
  if (tirnakAd.length) bulgular.push(`Tırnak: ${tirnakAd.join(', ')}`)

  if (saltToplam != null && saltToplam >= 50) sonrakiAdim.push('Yaygın tutulum — tedavi basamağı ve izlem aralığı hekim kararı')
  if ((g.tirnak || {}).longitudinal_melanonisi) sonrakiAdim.push('Longitudinal melanonişi — dermoskopi + biyopsi kararı hekimin')
  if ((g.tirnak || {}).pitting || (g.tirnak || {}).yag_lekesi) sonrakiAdim.push('Tırnak psoriasis bulguları — eklem sorgusu (PsA triyajı) yapılır')
  sonrakiAdim.push('Karşılaştırmalı fotoğraf: aynı bölge, aynı mesafe ve ışık (seri izlem)')

  return {
    id: 'sac-tirnak-takip',
    baslik: 'Saç / tırnak izlem kartı',
    bulgular: bulgular.length ? bulgular : ['Bulgu girilmedi'],
    eksikler,
    sonrakiAdim,
    aciliyet: 'rutin',
    dipnotlar: [
      { ref: 'BOLOGNIA', not: 'Trikoskopi bulgu başlıkları ve SALT ağırlıkları (rol atfı); tanı ve tedavi hekimin' },
      { ref: 'TEMEL_DERM', not: 'TR poliklinik saç / tırnak muayene dili' },
    ],
    saltToplam,
    saltBant: bant,
  }
}

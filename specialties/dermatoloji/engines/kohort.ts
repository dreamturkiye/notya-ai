/**
 * DERM-EXCEPTIONAL-01 — Derm kohort paneli (Araçlar › Derm kohort). Pure.
 * Girdi yalnız hekimin kendi derm_* satırları: TBSE tarihi, yama kürleri, fototerapi seansları,
 * ilaç güvenlik takip tarihleri, açık derm görevleri.
 * Bayrak = takip gecikmesi / okuma penceresi; skor, doz, tanı ve evre yoktur.
 * Hatırlatma metni hasta-güvenlidir: klinik değer, tanı ve ilaç adı içermez; acil belirtilerde
 * 112 / muayenehane yönlendirmesi taşır (portal mesajı acil kanal değildir).
 */
import { annualTbseDue } from './phototherapy-log'
import { patchStatus, type PatchStatus } from './patch-calendar'
import { diffDays } from './dates'

export type DermKohortBayrak =
  | 'tbse_gecikti'
  | 'yama_okuma'
  | 'fototerapi_seans'
  | 'beta_hcg'
  | 'biyolojik_lab'
  | 'melanom_gorev'

export const DERM_BAYRAK_AD: Record<DermKohortBayrak, string> = {
  tbse_gecikti: 'TBSE zamanı geçti',
  yama_okuma: 'Yama okuma (D2 / D4)',
  fototerapi_seans: 'Fototerapi seans arası',
  beta_hcg: 'Aylık β-hCG takibi',
  biyolojik_lab: 'Biyolojik / sistemik lab',
  melanom_gorev: 'Lezyon görevi açık',
}

/** Liste penceresi (planlama görünümü, klinik aralık değil): seans arası bu kadar gün açıldıysa bayrak. */
export const FOTOTERAPI_ARA_GUN = 10
/** Bu kadar gündür seans yoksa kür bitmiş sayılır ve "ara açıldı" bayrağı düşer. */
export const FOTOTERAPI_KUR_BITTI_GUN = 60

export interface DermKohortGirdi {
  patientId: string
  ad: string
  sonTbse: string | null
  /** TBSE beklenen takipte mi (çirkin ördek işareti, nevüs/tümör ünitesi, dermoskopi uyarılı lezyon). */
  tbseTakipte: boolean
  yamaKurslari: { appliedAt: string; readD2: string | null; readD4: string | null }[]
  fototerapi: { tarih: string; yanik: boolean }[]
  ilacTakip: { ilac: string; aylikDue: string | null }[]
  tbTarama: boolean
  hbvTarama: boolean
  gorevler: { kod: string; ad: string; due: string | null; kaynak: string | null }[]
  sonVizit: string | null
  portalVar: boolean
}

export interface DermKohortSatir {
  patientId: string
  ad: string
  bayraklar: DermKohortBayrak[]
  /** en eski gecikme / en yakın pencere tarihi — sıralama ve ekranda "ne zamandan beri" */
  enErkenTarih: string | null
  detay: string[]
  sonVizit: string | null
  portalVar: boolean
}

const YAMA_ACIK: PatchStatus[] = ['open_d2', 'open_d4', 'overdue_d2', 'overdue_d4']
const YAMA_AD: Record<string, string> = {
  open_d2: 'D2 okuma zamanı',
  open_d4: 'D4 okuma zamanı',
  overdue_d2: 'D2 okuma gecikti',
  overdue_d4: 'D4 okuma gecikti',
}
const ISOTRETINOIN = /izotretinoin|isotretinoin/i
const SISTEMIK_LAB = /biyolojik|metotreksat|siklosporin|asitretin|acitretin|apremilast/i

export function dermKohortSatiri(g: DermKohortGirdi, bugun: string): DermKohortSatir {
  const bayraklar: DermKohortBayrak[] = []
  const detay: string[] = []
  const tarihler: string[] = []

  if (g.sonTbse) {
    if (annualTbseDue(g.sonTbse, bugun)) {
      bayraklar.push('tbse_gecikti')
      detay.push(`Son tüm vücut deri muayenesi ${g.sonTbse}`)
      tarihler.push(g.sonTbse)
    }
  } else if (g.tbseTakipte) {
    bayraklar.push('tbse_gecikti')
    detay.push('Tüm vücut deri muayenesi kaydı yok')
  }

  const yama = g.yamaKurslari
    .map((k) => ({ k, durum: patchStatus({ series: 'european_baseline' as const, appliedAt: k.appliedAt, readD2: k.readD2, readD4: k.readD4, photoIds: [], positives: [] }, bugun) }))
    .filter((x) => YAMA_ACIK.includes(x.durum))
  if (yama.length) {
    bayraklar.push('yama_okuma')
    for (const x of yama) { detay.push(`${YAMA_AD[x.durum]} (uygulama ${x.k.appliedAt})`); tarihler.push(x.k.appliedAt) }
  }

  const seanslar = g.fototerapi.slice().sort((a, b) => a.tarih.localeCompare(b.tarih))
  const sonSeans = seanslar[seanslar.length - 1] || null
  if (sonSeans) {
    const ara = diffDays(bugun, sonSeans.tarih)
    if (ara > FOTOTERAPI_ARA_GUN && ara <= FOTOTERAPI_KUR_BITTI_GUN) {
      bayraklar.push('fototerapi_seans')
      detay.push(`Son fototerapi seansı ${sonSeans.tarih} (${ara} gün)`)
      tarihler.push(sonSeans.tarih)
    }
    if (sonSeans.yanik) {
      if (!bayraklar.includes('fototerapi_seans')) bayraklar.push('fototerapi_seans')
      detay.push(`Son seansta yanık işaretli (${sonSeans.tarih})`)
      tarihler.push(sonSeans.tarih)
    }
  }

  const hcg = g.ilacTakip.filter((x) => ISOTRETINOIN.test(x.ilac) && x.aylikDue && x.aylikDue <= bugun)
  if (hcg.length) {
    bayraklar.push('beta_hcg')
    for (const x of hcg) { detay.push(`Aylık β-hCG takibi ${x.aylikDue}`); tarihler.push(x.aylikDue!) }
  }

  const sistemik = g.ilacTakip.filter((x) => SISTEMIK_LAB.test(x.ilac))
  const labGecikti = sistemik.filter((x) => x.aylikDue && x.aylikDue <= bugun)
  const taramaEksik = sistemik.length > 0 && (!g.tbTarama || !g.hbvTarama)
  if (labGecikti.length || taramaEksik) {
    bayraklar.push('biyolojik_lab')
    for (const x of labGecikti) { detay.push(`Sistemik tedavi lab takibi ${x.aylikDue}`); tarihler.push(x.aylikDue!) }
    if (taramaEksik) detay.push(`Tarama eksik: ${[!g.tbTarama ? 'TB' : null, !g.hbvTarama ? 'HBV' : null].filter(Boolean).join(' · ')}`)
  }

  const lezyonGorev = g.gorevler.filter((x) => x.kod.startsWith('melanom') || (x.kaynak === 'lezyon' && (!x.due || x.due <= bugun)))
  if (lezyonGorev.length) {
    bayraklar.push('melanom_gorev')
    for (const x of lezyonGorev) { detay.push(x.due ? `${x.ad} (${x.due})` : x.ad); if (x.due) tarihler.push(x.due) }
  }

  return { patientId: g.patientId, ad: g.ad, bayraklar, enErkenTarih: tarihler.sort()[0] ?? null, detay, sonVizit: g.sonVizit, portalVar: g.portalVar }
}

/** Yalnız bayraklı hastalar; en eski gecikme üstte. */
export function dermKohortSatirlari(girdiler: DermKohortGirdi[], bugun: string): DermKohortSatir[] {
  return girdiler.map((g) => dermKohortSatiri(g, bugun)).filter((s) => s.bayraklar.length > 0)
    .sort((a, b) => String(a.enErkenTarih || '9999').localeCompare(String(b.enErkenTarih || '9999')) || a.ad.localeCompare(b.ad, 'tr'))
}

export const DERM_HATIRLATMA_KONU = 'Deri kontrol hatırlatması'

/** Hasta yüzü (portal / hatırlatma) — tanı dili yok, yalnız yönlendirme. */
export const DERM_HASTA_ACIL_METNI =
  'Deride hızla büyüyen, kanayan veya rengi değişen bir leke; ateşle birlikte yaygın döküntü; ağız, göz veya genital bölgede yaygın yara; deride yaygın soyulma ya da su toplaması olursa portal mesajı beklemeyin: 112\'yi arayın veya en yakın acile / muayenehaneye başvurun.'

/** Hasta-güvenli hatırlatma: klinik değer, skor, tanı, ilaç adı yok — yalnız "zamanı geldi / randevu alın" + acil yönlendirmesi. */
export function dermHatirlatmaMesaji(bayraklar: DermKohortBayrak[]): { konu: string; metin: string } {
  const satir: string[] = []
  if (bayraklar.includes('tbse_gecikti')) satir.push('Yıllık deri kontrolünüzün (baştan ayağa ben muayenesi) zamanı geldi.')
  if (bayraklar.includes('yama_okuma')) satir.push('Yama testinizin okuma randevusu için muayenehanemizle iletişime geçin.')
  if (bayraklar.includes('fototerapi_seans')) satir.push('Fototerapi seanslarınıza ara verilmiş görünüyor; randevu için bize ulaşın.')
  if (bayraklar.includes('beta_hcg') || bayraklar.includes('biyolojik_lab')) satir.push('Tedavi takibiniz için planlanan kontrol tetkikinizin zamanı geldi.')
  if (bayraklar.includes('melanom_gorev')) satir.push('Takip ettiğimiz lekeniz için planlanan kontrolünüzün zamanı geldi.')
  if (!satir.length) satir.push('Deri kontrolünüzün zamanı geldi.')
  return {
    konu: DERM_HATIRLATMA_KONU,
    metin: `Merhaba, ${satir.join(' ')} Randevu için muayenehanemizi arayabilir veya bu mesaja yanıt yazabilirsiniz.\n\n${DERM_HASTA_ACIL_METNI}`,
  }
}

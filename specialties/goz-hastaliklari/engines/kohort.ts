/**
 * GOZ-EXCEPTIONAL-01 — Göz kohort paneli (Araçlar › Göz kohort) + hasta dosyasından hatırlatma. Pure.
 * Girdi yalnız hekimin kendi goz_* satırları: açık görevler (GA/OCT, DR tarama), planlı IVT, DR kontrol tarihi, planlı kontroller.
 * Bayrak = takip gecikmesi / yaklaşan pencere; tanı, evre, değer yok. Hatırlatma metni hasta-güvenli: klinik değer ve tanı içermez,
 * acil belirtilerde 112 / muayenehane yönlendirmesi taşır (portal mesajı acil kanal değildir).
 */
import { HASTA_ACIL_METNI } from './acil'

export type GozKohortBayrak = 'ga_oct_gecikti' | 'ivt_penceresi' | 'ivt_gecikti' | 'dr_tarama' | 'kontrol_gecikti'

export const GOZ_BAYRAK_AD: Record<GozKohortBayrak, string> = {
  ga_oct_gecikti: 'Geciken GA / OCT',
  ivt_penceresi: 'Planlı IVT (14 gün)',
  ivt_gecikti: 'Planlı IVT tarihi geçti',
  dr_tarama: 'DR tarama / kontrol zamanı',
  kontrol_gecikti: 'Kontrol zamanı geçti',
}

/** Liste penceresi (planlama görünümü, klinik aralık değil): önümüzdeki 14 gündeki planlı enjeksiyonlar. */
export const IVT_PENCERE_GUN = 14

export interface GozKohortGirdi {
  patientId: string
  ad: string
  gorevler: { kod: string; due: string | null }[]
  planliIvt: { tarih: string; goz: 'sag' | 'sol' }[]
  drSonrakiKontrol: string | null
  planliKontroller: { tarih: string; neden: string }[]
  sonVizit: string | null
  portalVar: boolean
}

export interface GozKohortSatir {
  patientId: string
  ad: string
  bayraklar: GozKohortBayrak[]
  /** en eski gecikme / en yakın pencere tarihi — sıralama ve ekranda "ne zamandan beri" */
  enErkenTarih: string | null
  detay: string[]
  sonVizit: string | null
  portalVar: boolean
}

const gunEkle = (t: string, g: number) => { const d = new Date(`${t}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + g); return d.toISOString().slice(0, 10) }
const gozKisa = (g: 'sag' | 'sol') => (g === 'sag' ? 'OD' : 'OS')

export function gozKohortSatiri(g: GozKohortGirdi, bugun: string): GozKohortSatir {
  const bayraklar: GozKohortBayrak[] = []
  const detay: string[] = []
  const tarihler: string[] = []
  const gaOct = g.gorevler.filter((x) => (x.kod === 'glokom_ga' || x.kod === 'glokom_oct') && x.due && x.due < bugun)
  if (gaOct.length) {
    bayraklar.push('ga_oct_gecikti')
    for (const x of gaOct) { detay.push(`${x.kod === 'glokom_ga' ? 'Görme alanı' : 'OCT'} ${x.due}`); tarihler.push(x.due!) }
  }
  const gecikenIvt = g.planliIvt.filter((x) => x.tarih < bugun)
  const yaklasanIvt = g.planliIvt.filter((x) => x.tarih >= bugun && x.tarih <= gunEkle(bugun, IVT_PENCERE_GUN))
  if (gecikenIvt.length) { bayraklar.push('ivt_gecikti'); for (const x of gecikenIvt) { detay.push(`IVT ${gozKisa(x.goz)} ${x.tarih} (yapıldı işaretlenmedi)`); tarihler.push(x.tarih) } }
  if (yaklasanIvt.length) { bayraklar.push('ivt_penceresi'); for (const x of yaklasanIvt) { detay.push(`IVT ${gozKisa(x.goz)} ${x.tarih}`); tarihler.push(x.tarih) } }
  const drGorev = g.gorevler.find((x) => x.kod === 'dr_tarama' && (!x.due || x.due <= bugun))
  const drKontrol = g.drSonrakiKontrol && g.drSonrakiKontrol <= bugun ? g.drSonrakiKontrol : null
  if (drGorev || drKontrol) {
    bayraklar.push('dr_tarama')
    if (drKontrol) { detay.push(`Göz dibi kontrolü ${drKontrol}`); tarihler.push(drKontrol) }
    else { detay.push('Retinopati taraması (kayıt yok)'); if (drGorev?.due) tarihler.push(drGorev.due) }
  }
  const kontrol = g.planliKontroller.filter((x) => x.tarih <= bugun)
  if (kontrol.length) { bayraklar.push('kontrol_gecikti'); for (const x of kontrol) { detay.push(`${x.neden} ${x.tarih}`); tarihler.push(x.tarih) } }
  return { patientId: g.patientId, ad: g.ad, bayraklar, enErkenTarih: tarihler.sort()[0] ?? null, detay, sonVizit: g.sonVizit, portalVar: g.portalVar }
}

/** Yalnız bayraklı hastalar; en eski gecikme üstte. */
export function gozKohortSatirlari(girdiler: GozKohortGirdi[], bugun: string): GozKohortSatir[] {
  return girdiler.map((g) => gozKohortSatiri(g, bugun)).filter((s) => s.bayraklar.length > 0)
    .sort((a, b) => String(a.enErkenTarih || '9999').localeCompare(String(b.enErkenTarih || '9999')) || a.ad.localeCompare(b.ad, 'tr'))
}

export const GOZ_HATIRLATMA_KONU = 'Göz kontrol hatırlatması'

/** Hasta-güvenli hatırlatma: klinik değer, tanı, evre, ilaç yok — yalnız "zamanı geldi / randevu alın" + acil yönlendirmesi. */
export function gozHatirlatmaMesaji(bayraklar: GozKohortBayrak[]): { konu: string; metin: string } {
  const satir: string[] = []
  if (bayraklar.includes('ga_oct_gecikti')) satir.push('Göz tetkikinizin (görme alanı / OCT) zamanı geldi.')
  if (bayraklar.includes('ivt_gecikti') || bayraklar.includes('ivt_penceresi')) satir.push('Planlanan göz içi tedavi randevunuz için muayenehanemizle iletişime geçin.')
  if (bayraklar.includes('dr_tarama')) satir.push('Göz dibi kontrolünüzün zamanı geldi.')
  if (bayraklar.includes('kontrol_gecikti')) satir.push('Göz kontrol randevunuzun zamanı geldi.')
  if (!satir.length) satir.push('Göz kontrolünüzün zamanı geldi.')
  return {
    konu: GOZ_HATIRLATMA_KONU,
    metin: `Merhaba, ${satir.join(' ')} Randevu için muayenehanemizi arayabilir veya bu mesaja yanıt yazabilirsiniz.\n\n${HASTA_ACIL_METNI}`,
  }
}

/**
 * GENEL-CERRAHI-EXCEPTIONAL-01 — Genel cerrahi kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · pre-op eksik · yara/dren gecikmiş · patoloji bekliyor · açık risk.
 * Hatırlatma klinik bilgi TAŞIMAZ (tanı, doz yok).
 */
export type GcKohortBayrak =
  | 'gecikmis_kontrol'
  | 'preop_eksik'
  | 'yara_gecikmis'
  | 'patoloji_bekliyor'
  | 'risk_acik'

export const GC_BAYRAK_AD: Record<GcKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  preop_eksik: 'Pre-op hazırlık / ameliyat günü',
  yara_gecikmis: 'Gecikmiş yara / dren / dikiş izlemi',
  patoloji_bekliyor: 'Patoloji raporu bekleniyor',
  risk_acik: 'Açık cerrahi acil bayrağı',
}

export interface GcKohortGirdi {
  patientId: string
  ad: string
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  ameliyatTarihi: string | null
  preopEksik: boolean
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
  patolojiBekliyor: boolean
}

export interface GcKohortSatir {
  patientId: string
  ad: string
  bayraklar: GcKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<GcKohortBayrak, number> = {
  risk_acik: 6,
  preop_eksik: 4,
  yara_gecikmis: 3,
  patoloji_bekliyor: 3,
  gecikmis_kontrol: 2,
}

export function gcKohortSatirlari(hastalar: GcKohortGirdi[], bugun: string): GcKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<GcKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu|taburcu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (h.preopEksik || (h.ameliyatTarihi && h.ameliyatTarihi <= bugun) || gecikmis.some((g) => /preop/.test(g.kod))) {
        b.add('preop_eksik')
      }
      if (gecikmis.some((g) => /yara|dren|dikis/.test(g.kod))) b.add('yara_gecikmis')
      if (h.patolojiBekliyor || gecikmis.some((g) => /patoloji/.test(g.kod))) b.add('patoloji_bekliyor')
      const bayraklar = [...b]
      return {
        patientId: h.patientId,
        ad: h.ad,
        bayraklar,
        gecikmisSayi: gecikmis.length,
        sonVizit: h.sonVizit,
        portalVar: h.portalVar,
        oncelik: bayraklar.reduce((s, x) => s + AGIRLIK[x], 0),
      }
    })
    .filter((s) => s.bayraklar.length)
    .sort((a, b) => b.oncelik - a.oncelik || a.ad.localeCompare(b.ad, 'tr'))
}

export function gcKohortFiltre(satirlar: GcKohortSatir[], bayraklar: GcKohortBayrak[]): GcKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function gcRecallMesaji(bayraklar: GcKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('preop_eksik') ? 'ameliyat hazırlık / işlem günü' : null,
    bayraklar.includes('yara_gecikmis') ? 'yara veya dren kontrolü' : null,
    bayraklar.includes('patoloji_bekliyor') ? 'rapor takibi' : null,
  ].filter(Boolean)
  return {
    konu: 'Kontrol / takip hatırlatması',
    metin: `Merhaba, ${nedenler.join(' ve ')} için sizinle iletişime geçmek istiyoruz. Randevu için muayenehanemizi arayın. Acil durumda 112.`,
  }
}

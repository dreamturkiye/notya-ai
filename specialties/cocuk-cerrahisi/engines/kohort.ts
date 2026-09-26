/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — Kohort paneli. SAF.
 * Bayraklar: gecikmiş kontrol · pre-op eksik · yara gecikmiş · onam/veli eksik · açık risk.
 */
export type CcKohortBayrak =
  | 'gecikmis_kontrol'
  | 'preop_eksik'
  | 'yara_gecikmis'
  | 'onam_eksik'
  | 'risk_acik'

export const CC_BAYRAK_AD: Record<CcKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  preop_eksik: 'Pre-op hazırlık / işlem günü',
  yara_gecikmis: 'Gecikmiş yara / dren / dikiş izlemi',
  onam_eksik: 'Onam / veli kontrol listesi eksik',
  risk_acik: 'Açık cerrahi acil bayrağı',
}

export interface CcKohortGirdi {
  patientId: string
  ad: string
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  ameliyatTarihi: string | null
  preopEksik: boolean
  onamEksik: boolean
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
}

export interface CcKohortSatir {
  patientId: string
  ad: string
  bayraklar: CcKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<CcKohortBayrak, number> = {
  risk_acik: 6,
  preop_eksik: 4,
  onam_eksik: 4,
  yara_gecikmis: 3,
  gecikmis_kontrol: 2,
}

export function ccKohortSatirlari(hastalar: CcKohortGirdi[], bugun: string): CcKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<CcKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu|taburcu|postop/.test(g.kod))) b.add('gecikmis_kontrol')
      if (h.preopEksik || (h.ameliyatTarihi && h.ameliyatTarihi <= bugun) || gecikmis.some((g) => /preop/.test(g.kod))) {
        b.add('preop_eksik')
      }
      if (gecikmis.some((g) => /yara|dren|dikis/.test(g.kod))) b.add('yara_gecikmis')
      if (h.onamEksik || gecikmis.some((g) => /onam|veli/.test(g.kod))) b.add('onam_eksik')
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

export function ccKohortFiltre(satirlar: CcKohortSatir[], bayraklar: CcKohortBayrak[]): CcKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

/** Hastaya/veliye giden hatırlatma — tanı, doz YOK. */
export function ccRecallMesaji(bayraklar: CcKohortBayrak[]): { konu: string; metin: string } {
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
    bayraklar.includes('onam_eksik') ? 'onam / evrak tamamlaması' : null,
  ].filter(Boolean) as string[]
  const liste = nedenler.length ? nedenler.join(' ve ') : 'kontrol randevusu'
  return {
    konu: 'Kontrol / takip hatırlatması',
    metin: `Merhaba, düzenli takibiniz kapsamında ${liste} zamanınız geldi. Uygun olduğunuz bir gün için randevu almanızı rica ederiz. Sorunuz varsa bu mesaja yanıt verebilirsiniz.`,
  }
}

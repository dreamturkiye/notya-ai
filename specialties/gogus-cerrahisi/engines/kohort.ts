/**
 * GOGUS-CERRAHISI-EXCEPTIONAL-01 — Göğüs cerrahisi kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · pre-op eksik · tüp/yara · patoloji · açık acil.
 * Hatırlatma klinik bilgi TAŞIMAZ (tanı, CAT/mMRC, doz yok).
 */
export type GcKohortBayrak =
  | 'gecikmis_kontrol'
  | 'preop_eksik'
  | 'tup_yara_izlem'
  | 'patoloji_bekliyor'
  | 'risk_acik'

export const GC_BAYRAK_AD: Record<GcKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  preop_eksik: 'Pre-op checklist eksik',
  tup_yara_izlem: 'Tüp / yara izlem',
  patoloji_bekliyor: 'Patoloji raporu bekleniyor',
  risk_acik: 'Açık toraks acil bayrağı',
}

export interface GcKohortGirdi {
  patientId: string
  ad: string
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  preopSayi: number
  tupYaraAktif: boolean
  patolojiBekliyor: boolean
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
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
  tup_yara_izlem: 4,
  patoloji_bekliyor: 3,
  preop_eksik: 2,
  gecikmis_kontrol: 2,
}

export function gcKohortSatirlari(hastalar: GcKohortGirdi[], bugun: string): GcKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<GcKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (h.preopSayi === 0 || gecikmis.some((g) => /preop/.test(g.kod))) b.add('preop_eksik')
      if (h.tupYaraAktif || gecikmis.some((g) => /tup_yara|yara|dren/.test(g.kod))) b.add('tup_yara_izlem')
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
    bayraklar.includes('preop_eksik') ? 'ameliyat öncesi hazırlık kontrolü' : null,
    bayraklar.includes('tup_yara_izlem') ? 'tüp / yara kontrolü' : null,
    bayraklar.includes('patoloji_bekliyor') ? 'patoloji raporu kontrolü' : null,
  ].filter(Boolean)
  return {
    konu: 'Kontrol / takip hatırlatması',
    metin: `Merhaba, ${nedenler.join(' ve ')} için sizinle iletişime geçmek istiyoruz. Randevu için muayenehanemizi arayın. Acil durumda 112.`,
  }
}

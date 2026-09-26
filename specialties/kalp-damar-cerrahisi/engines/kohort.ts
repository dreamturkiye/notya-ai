/**
 * KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · pre-op eksik · greft/yara · antikoag vade · açık acil.
 * Hatırlatma klinik bilgi TAŞIMAZ (tanı, SCORE2, doz yok).
 */
export type KdcKohortBayrak =
  | 'gecikmis_kontrol'
  | 'preop_eksik'
  | 'greft_yara_izlem'
  | 'antikoag_vade'
  | 'risk_acik'

export const KDC_BAYRAK_AD: Record<KdcKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  preop_eksik: 'Pre-op kontrol listesi eksik',
  greft_yara_izlem: 'Greft / yara izlem',
  antikoag_vade: 'Antikoagülan vadesi',
  risk_acik: 'Açık vasküler acil bayrağı',
}

export interface KdcKohortGirdi {
  patientId: string
  ad: string
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  preopSayi: number
  greftYaraAktif: boolean
  antikoagVade: boolean
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
}

export interface KdcKohortSatir {
  patientId: string
  ad: string
  bayraklar: KdcKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<KdcKohortBayrak, number> = {
  risk_acik: 6,
  greft_yara_izlem: 4,
  antikoag_vade: 3,
  preop_eksik: 2,
  gecikmis_kontrol: 2,
}

export function kdcKohortSatirlari(hastalar: KdcKohortGirdi[], bugun: string): KdcKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<KdcKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (h.preopSayi === 0 || gecikmis.some((g) => /preop/.test(g.kod))) b.add('preop_eksik')
      if (h.greftYaraAktif || gecikmis.some((g) => /greft_yara|yara|bypass|greft/.test(g.kod))) b.add('greft_yara_izlem')
      if (h.antikoagVade || gecikmis.some((g) => /antikoag/.test(g.kod))) b.add('antikoag_vade')
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

export function kdcKohortFiltre(satirlar: KdcKohortSatir[], bayraklar: KdcKohortBayrak[]): KdcKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function kdcRecallMesaji(bayraklar: KdcKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('preop_eksik') ? 'ameliyat öncesi hazırlık kontrolü' : null,
    bayraklar.includes('greft_yara_izlem') ? 'greft / yara kontrolü' : null,
    bayraklar.includes('antikoag_vade') ? 'ilaç izlem / lab vadesi' : null,
  ].filter(Boolean)
  return {
    konu: 'Kontrol / takip hatırlatması',
    metin: `Merhaba, ${nedenler.join(' ve ')} için sizinle iletişime geçmek istiyoruz. Randevu için muayenehanemizi arayın. Acil durumda 112.`,
  }
}

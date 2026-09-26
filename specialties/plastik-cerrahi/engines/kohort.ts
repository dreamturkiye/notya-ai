/**
 * PLASTIK-CERRAHI-EXCEPTIONAL-01 — Plastik kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · yara/greft · foto · açık acil · onam.
 * Hatırlatma klinik bilgi TAŞIMAZ (tanı, doz, işlem adı yok).
 */
export type PlastikKohortBayrak =
  | 'gecikmis_kontrol'
  | 'yara_greft_izlem'
  | 'foto_bekliyor'
  | 'risk_acik'
  | 'onam_eksik'

export const PLASTIK_BAYRAK_AD: Record<PlastikKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  yara_greft_izlem: 'Yara / greft / pansuman izlem',
  foto_bekliyor: 'Foto zaman çizgisi',
  risk_acik: 'Açık plastik acil bayrağı',
  onam_eksik: 'Onam kontrol listesi görevi',
}

export interface PlastikKohortGirdi {
  patientId: string
  ad: string
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
  fotoBekliyor: boolean
}

export interface PlastikKohortSatir {
  patientId: string
  ad: string
  bayraklar: PlastikKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<PlastikKohortBayrak, number> = {
  risk_acik: 6,
  yara_greft_izlem: 4,
  foto_bekliyor: 3,
  gecikmis_kontrol: 2,
  onam_eksik: 2,
}

export function plastikKohortSatirlari(hastalar: PlastikKohortGirdi[], bugun: string): PlastikKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<PlastikKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /pansuman|dikis|greft|flep|yara/.test(g.kod))) b.add('yara_greft_izlem')
      if (h.fotoBekliyor || gecikmis.some((g) => /foto/.test(g.kod))) b.add('foto_bekliyor')
      if (gecikmis.some((g) => /onam/.test(g.kod))) b.add('onam_eksik')
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

export function plastikKohortFiltre(satirlar: PlastikKohortSatir[], bayraklar: PlastikKohortBayrak[]): PlastikKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function plastikRecallMesaji(bayraklar: PlastikKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('yara_greft_izlem') ? 'yara / pansuman kontrolü' : null,
    bayraklar.includes('foto_bekliyor') ? 'foto / izlem kontrolü' : null,
    bayraklar.includes('onam_eksik') ? 'onam / belge işlemi' : null,
  ].filter(Boolean)
  return {
    konu: 'Kontrol / takip hatırlatması',
    metin: `Merhaba, ${nedenler.join(' ve ')} için sizinle iletişime geçmek istiyoruz. Randevu için muayenehanemizi arayın. Acil durumda 112.`,
  }
}

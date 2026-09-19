/**
 * ONKOLOJI-EXCEPTIONAL-01 — Onkoloji kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · gecikmiş kür · açık acil · toksisite izlem.
 * Hatırlatma klinik bilgi TAŞIMAZ (tanı, evre, ilaç adı, doz yok).
 */
export type OnkoKohortBayrak = 'gecikmis_kontrol' | 'kur_gecikmis' | 'toksisite_izlem' | 'risk_acik' | 'goruntu_bekliyor'

export const ONKO_BAYRAK_AD: Record<OnkoKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  kur_gecikmis: 'Gecikmiş kür / tedavi günü',
  toksisite_izlem: 'Toksisite izlem görevi',
  risk_acik: 'Açık onkoloji acil bayrağı',
  goruntu_bekliyor: 'Görüntü / rapor zaman çizelgesi',
}

export interface OnkoKohortGirdi {
  patientId: string
  ad: string
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  sonrakiKur: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
  goruntuBekliyor: boolean
}

export interface OnkoKohortSatir {
  patientId: string
  ad: string
  bayraklar: OnkoKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<OnkoKohortBayrak, number> = {
  risk_acik: 6,
  kur_gecikmis: 4,
  toksisite_izlem: 3,
  gecikmis_kontrol: 2,
  goruntu_bekliyor: 2,
}

export function onkoKohortSatirlari(hastalar: OnkoKohortGirdi[], bugun: string): OnkoKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<OnkoKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if ((h.sonrakiKur && h.sonrakiKur < bugun) || gecikmis.some((g) => /kur|tedavi|cycle/.test(g.kod))) b.add('kur_gecikmis')
      if (gecikmis.some((g) => /tox_|toksisite/.test(g.kod))) b.add('toksisite_izlem')
      if (h.goruntuBekliyor || gecikmis.some((g) => /goruntu|pet|bt|mri|rapor/.test(g.kod))) b.add('goruntu_bekliyor')
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

export function onkoKohortFiltre(satirlar: OnkoKohortSatir[], bayraklar: OnkoKohortBayrak[]): OnkoKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function onkoRecallMesaji(bayraklar: OnkoKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('kur_gecikmis') ? 'tedavi / kür günü' : null,
    bayraklar.includes('toksisite_izlem') ? 'yan etki izlem kontrolü' : null,
    bayraklar.includes('goruntu_bekliyor') ? 'görüntü / rapor kontrolü' : null,
  ].filter(Boolean)
  return {
    konu: 'Kontrol / takip hatırlatması',
    metin: `Merhaba, ${nedenler.join(' ve ')} için sizinle iletişime geçmek istiyoruz. Randevu için muayenehanemizi arayın. Acil durumda 112.`,
  }
}
